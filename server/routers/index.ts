import { Router } from '@/controllers/router.js'
import { z } from 'zod'

export default new Router({
  name: 'API Root',
  description: 'Main API endpoint for system health check and basic information',
  schema: {
    post: z.object({
      name: z.string()
    })
  },
  methods: {
    post({ reply }) {
      reply.setCookie('test', 'test')
      return reply.code(200).send({ message: 'hello world', data: {} })
    }
  },
})