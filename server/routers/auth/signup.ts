import { Router } from '@/controllers/router.js'
import { Role, User } from '@/database/entity/User.js'
import { nanoid } from 'nanoid'
import z from 'zod'

export default new Router({
  schema: {
    post: z.object({
      name: z.string().min(4).max(64),
      username: z.string().min(4).max(64),
      email: z.string().email(),
      language: z.string(),
      password: z.string().min(8).max(30)
    })
  },
  name: 'UserRegistration',
  description: 'Handles new user registration, including validation and secure password storage',
  methods: {
    async post({ reply, schema }) {
      const existUser = await User.findOneBy({ email: schema.email })
      if (existUser) {
        return reply.status(422).send({
          message: 'A user with the provided email or username already exists. Please use different credentials.',
        })
      }
  
      const user = await (await User.create({
        ...schema,
        uuid: nanoid(),
        role: Role.User
      })
        .setPassword(schema.password))
        .save()
  
      return reply.code(201).send({
        message: 'User registered successfully!',
        data: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email
        }
      })
    }
  }
})