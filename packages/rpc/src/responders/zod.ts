import type { ZodError, ZodIssue } from 'zod'
import { Response } from './base'

export class ZodResponse extends Response {
  readonly error: {
    issues: ZodIssue[]
    name: string
  }

  constructor(options: { message: string; error: ZodError }) {
    super({ message: options.message })
    this.error = {
      issues: options.error.issues,
      name: options.error.name
    }
  }

  getFirstError(): string {
    return this.error.issues[0]?.message || this.message
  }

  getFieldErrors(): Record<string, string> {
    return this.error.issues.reduce((acc, issue) => {
      const field = issue.path.join('.')
      acc[field] = issue.message
      return acc
    }, {} as Record<string, string>)
  }
} 