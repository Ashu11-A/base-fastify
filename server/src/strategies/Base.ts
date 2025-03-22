import { type FastifyRequest } from 'fastify'

export abstract class Strategy<Data> {
  name: string
  authenticated: boolean = false
  data: Data | null = null
  error: StrategyError | null = null

  constructor (name: string) {
    this.name = name
  }

  abstract validation (request: FastifyRequest): Promise<Strategy<Data>> | Strategy<Data>

  success (data: Data) {
    this.data = data
    this.authenticated = true
    return this
  }

  fail (error: string, code: number) {
    this.error = new StrategyError(error, code)
    return this
  }
}

export class StrategyError {
  statusCode: number
  message: string

  constructor(error: string, code: number) {
    this.message = error
    this.statusCode = code
  }
}