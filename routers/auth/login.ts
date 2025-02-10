import { Router } from '@/controllers/router.js'
import { User } from '@/database/entity/User.js'
import { timer } from '@/utils/timer.js'
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

export default new Router({
  name: 'UserLogin',
  description: 'Handles user authentication by validating credentials and issuing JWT tokens for secure access',
  schema: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  async post({ reply, schema }) {
    const user = await User.findOne({ where: { email: schema.email } })
    if (!user) {
      return reply.code(403).send({ message: 'Invalid email or password' })
    }

    if (!(await compare(schema.password, user.password))) {
      return reply.code(403).send({ message: 'Invalid email or password' })
    }

    const expiresInSeconds = timer.number(process.env.JWT_EXPIRE ?? '7d') as number
    const token = jwt.sign(
      { ...user, password: undefined },
      process.env.JWT_TOKEN as string,
      {
        expiresIn: expiresInSeconds,
        algorithm: 'HS512'
      }
    )

    const cookieExpirationDate = new Date(Date.now() + expiresInSeconds)

    console.log(cookieExpirationDate)
    reply.setCookie('Bearer', token, {
      path: '/',
      expires: cookieExpirationDate,
      httpOnly: true,
      signed: true,
      secure: process.env.PRODUCTION === 'true',
      domain: process.env.PRODUCTION === 'true' ? process.env.FRONT_END_URL : undefined,
    })

    return reply.code(200).send({ message: 'Login successful', data: token })
  }
})
