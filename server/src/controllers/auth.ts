import { Role } from '@/database/entity/User.js'
import { StrategyError } from '@/strategies/Base.js'
import { type FastifyReply, type FastifyRequest } from 'fastify'

export async function authenticator (request: FastifyRequest, reply: FastifyReply, authenticate: Role | Role[] | boolean) {
  try {
    const strategies = request.server.auth.strategies.map(async (Strategy) => {
      const strategy = new Strategy()
      await strategy.validation(request)

      if (strategy.authenticated && strategy.data) {
        request.user = strategy.data
        return true
      }

      throw new Error('Not authenticated')
    })

    await Promise.any(strategies)

    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' })
    if (typeof authenticate !== 'boolean') {
      if (!Array.isArray(authenticate)) authenticate = [authenticate]

      if (!authenticate.every((role) => request.user?.role === role)) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }
    }
  } catch (error) {
    switch (true) {
    case (error instanceof StrategyError): return reply.status(error.statusCode).send({ error: error.message })
    default: return reply.status(401).send({ error: 'Unauthorized' })
    }
  }
}