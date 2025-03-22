import type { ZodError } from 'zod'
import { Response } from './base'

export class ErrorResponse extends Response {
  readonly error?: ZodError

  constructor(options: { message: string, error?: ZodError }) {
    super({ message: options.message })
    this.error = options.error
  }
}