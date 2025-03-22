import { Router } from '@/controllers/router.js'
import { Auth } from '@/database/entity/Auth.js'
import { userRepository } from '@/database/index.js'
import { timer } from '@/utils/timer.js'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { z } from 'zod'

/**
 * Retorna as opções para configuração dos cookies
 * @param expirationDate Data de expiração do cookie
 */
const getCookieOptions = (expirationDate: Date) => ({
  path: '/',
  expires: expirationDate,
  httpOnly: true,
  secure: process.env.PRODUCTION,
  domain: process.env.PRODUCTION ? process.env.FRONT_END_URL : undefined,
})

const router = new Router({
  name: 'UserLogin',
  description:
    'Handles user authentication by validating credentials and issuing JWT tokens for secure access',
  schema: {
    post: z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })
  },
  methods: {
    async post({ reply, schema }) {
      const user = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.email = :email', { email: schema.email })
        .getOne()
      if (!user) return reply.code(403).send({ message: 'Invalid email or password' })
  
      const valid = await user.validatePassword(schema.password)
      if (!valid) return reply.code(403).send({ message: 'Invalid email or password' })
  
      const expiresTokenInSeconds = timer.number(process.env.JWT_EXPIRE ?? '7d') as number
      const expiresRefreshInSeconds = timer.number(process.env.REFRESH_EXPIRE ?? '7d') as number
  
      const expirationTokenDate = new Date(Date.now() + expiresTokenInSeconds)
      const expirationRefreshDate = new Date(Date.now() + expiresRefreshInSeconds)
  
      const data = {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email
      }
  
      const accessToken = jwt.sign(data, process.env.JWT_TOKEN as string, {
        expiresIn: expiresTokenInSeconds,
        algorithm: 'HS512'
      })
  
      const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN as string, {
        expiresIn: expiresRefreshInSeconds,
        algorithm: 'HS512'
      })
  
      await Auth.create({
        accessToken,
        refreshToken,
        user,
        expireAt: moment(expirationRefreshDate.toISOString()).format('YYYY-MM-DD HH:mm:ss.SSS')
      }).save()
  
  
      reply.setCookie('Bearer', accessToken, getCookieOptions(expirationTokenDate))
      reply.setCookie('Refresh', refreshToken, getCookieOptions(expirationRefreshDate))
  
      return reply.code(200).send({
        message: 'Login successful',
        data: {
          accessToken: {
            token: accessToken,
            expireDate: expirationTokenDate,
            expireSeconds: expiresTokenInSeconds
          },
          refreshToken: {
            token: refreshToken,
            expireDate: expirationRefreshDate,
            expireSeconds: expiresRefreshInSeconds
          },
        }
      })
    },
  }
})

export default router