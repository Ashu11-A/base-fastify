import multipart from '@fastify/multipart'
import { Authenticator } from '@fastify/passport'
import SecureSession from '@fastify/secure-session'
import websocket from '@fastify/websocket'
import fastify, { FastifyInstance } from 'fastify'
import { readFileSync } from 'fs'
import { join } from 'path'

interface Options {
  host: string
  port: number
}

export class Fastify {
  static server: FastifyInstance
  constructor(public options: Options){}

  init () {
    const server = fastify({ logger: true })
    const fastifyPassport = new Authenticator()

    server
      .register(multipart, {
      // attachFieldsToBody: true,
        limits: {
          fileSize: 1024 * 1024 * 10
        }
      })
      .register(websocket)
      .register(SecureSession, { key: readFileSync(join(process.cwd(), 'secret-key')) })
      .register(fastifyPassport.initialize())
      .register(fastifyPassport.secureSession())
    Fastify.server = server
    return this
  }

  listen () {
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
          
      console.log(`Server listening at ${address}`)
    })
  }
}
