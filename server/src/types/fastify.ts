import { User } from '@/database/entity/User.js'
import { BearerStrategy } from '@/strategies/BearerStrategy.js'
import { CookiesStrategy } from '@/strategies/CookiesStrategy.js'
import type { Server } from 'socket.io'

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface PassportUser extends User {}
  interface FastifyInstance {
    io: Server
    // request.server.auth
    auth: {
      strategies: (typeof BearerStrategy | typeof CookiesStrategy)[]
    }
  }
  interface FastifyRequest {
    user?: User
  }
}
