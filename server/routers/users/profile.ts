import { Router } from '@/controllers/router'
import { User } from '@/database/entity/User'

export default new Router({
  name: 'Get User Profile',
  path: '/users/profile',
  description: 'Get current user profile with all related data',
  authenticate: true,
  methods: {
    async get({ reply, request }) {
      const user = await User.findOne({
        where: { id: request.user.id }
      })

      if (!user) {
        return reply.status(404).send({
          message: 'User not found'
        })
      }

      return reply.code(200).send({
        message: 'Profile retrieved successfully',
        data: user
      })
    }
  }
}) 