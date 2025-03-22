import { Router } from '@/controllers/router.js'
import { authTreeRepository } from '@/database/index.js'

export default new Router({
  name: 'logout',
  description: 'Remove tokens from the database',
  authenticate: true,
  methods: {
    async post({ reply, request }) {
      try {
        const token = request.headers['authorization'] ?? request.cookies['Bearer']
        if (!token) {
          return reply.code(422).send({ message: 'Token not provided' })
        }
  
        const auth = await authTreeRepository.findOne({ where: { accessToken: token } })
        if (!auth) return reply.code(404).send({ message: 'Auth not found' })
  
        const ancestors = await authTreeRepository.findAncestors(auth)
        const descendants = await authTreeRepository.findDescendants(auth)
        const nodesToRemove = Array.from([...descendants, ...ancestors])
  
        await authTreeRepository.remove(nodesToRemove)
        await auth.remove()
  
        return reply.code(200).send({
          message: 'Logout successful, tokens removed.',
          data: undefined
        })
      } catch (error) {
        console.error('Logout error:', error)
        return reply.code(500).send({ message: 'Internal server error' })
      }
    }
  }
})
