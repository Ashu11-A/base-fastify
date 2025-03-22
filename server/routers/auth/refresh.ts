import { Router } from '@/controllers/router.js'
import { Auth } from '@/database/entity/Auth.js'
import { authTreeRepository } from '@/database/index.js'
import { type JWTData } from '@/types/jwt.js'
import { timer } from '@/utils/timer.js'
import jwt from 'jsonwebtoken'
import moment from 'moment'

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

export default new Router({
  name: 'refresh',
  description: 'Creates new access and refresh tokens',
  authenticate: false,
  methods: {
    async post({ reply, request }) {
      const refreshSecret = process.env.REFRESH_TOKEN
      if (!refreshSecret) return reply.status(422).send({ message: 'REFRESH_TOKEN is undefined!' })
  
      const tokenSecret = process.env.JWT_TOKEN
      if (!tokenSecret) return reply.status(422).send({ message: 'JWT_TOKEN is undefined!' })
  
      const refreshTokenCookie = request.cookies['Refresh']?.replaceAll('Refresh', '').trim()
      if (!refreshTokenCookie)
        return reply.status(422).send({ message: 'Refresh token cookie is undefined' })
  
      const auth = await Auth.findOne({ where: { refreshToken: refreshTokenCookie } })
      if (!auth) return reply.status(422).send({ message: 'Authentication not found' })
  
      if (!auth.valid) {
        const ancestors = await authTreeRepository.findAncestors(auth)
        const descendants = await authTreeRepository.findDescendants(auth)
        const nodesToRemove = Array.from([...descendants, ...ancestors])
  
        console.log(nodesToRemove)
  
        await authTreeRepository.remove(nodesToRemove)
        await auth.remove()
  
        return reply.status(403).send({ message: 'This token has already been used and all others will now be revoked!' })
      }
  
      let userData
      try {
        userData = jwt.verify(refreshTokenCookie, refreshSecret, { algorithms: ['HS512'] }) as JWTData
      } catch {
        return reply.status(401).send({ message: 'Invalid or expired refresh token' })
      }
      // jwt trash
      delete userData.exp
      delete userData.iat
  
      if (typeof userData !== 'object' || !userData)
        return reply.status(401).send({ message: 'Invalid token data' })
      if (!('id' in userData) || !('uuid' in userData))
        return reply.status(401).send({ message: 'Invalid token payload' })
  
      const expiresTokenInSeconds = timer.number(process.env.JWT_EXPIRE ?? '7d') as number
      const expiresRefreshInSeconds = timer.number(process.env.REFRESH_EXPIRE ?? '7d') as number
  
      const expirationTokenDate = new Date(Date.now() + expiresTokenInSeconds)
      const expirationRefreshDate = new Date(Date.now() + expiresRefreshInSeconds)
  
      const newAccessToken = jwt.sign(userData, tokenSecret, {
        expiresIn: expiresTokenInSeconds,
        algorithm: 'HS512'
      })
  
      const newRefreshToken = jwt.sign(userData, refreshSecret, {
        expiresIn: expiresRefreshInSeconds,
        algorithm: 'HS512'
      })
  
      await Auth.create({
        parent: auth,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expireAt: moment(expirationRefreshDate.toISOString()).format('YYYY-MM-DD HH:mm:ss.SSS'),
        user: { id: userData.id }
      }).save()
      
      auth.valid = false
  
      await auth.save()
  
      reply.setCookie('Bearer', newAccessToken, getCookieOptions(expirationTokenDate))
      reply.setCookie('Refresh', newRefreshToken, getCookieOptions(expirationRefreshDate))
  
      return reply.status(200).send({
        message: 'Token refreshed successfully',
        data: {
          accessToken: {
            token: newAccessToken,
            expireDate: expirationTokenDate,
            expireSeconds: expiresTokenInSeconds
          },
          refreshToken: {
            token: newRefreshToken,
            expireDate: expirationRefreshDate,
            expireSeconds: expiresRefreshInSeconds
          },
        }
      })
    }
  }
})
