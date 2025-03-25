import 'env/loader'
import 'dotenv/config'
import 'reflect-metadata'

import { Fastify } from './controllers/fastify.js'
import { Router } from './controllers/router.js'
import Database from './database/dataSource.js'

const fastify = new Fastify({ port: Number(process.env['PORT']) || 3000, host: '0.0.0.0' })
await Database.initialize()

fastify.init()
await Router.register()
await fastify.listen()
