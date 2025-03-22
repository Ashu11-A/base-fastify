import { Router } from '@/controllers/router.js'
import { z } from 'zod'

const router = new Router({
  name: 'Home',
  description: 'Home API',
  schema: {
    post: z.object({
      world: z.string()
    })
  },
  methods: {
    get({ reply }) {
      return reply.code(201).send({ message: 'hello world', data: '' })
    }
  },
})

export default router