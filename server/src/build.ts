import chalk from "chalk"
import { writeFile } from 'fs/promises'
import { glob } from "glob"
import { join } from "path"
import { MethodType, type GenericRouter } from "./types/router"
import { formatPath } from "./registers/routers"

class Build {
  path = join(import.meta.dirname, '../routers')
  routers: Map<string, GenericRouter> = new Map()

  async loader () {
    const files = await glob('**/*.ts', { cwd: this.path })

    for (const file of files) {
        const filePath = join(this.path, file)
        const { default: router } = await import(filePath) as { default: GenericRouter }
        if (router === undefined || router?.name === undefined) {
          console.log(chalk.red(`Put export default in the route: ${filePath}`))
          continue
        }
        
        router.name = router.name.replaceAll(' ', '')
        router.path = formatPath(router?.path ?? file)
        this.routers.set(file, router)
    }
  }

  async bundle () {
      const imports: string[] = []
      const exports: Record<string, string> = {}
  
      for (const [fileName, router] of Array.from(this.routers.entries())) {
        imports.push(`import ${router.name} from '../../${join('routers', fileName)}'`)
        exports[router.path ?? formatPath(router?.path ?? fileName)] = router.name
      }
  
      imports.push(`\nexport const routers = {
${Object.entries(exports).map(([path, name]) => `  '${path}': ${name}`).join(',\n')}
}`)
      writeFile('src/build/routers.ts', imports.join('\n').replaceAll('.ts', '.js'))
    }

  async rpc () {
    const imports: string[] = []
    const types: string[] = []
    const routes = new Map<string, {
      [Method in keyof typeof MethodType]?: { 
        response: string
        request: string
      }
    }>()

    imports.push('/* eslint-disable @typescript-eslint/no-explicit-any */')
    imports.push('import type { z } from \'zod\'')
    imports.push('import type { Router } from \'../controllers/router.js\'')
    types.push(`
type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? { [K in keyof R]: R[K] }: never
type UnwrapPromise<T> = T extends Promise<any> ? Awaited<T> : T
type FirstParameter<T> = T extends Router<infer First, any, any> ? First : never;`.trim())

    for (const [fileName, router] of Array.from(this.routers.entries())) {
      imports.push(`import ${router.name} from '../../${join('routers', fileName)}'`)

      for (const [type, method] of Object.entries(router.methods)) {
        if (
          !Object.keys(MethodType).includes(type)
          || typeof method !== 'function'
          || !router.path
        ) continue

        routes.set(router.path, {
          ...routes.get(router.path),
          [type]: {
            response: `MergeUnion<UnwrapPromise<ReturnType<typeof ${router.name}.methods.${type}>>>`,
            request: router.schema?.[type as MethodType] ? `z.infer<NonNullable<typeof ${router.name}.schema>['${type}']>` : undefined,
            auth: router.authenticate ? `FirstParameter<typeof ${router.name}>` : undefined
          }
        })
      }
    }

    imports.push('\n' + types.join('\n') + '\n')
    imports.push(`export type Routers = ${
  JSON.stringify(Object.fromEntries(routes), null, 2)
    .replaceAll('"', '\'')
    .replaceAll('\'MergeUnion', 'MergeUnion')
    .replaceAll('>\'', '>')
    .replaceAll('\'z.infer', 'z.infer')
    .replaceAll(']>\'', ']>')
    .replaceAll('.ts', '')
    .replaceAll('\'FirstParameter', 'FirstParameter')}
`)
    writeFile('src/build/rpc.ts', imports.join('\n').replaceAll('.ts', '.js'))
  }
}

const build = new Build()
await build.loader()
await build.rpc()
await build.bundle()