import { Router } from '@/controllers/router'
import { User } from '@/database/entity/User'
import { Role } from '@/database/enums'
import { z } from 'zod'

export default new Router({
  name: 'Edit User',
  path: '/users/:id',
  description: 'Update user information by ID - Employees can only update their own data',
  authenticate: true,
  schema: {
    put: z.object({
      name: z.string().min(4).max(64).optional(),
      username: z.string().min(4).max(64).optional(),
      language: z.string().optional(),
      password: z.string().min(8).max(30).optional()
    })
  },
  methods: {
    async put({ reply, request, schema }) {
      const params = request.params as { id: string }
      const requestedId = Number(params.id)

      // Se for Employee, só pode editar seus próprios dados
      if (request.user.role === Role.User && request.user.id !== requestedId) {
        return reply.status(403).send({
          message: 'You can only update your own user data'
        })
      }

      const user = await User.findOneBy({
        id: requestedId
      })

      if (!user) {
        return reply.status(404).send({
          message: `User with ID ${params.id} not found`
        })
      }

      if (schema.name) user.name = schema.name
      if (schema.username) user.username = schema.username
      if (schema.language) user.language = schema.language
      if (schema.password) await user.setPassword(schema.password)

      const result = await user.save()

      return reply.code(200).send({
        message: 'User updated successfully',
        data: {
          ...result,
          password: undefined
        },
      })
    }
  }
}) 