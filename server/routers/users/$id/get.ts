import { Router } from '@/controllers/router'
import { User } from '@/database/entity/User'
import { Role } from '@/database/enums'

export default new Router({
  name: 'Get User',
  path: '/users/:id',
  description: 'Get user information by ID - Employees can only access their own data',
  authenticate: true,
  methods: {
    async get({ reply, request }) {
      const params = request.params as { id: string }
      const requestedId = Number(params.id)

      // Se for Employee, só pode ver seus próprios dados
      if (request.user.role === Role.User && request.user.id !== requestedId) {
        return reply.status(403).send({
          message: 'You can only access your own user data'
        })
      }

      const user = await User.findOne({
        where: {
          id: requestedId
        }
      })

      if (!user) {
        return reply.status(404).send({
          message: `User with ID ${params.id} not found`
        })
      }

      return reply.code(200).send({
        message: 'User details retrieved successfully',
        data: user,
      })
    }
  }
}) 