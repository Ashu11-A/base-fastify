import type { Role } from '@/database/entity/User.js'
import type { FastifyCompressRouteOptions } from '@fastify/compress'
import { type MethodKeys, type RouteHandler, type RouterOptions, type SchemaDynamic } from '../types/router.js'

export class Router<
  Authenticate extends boolean | Role | Role[],
  Schema extends SchemaDynamic<MethodKeys>,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Method, Authenticate, Schema> }
> {
  public name: string
  public path?: string
  public schema?: RouterOptions<Authenticate, Schema, Routers>['schema']
  public description: string
  public compress: FastifyCompressRouteOptions['compress']
  public decompress: FastifyCompressRouteOptions['decompress']
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
    this.compress = options.compress
    this.decompress = options.decompress
  }
}