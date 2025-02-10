import { Role, User } from '@/database/entity/User.js'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { z, ZodError, ZodObject, ZodRawShape } from 'zod'

/**
 * Enum for HTTP method types.
 */
export enum MethodType {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
  websocket = 'websocket'
}

/**
 * Error response type.
 */
export type TErrorResponse = {
  message: string
  toast?: string
}

/**
 * Success response base type.
 */
export type TReplySuccess<TData> = {
  message: string
  data?: TData
}

/**
 * List response type.
 */
export type ListResponse<T> = {
  data: T[]
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
}

/**
 * Error reply types mapped by HTTP status code.
 */
export type TReplyError = {
  [Status in 401 | 403 | 404 | 422 | 500]: TErrorResponse
}

// Tipo genérico de resposta com status diferentes
export type TReply<TData> = {
  200: TReplySuccess<TData>
  201: TReplySuccess<TData>
  202: ListResponse<TData>
  302: {
    url: string
    message: string
    shouldRedirect?: boolean
  }
  400: TErrorResponse & { error: ZodError }
} & TReplyError

/**
 * Helper type to extract response type for a given HTTP status code.
 */
export type InferReplyType<TData, Code extends keyof TReply<TData>> = TReply<TData>[Code]

/**
 * Infers the data type from a Zod schema.
 */
export type ZodInferredData<Schema extends ZodRawShape> = z.infer<ZodObject<Schema>>

/**
 * Mapeia as chaves da resposta para os códigos HTTP.
 */
export type ReplyKeysToCodes<TData> = keyof TReply<TData>

/**
 * Resolve o tipo de resposta com base no código HTTP.
 */
export type ResolveReplyType<TData, Code extends keyof TReply<TData>> =
  Code extends keyof TReply<TData> ? TReply<TData>[Code] : never


/**
 * Tipo de resposta genérico para o FastifyReply, garantindo que `send` e `status` aceitem corretamente o tipo inferido.
 */
export type ReplyType<
  Code extends ReplyKeysToCodes<unknown>,
  Result extends ResolveReplyType<unknown, Code>
> = Omit<
  FastifyReply,
  'code' | 'status' | 'send'
> & {
  code<Code extends ReplyKeysToCodes<unknown>>(statusCode: Code): ReplyType<Code, ResolveReplyType<unknown, Code>>
  status<Code extends ReplyKeysToCodes<unknown>>(statusCode: Code): ReplyType<Code, ResolveReplyType<unknown, Code>>
  send(payload?: Result): ReplyType<Code, Result>,
}

interface CustomInstanceFastify extends FastifyRequest {
  user: User
}

/**
 * Type definition for a route handler.
 *
 * @template TSchema - the Zod shape used for validating request data.
 * @template TData - the data type inferred from the provided Zod schema.
 * @template Code - the HTTP status code for which this handler returns a response.
 */
export type RouteHandler<
  Authenticate extends boolean | User['role'] | User['role'][],
  Schema extends ZodRawShape,
  Code extends keyof TReply<TData> = keyof TReply<unknown>,
  TData = unknown,
> = ({
  request,
  reply,
  schema,
}: {
  request: Authenticate extends true | Role | Role[]
    ? CustomInstanceFastify
    : Omit<CustomInstanceFastify, 'user'>,
  reply: ReplyType<Code, ResolveReplyType<TData, Code>>,
  schema: ZodInferredData<Schema>
}) =>
    | ReplyType<Code, ResolveReplyType<TData, Code>>
    | Promise<ReplyType<Code, ResolveReplyType<TData, Code>>>

/**
 * The options for defining a router.
 *
 * The generic parameters are:
 * - TSchema: the shape for validation (via Zod) of the request data.
 * - TMethods: a partial record of HTTP methods to their route handlers.
 *
 * The data type for the route handlers is automatically inferred from TSchema.
 */
export type RouterOptions<
  Authenticate extends boolean | User['role'] | User['role'][],
  Schema extends ZodRawShape,
  Methods extends Partial<Record<MethodType, RouteHandler<Authenticate, Schema>>>,
> = {
  name: string
  path?: string
  authenticate?: Authenticate
  schema?: ZodObject<Schema, 'strip'>
  description: string
} & Methods