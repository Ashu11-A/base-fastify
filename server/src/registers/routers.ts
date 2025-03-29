import { routers } from "@/build/routers"
import { authenticator } from "@/controllers/auth"
import { Fastify } from "@/controllers/fastify"
import { MethodType, type GenericRouter, type ReplyKeys, type TypedReply } from "@/types/router"
import chalk from "chalk"
import type { FastifyReply, FastifyRequest, RouteShorthandOptions } from "fastify"
import { glob } from "glob"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

export async function registerRouter () {
  if (Fastify.server === undefined) throw new Error('Server not configured!')

  const isPKG = dirname(fileURLToPath(import.meta.url)) === process.cwd()
  const routersP = isPKG
    ? routers
    : await (async () => {
    const path = join(import.meta.dirname, '../../routers')
    const files = await glob('**/*.ts', { cwd: path })
    const routers: Record<string, GenericRouter> = {}

    for (const file of files) {
      const filePath = join(path, file)
      const { default: router } = await import(filePath) as { default: GenericRouter }

      if (router === undefined || router?.name === undefined) {
        console.log(chalk.red(`Put export default in the route: ${filePath}`))
        continue
      }
      routers[formatPath(router?.path ?? file)] = router
    }

    return routers
  })()

  for (const [path, router] of Object.entries(routersP as Record<string, GenericRouter>)) {
    router.name = router.name.replaceAll(' ', '')
    router.path = path

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
        const parsed = router.schema?.[type as MethodType]?.safeParse(request.body)

        if (parsed !== undefined && !parsed.success) return reply.code(400).send({
          message: parsed.error.name,
          error: parsed.error
        })

        return method({
          request,
          reply: (reply as unknown as TypedReply<unknown, ReplyKeys>),
          schema: parsed?.data ?? {}
        })
      }

      switch(type) {
      case MethodType.get: {
        Fastify.server.get(router.path as string, options, response)
        break
      }
      case MethodType.post: {
        Fastify.server.post(router.path as string, options, response)
        break
      }
      case MethodType.put: {
        Fastify.server.put(router.path as string, options, response)
        break
      }
      case MethodType.delete: {
        Fastify.server.delete(router.path as string, options, response)
        break
      }
      case MethodType.socket: {
        Fastify.server.get(router.path as string, options, () => {})
      }
      }
    }

    console.log([
      '',
      `📡 The route ${chalk.blueBright(router.path)} has been successfully registered!`,
      `    🏷️  Route Name: ${chalk.cyan(router.name)}`,
      `    📃 Description: ${chalk.yellow(router.description)}`,
      `    📋 Methods: ${chalk.magenta(Object.keys(router.methods).filter((method) => (router.methods)[(method as MethodType)] !== undefined).join(', '))}`,
      ''
    ].map((text) => chalk.green(text)).join('\n'))
  }
}

export function formatPath (path: string) {
  path = path.replace(/\.(ts|js)$/i, '') // Remove extensões ".ts" ou ".js"
  .replace('index', '')       // Remove "/index" para deixar "/"
  .replace(/\([^)]*\)/g, '')  // Remove parênteses e seu conteúdo
  .replace(/[/\\]+$/, '')     // Remove barras finais "/" ou "\"
  .replace(/\\/g, '/')        // Converte "\" para "/"
  // Garante que o path comece com '/'
  if (!path.startsWith('/')) path = '/' + path
  
  return path
}