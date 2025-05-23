import type { Router } from '@/controllers/router'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z, ZodError, ZodTypeAny } from 'zod'
import type { FastifyCompressRouteOptions } from '@fastify/compress'
import type { User } from '@/database/entity/User'
import type { Role } from '@/database/enums'

/*
 * Enum for HTTP method types.
 */
export enum MethodType {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  socket = 'socket'
}

export const CodesSuccess = [200, 201] as const
export const CodesError = [401, 400, 403, 404, 409, 422, 500] as const
export type MethodKeys = keyof typeof MethodType
export type Codes = (typeof CodesSuccess[number]) | (typeof CodesError[number])

export type ErrorData = { message: string; error?: ZodError }
export type ListResponse = {
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
}
export type SucessData<TData> = {
  message: string
  data: TData
} & (TData extends unknown[] ? { metadata: ListResponse } : object)

export type TReplySuccess<TData> = {
  [Status in typeof CodesSuccess[number]]: SucessData<TData>
}

export type TReplyError = {
  [Status in typeof CodesError[number]]: ErrorData
}


export type TReply<TData> = TReplySuccess<TData> & TReplyError
export type ReplyKeys = keyof TReply<unknown>
export type ResolveReply<TData, Code extends ReplyKeys> =
  Code extends keyof TReply<TData> ? TReply<TData>[Code] : never

export type TypedReply<TData, Code extends ReplyKeys> = 
  Omit<FastifyReply, 'code'|'status'|'send'> & {
    code<C extends ReplyKeys>(statusCode: C): TypedReply<TData, C>
    status<C extends ReplyKeys>(statusCode: C): TypedReply<TData, C>
    send<D>(payload?: ResolveReply<D, Code>): { [C in Code]: ResolveReply<D, Code> }
  }

export interface CustomInstanceFastify extends FastifyRequest {
  user: User
}

export type SchemaDynamic<M extends MethodKeys> = { [K in M]?: ZodTypeAny }
export type ZodInferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = Schema[Method] extends z.ZodTypeAny
  ? z.infer<Schema[Method]>
  : unknown

export type QueryDynamic<M extends MethodKeys> = { [K in M]?: readonly string[] }
export type QueryInferredData<
  Method extends MethodKeys,
  Query extends QueryDynamic<Method>,
> = Query[Method] extends readonly (infer Key extends string)[]
  ? { [K in Key]: string | undefined }
  : unknown

export type RouteHandler<
  Method extends MethodKeys,
  Authenticate extends boolean | Role | Role[],
  Query extends QueryDynamic<Method>,
  Schema extends SchemaDynamic<Method>,
> = <
  TData,
  StatusCodes extends ReplyKeys,
  Request extends Authenticate extends true | Role | Role[] ? CustomInstanceFastify : Omit<CustomInstanceFastify, 'user'>
> (args: {
  request: Request
  reply: TypedReply<TData, StatusCodes>;
  query: QueryInferredData<Method, Query>
  schema: ZodInferredData<Method, Schema>;
}) => unknown

export type GenericRouter = Router<
  boolean,
  SchemaDynamic<MethodKeys>,
  { [Method in MethodKeys]: readonly string[] },
  { [Method in MethodKeys]: RouteHandler<Method, boolean, QueryDynamic<Method>, SchemaDynamic<Method>> }
> 

export type RouterOptions<
  Authenticate extends boolean | Role | Role[],
  Schema extends SchemaDynamic<Methods>,
  Query extends QueryDynamic<Methods>,
  Routers extends { [Method in Methods]?: RouteHandler<Method, Authenticate, Query, Schema> },
  Methods extends MethodKeys = MethodKeys,
> = {
  name: string
  path?: string
  authenticate?: Authenticate
  schema?: Schema
  query?: Query
  description: string
  methods: Routers
} & FastifyCompressRouteOptions