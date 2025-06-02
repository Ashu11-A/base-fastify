import { Router } from '@/controllers/router'
import { User } from '@/database/entity/User'
import { Role } from '@/database/enums'

export default new Router({
  name: 'Delete User',
  path: '/users/:id',
  description: 'Delete user by ID - Employees can only delete their own account',
  authenticate: true,
  methods: {
    async delete({ reply, request }) {
      const params = request.params as { id: string }
      const requestedId = Number(params.id)

      // Se for Employee, só pode deletar sua própria conta
      if (request.user.role === Role.User && request.user.id !== requestedId) {
        return reply.status(403).send({
          message: 'You can only delete your own account'
        })
      }

      const result = await User.delete({ id: requestedId })

      if (result.affected === 0) {
        return reply.status(404).send({
          message: `User with ID ${params.id} not found`
        })
      }

      return reply.code(200).send({
        message: 'User deleted successfully',
        data: result,
      })
    }
  }
}) 