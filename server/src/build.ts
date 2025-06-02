import chalk from 'chalk'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { glob } from 'glob'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join, dirname as pathDirname, relative } // Added 'relative'
  from 'path'
import { MethodType, type GenericRouter } from './types/router'
import { formatPath } from './utils/path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = pathDirname(__filename)

const PROJECT_SERVER_ROOT = join(__dirname, '..') // server/
const OUTPUT_DIR = join(PROJECT_SERVER_ROOT, 'build')    // server/build/
const ROUTERS_SRC_DIR = join(PROJECT_SERVER_ROOT, 'routers') // server/routers/
const CONTROLLER_TYPE_FILE_ABS = join(__dirname, 'controllers', 'router.ts') // server/src/controllers/router.ts

interface RouterDetails {
  name: GenericRouter['name']
  path: NonNullable<GenericRouter['path']>
  importPath: string
  methods: GenericRouter['methods']
  schema?: GenericRouter['schema']
  authenticate?: GenericRouter['authenticate']
}

class Build {
  private readonly basePath = ROUTERS_SRC_DIR
  private routerDetailsList: RouterDetails[] = []

  private async loadRouters() {
    const files = await glob('**/*.ts', { cwd: this.basePath, absolute: true })
    files.sort() // Sort by absolute file path for consistent processing order

    for (const absoluteFilePath of files) {
      const relativeFilePathToRoutersDir = relative(this.basePath, absoluteFilePath)

      try {
        const fileUrl = pathToFileURL(absoluteFilePath).href
        const { default: router } = await import(fileUrl) as { default: GenericRouter }

        if (!router?.name) {
          console.log(chalk.red(`Missing export default or 'name' property in router: ${absoluteFilePath}`))
          continue
        }

        const routerName = router.name.replaceAll(' ', '')
        const routerPath = formatPath(router.path ?? relativeFilePathToRoutersDir)
        
        // Calculate the import path relative from OUTPUT_DIR to the router's absolute path
        let importPathForOutput = relative(OUTPUT_DIR, absoluteFilePath)
        importPathForOutput = importPathForOutput.replace(/\\/g, '/')
        // Remove .ts extension, as we'll add .js in the generation step
        if (importPathForOutput.endsWith('.ts')) {
          importPathForOutput = importPathForOutput.slice(0, -3)
        }

        this.routerDetailsList.push({
          name: routerName,
          path: routerPath,
          importPath: importPathForOutput, // e.g., ../routers/images/list
          methods: router.methods,
          schema: router.schema,
          authenticate: router.authenticate,
        })
      } catch (err) {
        console.log(chalk.red(`Error loading router ${absoluteFilePath}:`))
        console.error(err)
      }
    }
  }

  private generateRouterImports(): string {
    const uniqueRoutersMap = new Map<string, RouterDetails>()
    this.routerDetailsList.forEach(rd => {
      uniqueRoutersMap.set(rd.name, rd)
    })
    const sortedUniqueRoutersForImport = Array.from(uniqueRoutersMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))

    const importStatements: string[] = sortedUniqueRoutersForImport.map(rd =>
      // rd.importPath is like ../routers/images/list
      `import ${rd.name} from '${rd.importPath}.js'`
    )

    const routersByPath = new Map<string, string[]>()
    const sortedForGrouping = [...this.routerDetailsList].sort((a,b) => {
      if (a.path < b.path) return -1
      if (a.path > b.path) return 1
      return a.name.localeCompare(b.name)
    })

    for (const rd of sortedForGrouping) {
      if (!routersByPath.has(rd.path)) {
        routersByPath.set(rd.path, [])
      }
      routersByPath.get(rd.path)!.push(rd.name)
    }
    
    for (const names of routersByPath.values()) {
      names.sort((a,b) => a.localeCompare(b))
    }

    const sortedPaths = Array.from(routersByPath.keys()).sort((a, b) => a.localeCompare(b))

    const exportsContent: string[] = sortedPaths.map(path => {
      const names = routersByPath.get(path)!
      const value = names.length === 1 ? names[0] : `[${names.join(', ')}]`
      return `  '${path}': ${value}`
    })

    return [
      ...importStatements,
      `\nexport const routers = {\n${exportsContent.join(',\n')}\n}\n`
    ].join('\n')
  }

  private generateRpcTypes(): string {
    // Calculate relative path from OUTPUT_DIR (server/build/) to CONTROLLER_TYPE_FILE_ABS (server/src/controllers/router.ts)
    let controllerTypeImportPath = relative(OUTPUT_DIR, CONTROLLER_TYPE_FILE_ABS)
    controllerTypeImportPath = controllerTypeImportPath.replace(/\\/g, '/').replace(/\.ts$/, '.js')
    // Expected: ../src/controllers/router.js

    const commonStaticImports = [
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      'import type { z } from \'zod\'',
      `import type { Router } from '${controllerTypeImportPath}'`
    ]

    const uniqueRoutersMap = new Map<string, RouterDetails>()
    this.routerDetailsList.forEach(rd => {
      uniqueRoutersMap.set(rd.name, rd)
    })
    const sortedUniqueRoutersForImport = Array.from(uniqueRoutersMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
    
    const routerSpecificImportStatements: string[] = sortedUniqueRoutersForImport.map(rd =>
      // rd.importPath is like ../routers/images/list
      `import type ${rd.name} from '${rd.importPath}.js'`
    )

    const allImportStatements = [...commonStaticImports, ...routerSpecificImportStatements]

    const typeHelperStrings = [
      'type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? { [K in keyof R]: R[K] }: never',
      'type UnwrapPromise<T> = T extends Promise<any> ? Awaited<T> : T',
      'type FirstParameter<T> = T extends Router<infer First, any, any, any> ? First : never',
    ]

    const rpcMethodDefinitionsByPath = new Map<string, string[]>()

    for (const rd of this.routerDetailsList) {
      if (!rpcMethodDefinitionsByPath.has(rd.path)) {
        rpcMethodDefinitionsByPath.set(rd.path, [])
      }
      const methodDefinitionsForCurrentPath = rpcMethodDefinitionsByPath.get(rd.path)!

      const httpMethods = Object.keys(rd.methods || {}) as MethodType[]
      httpMethods.sort((a, b) => a.localeCompare(b))

      for (const methodType of httpMethods) {
        if (!rd.methods || typeof rd.methods[methodType] !== 'function') continue

        const responseType = `MergeUnion<UnwrapPromise<ReturnType<typeof ${rd.name}.methods.${methodType}>>>`
        const requestType = rd.schema?.[methodType]
          ? `z.infer<NonNullable<typeof ${rd.name}.schema>['${methodType}']>`
          : 'undefined'
        const authType = rd.authenticate
          ? `FirstParameter<typeof ${rd.name}>`
          : 'undefined'

        methodDefinitionsForCurrentPath.push(`    ${methodType}: {
      response: ${responseType},
      request: ${requestType},
      auth: ${authType}
    }`)
      }
    }

    const sortedPathsForRpc = Array.from(rpcMethodDefinitionsByPath.keys()).sort((a, b) => a.localeCompare(b))
    
    const routeTypeEntries: string[] = []
    for (const path of sortedPathsForRpc) {
      const methodDefinitionStrings = rpcMethodDefinitionsByPath.get(path)!
      methodDefinitionStrings.sort((a, b) => {
        const methodA = a.trim().split(':')[0]
        const methodB = b.trim().split(':')[0]
        return methodA.localeCompare(methodB)
      })

      if (methodDefinitionStrings.length > 0) {
        routeTypeEntries.push(`  '${path}': {\n${methodDefinitionStrings.join(',\n')}\n  }`)
      }
    }

    return [
      allImportStatements.join('\n'),
      typeHelperStrings.join('\n'),
      `\nexport type Routers = {\n${routeTypeEntries.join(',\n')}\n}`
    ].join('\n\n')
  }

  async build(): Promise<void> {
    await this.loadRouters()
    if (!existsSync(OUTPUT_DIR)) {
      await mkdir(OUTPUT_DIR, { recursive: true })
    }

    const routersFileContent = this.generateRouterImports()
    const rpcFileContent = this.generateRpcTypes()

    await Promise.all([
      writeFile(join(OUTPUT_DIR, 'routers.ts'), routersFileContent),
      writeFile(join(OUTPUT_DIR, 'rpc.ts'), rpcFileContent)
    ])
    console.log(chalk.green('Build completed successfully. Output files are routers.ts and rpc.ts in server/build/.'))
    process.exit(0)
  }
}

new Build().build().catch(err => {
  console.error(chalk.red('Build failed:'), err)
  process.exit(1)
})