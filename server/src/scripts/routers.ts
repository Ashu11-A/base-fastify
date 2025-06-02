import { authenticator } from '@/controllers/auth'
import { Fastify } from '@/controllers/fastify'
import { MethodType, type GenericRouter, type MethodKeys, type ReplyKeys, type SchemaDynamic, type TypedReply } from '@/types/router'
import { formatPath } from '@/utils/path'
import chalk from 'chalk'
import type { FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify'
import { glob } from 'glob'
import { dirname, join } from 'path'
import routers from 'routers'
import { fileURLToPath } from 'url'

export async function registerRouter () {
  if (Fastify.server === undefined) throw new Error('Server not configured!')

  const isPKG = dirname(fileURLToPath(import.meta.url)) === process.cwd()
  const routersP = isPKG
    ? routers
    : await (async () => {
      const path = join(import.meta.dirname, '../../routers')
      const files = await glob('**/*.ts', { cwd: path })
      const routers: GenericRouter[] = []

      for (const file of files) {
        const filePath = join(path, file)
        const { default: router } = await import(filePath) as { default: GenericRouter }

        if (router === undefined || router?.name === undefined) {
          console.log(chalk.red(`Put export default in the route: ${filePath}`))
          continue
        }
        router.path = formatPath(router?.path ?? file)
        routers.push(router)
      }

      return routers
    })()

  const routerArray = Array.isArray(routersP) ? routersP : Object.values(routersP)

  for (const router of routerArray) {
    router.name = router.name.replaceAll(' ', '')

    for (const [type, method] of Object.entries(router.methods)) {
      if (!Object.keys(MethodType).includes(type) || typeof method !== 'function') continue
      const options: RouteShorthandOptions = {
        compress: router.compress,
        decompress: router.decompress,
        ...(router.authenticate
          ? {
            preValidation: (request, reply) => authenticator(request, reply, router.authenticate),
          }
          : {})
      }

      const response = (request: FastifyRequest, reply: FastifyReply) => {
        const schema = router.schema as SchemaDynamic<MethodKeys>
        const parsed = schema?.[type as MethodKeys]?.safeParse(request.body)

        if (parsed !== undefined && !parsed.success) return reply.code(400).send({
          message: parsed.error.name,
          error: parsed.error
        })

        return method({
          request,
          query: request.query,
          reply: (reply as unknown as TypedReply<unknown, ReplyKeys>),
          schema: parsed?.data ?? {}
        })
      }

      const routePath = router.path as string
      
      switch(type) {
      case MethodType.get: {
        Fastify.server.get(routePath, options, response)
        break
      }
      case MethodType.post: {
        Fastify.server.post(routePath, options, response)
        break
      }
      case MethodType.put: {
        Fastify.server.put(routePath, options, response)
        break
      }
      case MethodType.delete: {
        Fastify.server.delete(routePath, options, response)
        break
      }
      case MethodType.socket: {
        Fastify.server.get(routePath, options, () => {})
      }
      }

      console.log([
        '',
        `📡 The route [${chalk.green(type.toUpperCase())}] ${chalk.blueBright(routePath)} has been successfully registered!`,
        `    🏷️  Route Name: ${chalk.cyan(router.name)}`,
        `    📃 Description: ${chalk.yellow(router.description)}`,
        ''
      ].join('\n'))
    }
  }
}