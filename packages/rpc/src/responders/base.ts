import type { TReply } from "server/src/types/router"

export class Response {
  readonly message: string
  protected key: string = ''

  constructor(options: { message: string }) {
    this.message = options.message
  }

  setKey(status: keyof TReply<unknown>) {
    const key = () => {
      switch (status) {
      case 200:
        return 'OK'
      case 201:
        return 'Created'
      case 400:
        return 'Bad Request'
      case 401:
        return 'Unauthorized'
      case 403:
        return 'Forbidden'
      case 404:
        return 'Not Found'
      case 409:
        return 'Conflict'
      case 422:
        return 'Unprocessable Entity'
      case 500:
        return 'Internal Server Error'
      default:
        return 'Unknown status'
      }
    }

    this.key = key()
    return this
  }
}
