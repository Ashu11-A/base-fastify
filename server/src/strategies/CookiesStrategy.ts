import { User } from '@/database/entity/User.js'
import { type FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { Strategy } from './Base.js'
import { Auth } from '@/database/entity/Auth.js'

export class CookiesStrategy extends Strategy<User> {
  constructor() {
    super('cookies')
  }

  async validation(request: FastifyRequest) {
    try {
      const secret = process.env.JWT_TOKEN
      if (!secret) throw new Error('JWT_TOKEN não definido!')
      
      const cookie = request.cookies['Bearer']
      if (!cookie) return this.fail('Token de autenticação necessário', 401)

      const auth = await Auth.findOneBy({ accessToken: cookie })
      if (!auth) return this.fail('Token not found, it has been revoked', 404)
      if (!auth.valid) return this.fail('Token is invalid! weigh another one', 408)
        
      const { valid, value: token } = request.unsignCookie(cookie)
      if (!valid || !token) return this.fail('Cookie inválido', 401)

      const userData = jwt.verify(token, secret, { algorithms: ['HS512'] })
      if (typeof userData !== 'object' || !userData) return this.fail('Token inválido', 403)
      if (!('id' in userData) || !('uuid' in userData)) return this.fail('Token incompleto', 401)

      const { id, uuid } = userData
      const user = await User.findOneBy({ id })
      if (!user || user.uuid !== uuid) return this.fail('Usuário não encontrado', 401)
  

      return this.success(user)
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
