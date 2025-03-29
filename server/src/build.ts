import chalk from "chalk"
import { writeFile } from 'fs/promises'
import { glob } from "glob"
import { join } from "path"
import { MethodType, type GenericRouter } from "./types/router"
import { formatPath } from "./registers/routers"

class Build {
  private readonly basePath = join(import.meta.dirname, '../routers')
  private routers = new Map<string, GenericRouter>()

  private async loadRouters() {
    const files = await glob('**/*.ts', { cwd: this.basePath })

    for (const file of files) {
      const filePath = join(this.basePath, file)

      try {
        const { default: router } = await import(filePath) as { default: GenericRouter }

        if (!router?.name) {
          console.log(chalk.red(`Missing export default in route: ${filePath}`))
          continue
        }

        router.name = router.name.replaceAll(' ', '')
        router.path = formatPath(router?.path ?? file)
        this.routers.set(file, router)
      } catch (err) {
        console.log(chalk.red(`Error loading router ${filePath}: ${err}`))
      }
    }
  }

  private generateRouterImports(): string {
    const imports: string[] = []
    const exportsContent: string[] = [];

    for (const [fileName, router] of this.routers.entries()) {
      const normalizedPath = join('routers', fileName).replace(/\\/g, '/')
      imports.push(`import ${router.name} from '../../${normalizedPath}'`)
      exportsContent.push(`  '${router.path}': ${router.name}`)
    }

    return [
      ...imports,
      `\nexport const routers = {\n${exportsContent.join(',\n')}\n}\n`
    ].join('\n').replace(/\.ts/g, '.js')
  }

  private generateRpcTypes(): string {
    const routes: string[] = []
    const imports = [
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      'import type { z } from \'zod\'',
      'import type { Router } from \'../controllers/router.js\''
    ]

    const typeHelpers = [
      'type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? { [K in keyof R]: R[K] }: never',
      'type UnwrapPromise<T> = T extends Promise<any> ? Awaited<T> : T',
      'type FirstParameter<T> = T extends Router<infer First, any, any> ? First : never',
    ]

    for (const [fileName, router] of this.routers.entries()) {
      const normalizedPath = join('routers', fileName).replace(/\\/g, '/')

      imports.push(`import ${router.name} from '../../${normalizedPath}'`);
      if (!router.path) continue

      const methods: string[] = []
      for (const methodType of Object.values(MethodType)) {
        const method = router.methods[methodType]
        if (typeof method !== 'function') continue

        const responseType = `MergeUnion<UnwrapPromise<ReturnType<typeof ${router.name}.methods.${methodType}>>>`
        const requestType = router.schema?.[methodType]
          ? `z.infer<NonNullable<typeof ${router.name}.schema>['${methodType}']>`
          : 'undefined'
        const authType = router.authenticate
          ? `FirstParameter<typeof ${router.name}>`
          : 'undefined'

        methods.push(`${methodType}: {
      response: ${responseType},
      request: ${requestType},
      auth: ${authType}
    }`)
      }

      if (methods.length > 0) {
        routes.push(`'${router.path}': {
    ${methods.join(',\n  ')}
  }`);
      }
    }

    return [
      imports.join('\n'),
      typeHelpers.join('\n'),
      `export type Routers = {\n  ${routes.join(',\n  ')}\n}`
    ].join('\n\n').replace(/\.ts/g, '.js')
  }

  async build(): Promise<void> {
    await this.loadRouters()

    await Promise.all([
      writeFile('src/build/routers.ts', this.generateRouterImports()),
      writeFile('src/build/rpc.ts', this.generateRpcTypes())
    ])
  }

}

await new Build().build()