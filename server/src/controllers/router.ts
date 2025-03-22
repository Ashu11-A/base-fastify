import type { Role } from '@/database/entity/User.js'
import chalk from 'chalk'
import { type FastifyReply, type FastifyRequest, type RouteShorthandOptions } from 'fastify'
import { glob } from 'glob'
import { join } from 'path'
import { MethodType, type MethodKeys, type ReplyKeys, type RouteHandler, type RouterOptions, type SchemaDynamic, type TypedReply } from '../types/router.js'
import { authenticator } from './auth.js'
import { Fastify } from './fastify.js'
import { writeFile } from 'fs/promises'

export class Router<
  Authenticate extends boolean | Role | Role[],
  Schema extends SchemaDynamic<MethodKeys>,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Method, Authenticate, Schema> }
> {
  public name: string
  public path?: string
  public schema?: RouterOptions<Authenticate, Schema, Routers>['schema']
  public description: string
  public authenticate: Authenticate
  public methods: Routers

  constructor(options: RouterOptions<Authenticate, Schema, Routers>) {
    const { name, path, schema, description, authenticate, methods } = options
    this.name = name
    this.path = path
    this.schema = schema
    this.description = description
    this.authenticate = (authenticate ?? false) as Authenticate
    this.methods = methods
  }

  static async register () {
    const path = join(import.meta.dirname, '../../routers')
    const routers = await glob('**/*.ts', { cwd: path })
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
    imports.push('import type { Router } from \'./controllers/router.js\'')
    types.push(`
type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? { [K in keyof R]: R[K] }: never
type UnwrapPromise<T> = T extends Promise<any> ? Awaited<T> : T
type FirstParameter<T> = T extends Router<infer First, any, any> ? First : never;`.trim())

    for (const file of routers) {
      const filePath = join(path, file)
      const { default: router } = await import(filePath) as { default: Router<boolean, SchemaDynamic<MethodKeys>, { [Method in MethodKeys]: RouteHandler<Method, boolean, SchemaDynamic<Method>> }> }
      if (router === undefined || router?.name === undefined) {
        console.log(chalk.red(`Put export default in the route: ${filePath}`))
        continue
      }
      const routerName = router.name.replaceAll(' ', '')
      router.path = (router?.path ?? file)
        .replace(/\.(ts|js)$/i, '') // Remove extensões ".ts" ou ".js"
        .replace('index', '')       // Remove "/index" para deixar "/"
        .replace(/\([^)]*\)/g, '')  // Remove parênteses e seu conteúdo
        .replace(/[/\\]+$/, '')     // Remove barras finais "/" ou "\"
        .replace(/\\/g, '/')        // Converte "\" para "/"
      // Garante que o path comece com '/'
      if (!router.path.startsWith('/')) router.path = '/' + router.path

      imports.push(`import ${routerName} from '../${join('routers', file)}'`)

      for (const [type, method] of Object.entries(router.methods)) {
        if (!Object.keys(MethodType).includes(type) || typeof method !== 'function') continue
    
        routes.set(router.path, {
          ...routes.get(router.path),
          [type]: {
            response: `MergeUnion<UnwrapPromise<ReturnType<typeof ${routerName}.methods.${type}>>>`,
            request: router.schema?.[type as MethodType] ? `z.infer<NonNullable<typeof ${routerName}.schema>['${type}']>` : undefined,
            auth: router.authenticate ? `FirstParameter<typeof ${routerName}>` : undefined
          }
        })

        const options: RouteShorthandOptions = {
          ...(router.authenticate
            ? {
              preValidation: (request, reply) => authenticator(request, reply, router.authenticate),
  
            }
            : {})
        }

        const response = (request: FastifyRequest, reply: FastifyReply) => {
          const parsed = router.schema?.[type as MethodType]?.safeParse(request.body)
  
          if (parsed !== undefined && !parsed.success) return reply.code(400).send({
            message: parsed.error.name,
            error: parsed.error
          })
  
          return method({
            request,
            reply: (reply as unknown as TypedReply<unknown, ReplyKeys>),
            schema: parsed?.data ?? {}
          })
        }
  
        switch(type) {
        case MethodType.get: {
          Fastify.server.get(router.path as string, options, response)
          break
        }
        case MethodType.post: {
          Fastify.server.post(router.path as string, options, response)
          break
        }
        case MethodType.put: {
          Fastify.server.put(router.path as string, options, response)
          break
        }
        case MethodType.delete: {
          Fastify.server.delete(router.path as string, options, response)
          break
        }
        case MethodType.socket: {
          Fastify.server.get(router.path as string, options, () => {})
        }
        }
      }

      console.log([
        '',
        `📡 The route ${chalk.blueBright(router.path)} has been successfully registered!`,
        `    🏷️  Route Name: ${chalk.cyan(router.name)}`,
        `    📃 Description: ${chalk.yellow(router.description)}`,
        `    📋 Methods: ${chalk.magenta(Object.keys(router.methods).filter((method) => (router.methods)[(method as MethodType)] !== undefined).join(', '))}`,
        ''
      ].map((text) => chalk.green(text)).join('\n'))
    }

    imports.push('\n' + types.join('\n') + '\n')
    imports.push(`
export type Routers = ${
  JSON.stringify(Object.fromEntries(routes), null, 2)
    .replaceAll('"', '\'')
    .replaceAll('\'MergeUnion', 'MergeUnion')
    .replaceAll('>\'', '>')
    .replaceAll('\'z.infer', 'z.infer')
    .replaceAll(']>\'', ']>')
    .replaceAll('.ts', '')
    .replaceAll('\'FirstParameter', 'FirstParameter')}
`)
    writeFile('src/rpc.ts', imports.join('\n').replaceAll('.ts', '.js'))
  }
}