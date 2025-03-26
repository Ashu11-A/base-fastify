import { fastifyCookie } from '@fastify/cookie'
import { fastifyMultipart } from '@fastify/multipart'
import fastify, { type FastifyInstance } from 'fastify'
import fastifyIO from 'fastify-socket.io'
import { fastifyCompress } from '@fastify/compress'
import { constants as zlibConstants } from 'zlib'

import { BearerStrategy } from '@/strategies/BearerStrategy.js'
import { CookiesStrategy } from '@/strategies/CookiesStrategy.js'

interface Options {
  host: string
  port: number
  log?: boolean
}

export class Fastify {
  static server: FastifyInstance
  constructor(public options: Options){}

  init () {
    const server = fastify({
      logger: this.options.log === undefined ? undefined : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname,reqId',
          },
        },
      },
    })
    
    const cookieToken = process.env['COOKIE_TOKEN']
    if (cookieToken === undefined) throw new Error('Cookie token are undefined')

    server
      .register(fastifyCompress, {
        logLevel: 'debug',
        brotliOptions: {
          params: {
            [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
            [zlibConstants.BROTLI_PARAM_QUALITY]: 11
          }
        },
        zlibOptions: {
          level: 9,
        }
      })
      .register(fastifyMultipart, {
        limits: {
          fileSize: 1024 * 1024 * 50 // 50 Mb
        }
      })
      .register(fastifyCookie, {
        secret: cookieToken,
      })
      .register(fastifyIO, {
        async allowRequest(req, fn) {
          const strategy = new BearerStrategy()
          await strategy.validation(req)

          if (strategy.authenticated) return fn(undefined, true)
          fn(strategy.error?.message, false)
        },
      })
      .decorate('auth', {
        strategies: [
          BearerStrategy,
          CookiesStrategy
        ]
      })

    Fastify.server = server
    return this
  }

  async listen () {
    await new Promise<void>((resolve) => {
      Fastify.server.listen({
        port: this.options.port,
        host: this.options.host
      }, (err, address) => {
        if (err !== null) {
          console.log(`Port unavailable: ${this.options.port}`)
          console.log(err)
          this.options.port = this.options.port + 1
          return this.listen()
        }
            
        return resolve()
      })
    }) 
  }
}