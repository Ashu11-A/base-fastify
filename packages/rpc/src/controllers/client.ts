import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios, { AxiosError } from 'axios'
import { CodesError, CodesSuccess, type ErrorData, type SucessData, type TReply } from 'server'
import { ErrorResponse, SuccessResponse, type SuccessResponseOptions } from '../app'
import { ZodResponse } from '../responders/zod'
import { ZodError } from 'zod'

function isErrorStatus(status: number): status is typeof CodesError[number] {
  return CodesError.includes(status as typeof CodesError[number])
}

// Tipo para extrair parâmetros da rota
type ExtractRouteParams<T extends string> = T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string | number }
  : T extends `${infer Start}:${infer Param}`
    ? { [K in Param]: string | number }
    : Record<string, never>

// Tipo para verificar se a rota tem parâmetros
type HasRouteParams<T extends string> = T extends `${string}:${string}` ? true : false

type RouterShape = {
  response: unknown
  request?: unknown
  auth?: unknown
}

// Tipo para os argumentos da query baseado na rota
type QueryArgs<
  Path extends string,
  Method extends string,
  Router extends RouterShape
> = [
  ...(HasRouteParams<Path> extends true
    ? [
        params: ExtractRouteParams<Path>,
        ...(Router extends { request: infer Req }
          ? [request: Req]
          : [])
      ]
    : Router extends { request: infer Req }
      ? [request: Req]
      : [])
]

// Extrai o tipo de dados da resposta de sucesso
type ExtractSuccessData<T> = T extends { 200: SucessData<infer U> } | { 201: SucessData<infer U> } ? U : never

export class Client<Routers extends Record<string, Record<string, RouterShape>>> {
  private accessToken?: string

  constructor(private host: string) {}

  private getAuthorizationHeader(): string | undefined {
    return this.accessToken ? `Bearer ${this.accessToken}` : undefined
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private replacePathParams(path: string, params?: Record<string, string | number>): string {
    if (!params) return path
    return path.replace(/:([^/]+)/g, (_, param) => String(params[param] ?? ''))
  }

  async query<
    Path extends keyof Routers & string,
    Method extends keyof Routers[Path] & string,
    Router extends Routers[Path][Method] & RouterShape
  >(
    path: Path,
    method: Method,
    ...args: QueryArgs<Path, Method, Router>
  ): Promise<ErrorResponse | ZodResponse | SuccessResponse<ExtractSuccessData<Router['response']>>> {
    const hasParams = String(path).includes(':')
    const params = hasParams ? args[0] as Record<string, string | number> : undefined
    const request = hasParams ? args[1] : args[0]

    if (!this.accessToken && !String(path).includes('auth')) {
      throw new Error('Por favor, chame auth() primeiro.')
    }

    const config: AxiosRequestConfig = {
      url: `${this.host}${this.replacePathParams(String(path), params)}`,
      method: String(method).toUpperCase(),
      headers: {
        ...(this.getAuthorizationHeader() && { Authorization: this.getAuthorizationHeader() })
      },
      params: method === 'get' ? Object.assign({}, request) : undefined,
      data: method !== 'get' ? Object.assign({}, request) : undefined
    }

    try {
      const response: AxiosResponse<Router['response']> = await axios(config)

      if (isErrorStatus(response.status)) {
        const errorData = response.data as ErrorData
        return new ErrorResponse({
          message: errorData.message,
          error: errorData.error,
        }).setKey(response.status)
      }

      // Se for uma resposta de login, configura automaticamente o token
      if (path === '/auth/login' && method === 'post') {
        const data = response.data as SucessData<{
          accessToken: {
            token: string
            expireDate: Date
            expireSeconds: number
          }
          refreshToken: {
            token: string
            expireDate: Date
            expireSeconds: number
          }
        }>
        if (data.data?.accessToken?.token) {
          this.setAccessToken(data.data.accessToken.token)
        }
      }

      const successData = response.data as SucessData<ExtractSuccessData<Router['response']>>
      return new SuccessResponse({
        message: successData.message,
        data: successData.data,
        metadata: 'metadata' in successData ? successData.metadata : undefined
      } as SuccessResponseOptions<ExtractSuccessData<Router['response']>>).setKey(response.status as keyof TReply<unknown>)
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.message) {
        if (err.response?.data?.error?.name === 'ZodError') {
          return new ZodResponse({ 
            message: err.response.data.message,
            error: err.response.data.error as ZodError 
          }).setKey(err.status as keyof TReply<unknown>)
        }

        return new ErrorResponse({ message: err.response?.data?.message ?? err.message }).setKey(err.status as keyof TReply<unknown>)
      }
      throw err
    }
  }
}