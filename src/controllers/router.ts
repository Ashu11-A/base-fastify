 
import { Role } from '@/database/entity/User.js'
import chalk from 'chalk'
import { FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify'
import { glob } from 'glob'
import { join } from 'path'
import { ZodObject, ZodRawShape } from 'zod'
import { MethodType, ReplyKeysToCodes, ReplyType, ResolveReplyType, RouteHandler, type RouterOptions } from '../types/router.js'
import { authenticator } from './auth.js'
import { Fastify } from './fastify.js'

/**
 * Our Router class.  
 * We add an index signature so that the compiler knows that extra properties (like 'get')
 * may be present.
 */
export class Router<
  Schema extends ZodRawShape,
  Authenticate extends boolean | Role | Role[],
  Methods extends Partial<Record<MethodType, RouteHandler<Authenticate, Schema>>>,
> {
  static all: Router<ZodRawShape, boolean, Partial<Record<MethodType, RouteHandler<boolean, ZodRawShape>>>>[] = []

  public name: string
  public path?: string
  public schema?: ZodObject<Schema>
  public description: string
  public authenticate: Authenticate
  public methods: Methods

  constructor(options: RouterOptions<Authenticate, Schema, Methods>) {
    const { name, path, schema, description, authenticate, delete: deleteHandle, get, post, put, websocket } = options
    this.name = name
    this.path = path
    this.schema = schema
    this.description = description
    this.authenticate = (authenticate ?? false) as Authenticate
    this.methods = {
      delete: deleteHandle,
      get,
      post,
      put,
      websocket
    };

    (Router.all as unknown as Router<Schema, Authenticate, Methods>[]).push(this)
  }

  static async register () {
    const pathRouter = join(import.meta.dirname, '../../routers')
    const routers = await glob('**/*.ts', { cwd: pathRouter })

    for (const file of routers) {
      const filePath = join(pathRouter, file)
      const { default: router } = await import(filePath) as { default: Router<ZodRawShape, boolean, object> }
      if (router === undefined) {
        console.log(chalk.red(`Put export default in the route: ${filePath}`))
        continue
      }
      
      router.path = router?.path ?? file
    }

    for (const [index, router] of Object.entries(Router.all)) {
      let path = router.path as string

      path = path
        .replace(/\.(ts|js)$/i, '') // Remove extensões ".ts" ou ".js"
        .replace('index', '')       // Remove "/index" para deixar "/"
        .replace(/\([^)]*\)/g, '')  // Remove parênteses e seu conteúdo
        .replace(/[/\\]+$/, '')    // Remove barras finais "/" ou "\"
        .replace(/\\/g, '/')        // Converte "\" para "/"
      
      // Garante que o path comece com '/'
      if (!path.startsWith('/')) path = '/' + path

      Router.all[Number(index)].path = path
      
      for (const [type, method] of Object.entries(router.methods)) {
        if (!Object.keys(MethodType).includes(type) || typeof method !== 'function') continue
        const auth = router.authenticate
          ? {
            preValidation: (request, reply) => authenticator(request, reply, router.authenticate)
          } satisfies RouteShorthandOptions
          : {}
        const response = (request: FastifyRequest, reply: FastifyReply) => {
          const parsed = router.schema?.safeParse(request.body)

          if (parsed !== undefined && !parsed.success) return reply.code(400).send({
            message: parsed.error.name,
            error: parsed.error
          })

          return method({
            request,
            reply: (reply as ReplyType<ReplyKeysToCodes<unknown>, ResolveReplyType<unknown, ReplyKeysToCodes<unknown>>>),
            schema: parsed?.data ?? {}
          })
        }

        switch(type) {
        case MethodType.get: {
          Fastify.server.get(path, auth, response)
          break
        }
        case MethodType.post: {
          Fastify.server.post(path, auth, response)
          break
        }
        case MethodType.put: {
          Fastify.server.put(path, auth, response)
          break
        }
        case MethodType.delete: {
          Fastify.server.delete(path, auth, response)
          break
        }
        case MethodType.websocket: {
          Fastify.server.get(path, { websocket: true, ...auth }, () => {})
        }
        }
      }

      console.log(chalk.green(`
📡 The route ${chalk.blueBright(path)} has been successfully registered!
    🏷️  Route Name: ${chalk.cyan(router.name)}
    📃 Description: ${chalk.yellow(router.description)}
    📋 Methods: ${chalk.magenta(Object.keys(router.methods).filter((method) => (router.methods)[(method as MethodType)] !== undefined).join(', '))}
      `))
      
    }
  }
}