/* eslint-disable no-fallthrough */
import { MethodType, RouterOptions } from '@/types/router.js'
import { glob } from 'glob'
import { join, extname, basename } from 'path'
import { Fastify } from './fastify.js'

export class Router {
  static all: Router[] = []

  constructor(public options: RouterOptions) {
    Router.all.push(this)
  }

  static async register () {
    const pathRouter = join(import.meta.dirname, '../../routers')
    const routers = await glob('**/*.ts', { cwd: pathRouter })

    for (const file of routers) {
      const filePath = join(pathRouter, file)
      const { default: router } = await import(filePath) as { default: Router }
      
      router.options = Object.assign(router?.options, { path: file })
    }

    for (const router of Router.all) {
      let path = router.options.path as string

      // <-- Formata o PATH
      const regexBrackets = /\([^)]*\)/g
      switch (true) {
      // Remove o nome do arquivo da rota
      case ['.ts', '.js'].includes(extname(path)): 
        path = path.replace(basename(path), '')
        // caso a rota tenha algum diretório entre () parenteses, eles serão removidos do path
      case regexBrackets.test(path):
        path = path.replace(regexBrackets, '')
      case path.endsWith('/'): {
        path = path.slice(0, -1)
      }
      default: path = join('/', path)
      }

      
      for (const method of router.options.method) {
        console.log(path, method)
        switch(method.type) {
        case MethodType.Get: {
          Fastify.server.get(path, method.run)
          break
        }
        case MethodType.Post: {
          Fastify.server.post(path, method.run)
          break
        }
        case MethodType.Put: {
          Fastify.server.put(path, method.run)
          break
        }
        case MethodType.Delete: {
          Fastify.server.delete(path, method.run)
          break
        }
        case MethodType.Websocket: {
          Fastify.server.get(path, { websocket: true }, method.run)
        }
        }
      }
    }
  }
}