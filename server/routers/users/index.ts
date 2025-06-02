import { Router } from '@/controllers/router'
import { repository } from '@/database'
import { Role } from '@/database/enums'
import { paginate, paginateQuery } from '@/database/pagination'

export default new Router({
  name: 'List Users',
  description: 'Retrieve paginated list of users with access restricted to administrators and HR',
  authenticate: [Role.Administrator],
  query: {
    get: paginateQuery
  },
  methods: {
    async get({ reply, query }) {
      const page = Math.max(1, Number(query.page) || 1)
      const pageSize = Math.max(1, Number(query.pageSize) || 1)
      const interval = ['month', 'day', 'hour', 'none'].includes(query.interval ?? '') ? query.interval as string : 'none'

      console.log(query)
      const paginated = await paginate({
        repository: repository.user,
        page,
        interval: interval as 'day' | 'none' | 'month' | 'hour',
        pageSize,
        relations: {
          auths: false
        }
      })

      return reply.code(200).send({
        message: 'Users retrieved successfully',
        ...paginated
      })
    },
  }
})