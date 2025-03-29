import { Router } from '@/controllers/router.js'

export default new Router({
  name: 'Home',
  description: 'Home API',
  methods: {
    get({ reply }) {
      return reply.code(200).send({ message: 'hello world', data: {} })
    }
  },
})