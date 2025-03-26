import type { Router } from '@/controllers/router'
import { Role, User } from '@/database/entity/User.js'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z, ZodError, ZodTypeAny } from 'zod'
import type { FastifyCompressRouteOptions } from '@fastify/compress'

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
export type ZodInferredData<
  Method extends MethodKeys,
  Schema extends SchemaDynamic<Method>,
> = Schema[Method] extends z.ZodTypeAny
  ? z.infer<Schema[Method]>
  : unknown
export type SchemaDynamic<M extends MethodKeys> = { [K in M]?: ZodTypeAny }
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

export type RouteHandler<
  Method extends MethodKeys,
  Authenticate extends boolean | Role | Role[],
  Schema extends SchemaDynamic<Method>,
> = <
  TData,
  StatusCodes extends ReplyKeys
> (args: {
  request: Authenticate extends true | Role | Role[] ? CustomInstanceFastify : Omit<CustomInstanceFastify, 'user'>
  reply: TypedReply<TData, StatusCodes>;
  schema: ZodInferredData<Method, Schema>;
}) => unknown

export type GenericRouter = Router<boolean, SchemaDynamic<MethodKeys>, { [Method in MethodKeys]: RouteHandler<Method, boolean, SchemaDynamic<Method>> }> 

export type RouterOptions<
  Authenticate extends boolean | Role | Role[],
  Schema extends SchemaDynamic<Methods>,
  Routers extends { [Method in Methods]?: RouteHandler<Method, Authenticate, Schema> },
  Methods extends MethodKeys = MethodKeys,
> = {
  name: string
  path?: string
  authenticate?: Authenticate
  schema?: Schema
  description: string
  methods: Routers
} & FastifyCompressRouteOptions