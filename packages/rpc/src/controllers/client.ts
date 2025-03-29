import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios, { AxiosError } from 'axios'
import { CodesError, type ErrorData, type SucessData, type TReply } from 'server/src/types/router'
import { ErrorResponse, SuccessResponse, type SuccessResponseOptions } from '../app'

function isErrorStatus(status: number): status is typeof CodesError[number] {
  return CodesError.includes(status as typeof CodesError[number])
}

export class Client<Routers> {
  bearer?: string
  constructor(private host: string) {}

  auth ({ bearer }: { bearer: string }) {
    this.bearer = bearer
  }

  async query<
    Path extends keyof Routers,
    Method extends keyof Routers[Path],
    Router extends Routers[Path][Method]
  >(
    path: Path,
    method: Method,
    ...args: Router['auth'] extends true
      ? [
          auth: { bearer: string },
          ...request: Routers[Path][Method] extends { request: infer Req } ? [request: Req] : []
        ]
      : Routers[Path][Method] extends { request: infer Req }
        ? Req extends undefined
          ? []
          : [request: Req]
        : []
  ) {
    const { auth, request } = {
      auth: !args[0] && !args[1] ? args[0] as { bearer: string } : undefined,
      request: !args[0] && !args[1] ? args[1] : args[0]
    }
    const config: AxiosRequestConfig = {
      url: `${this.host}${String(path)}`,
      headers: {
        Authorization: `bearer ${auth}`
      },
      method: String(method).toUpperCase(),
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

      const successData = response.data as SucessData<Router['response'][Exclude<keyof Router['response'], typeof CodesError[number]>]>
      return new SuccessResponse({
        message: successData.message,
        data: successData.data,
        metadata: 'metadata' in successData ? successData.metadata : undefined
      } as SuccessResponseOptions<Router['response'][Exclude<keyof Router['response'], typeof CodesError[number]>]>).setKey(response.status as keyof TReply<unknown>)
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        return new ErrorResponse({ message: err.message }).setKey(err.status as keyof TReply<unknown>)
      }
      throw err
    }
  }
}