import 'dotenv/config'
import 'env/loader'
import 'reflect-metadata'

import { Fastify } from './controllers/fastify.js'
import Database from './database/dataSource.js'
import { registerRouter } from './registers/routers.js'

const fastify = new Fastify({ port: Number(process.env['PORT']) || 3000, host: '0.0.0.0' })
await Database.initialize()

fastify.config()
await registerRouter()
await fastify.listen()
