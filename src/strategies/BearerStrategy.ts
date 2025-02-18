import { User } from '@/database/entity/User.js'
import { FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { Strategy } from './Base.js'

export class BearerStrategy extends Strategy<User> {
  constructor() {
    super('bearer')
  }

  async validation(request: FastifyRequest) {
    try {
      const secret = process.env.JWT_TOKEN
      if (!secret) throw new Error('JWT_TOKEN não definido!')
      
      const token = request.headers['authorization']
      if (!token) return this.fail('Token de autenticação necessário', 401)

      const userData = jwt.verify(token, secret, { algorithms: ['HS512'] })
      if (typeof userData !== 'object' || !userData) return this.fail('Token inválido', 403)
      if (!('id' in userData) || !('uuid' in userData)) return this.fail('Token incompleto', 401)

      const { id, uuid } = userData
      const user = await User.findOneBy({ id })
      if (!user || user.uuid !== uuid) return this.fail('Usuário não encontrado', 401)

      this.success(user)
    } catch (err) {
      switch (true) {
      case (err instanceof jwt.JsonWebTokenError): return this.fail('Token JWT inválido ou expirado', 401)
      case (err instanceof jwt.TokenExpiredError): return this.fail('Token JWT expirado', 401)
      case (err instanceof jwt.NotBeforeError): return this.fail('Token JWT não é válido ainda', 401)
      default: return this.fail('Erro interno no servidor', 500)
      }
    }
  }
}
