import { Router } from '@/controllers/router.js'
import { MethodType } from '@/types/router.js'

export default new Router({
  name: 'Home',
  description: 'Home API',
  method: [
    {
      type: MethodType.Get,
      async run(_request, reply) {
        return reply.code(200).send({ message: 'Hello World' })
      },
    }
  ]
}) 