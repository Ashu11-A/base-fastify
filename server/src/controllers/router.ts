import type { FastifyCompressRouteOptions } from '@fastify/compress'
import { type MethodKeys, type QueryDynamic, type RouteHandler, type RouterOptions, type SchemaDynamic } from '../types/router.js'
import type { Role } from '@/database/enums.js'

export class Router<
  Authenticate extends boolean | Role | Role[],
  const Schema extends SchemaDynamic<MethodKeys>,
  const Query extends QueryDynamic<MethodKeys>,
  Routers extends { [Method in MethodKeys]?: RouteHandler<Method, Authenticate, Query, Schema> }
> {
  public name: string
  public path?: string
  public schema?: RouterOptions<Authenticate, Schema, Query, Routers>['schema']
  public query?: RouterOptions<Authenticate, Schema, Query, Routers>['query']
  public description: string
  public compress: FastifyCompressRouteOptions['compress']
  public decompress: FastifyCompressRouteOptions['decompress']
  public authenticate: Authenticate
  public methods: Routers

  constructor(options: RouterOptions<Authenticate, Schema, Query, Routers>) {
    this.name = options.name
    this.path = options.path
    this.schema = options.schema
    this.query = options.query
    this.description = options.description
    this.authenticate = (options.authenticate ?? false) as Authenticate
    this.methods = options.methods
    this.compress = options.compress
    this.decompress = options.decompress
  }
}