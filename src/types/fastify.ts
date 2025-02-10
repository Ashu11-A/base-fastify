import { User } from '@/database/entity/User.js'
import { BearerStrategy } from '@/strategies/BearerStrategy.js'
import { CookiesStrategy } from '@/strategies/CookiesStrategy.js'

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface PassportUser extends User {}
  interface FastifyInstance {
    // request.server.auth
    auth: {
      strategies: (typeof BearerStrategy | typeof CookiesStrategy)[]
    }
  }
}
