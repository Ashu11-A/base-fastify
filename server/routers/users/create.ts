import { Router } from '@/controllers/router'
import { User } from '@/database/entity/User'
import { Role } from '@/database/enums'
import { nanoid } from 'nanoid'
import { z } from 'zod'

export default new Router({
  name: 'Create User',
  path: '/users',
  description: 'Create a new user in the system - administrator/HR access only',
  authenticate: [Role.Administrator],
  schema: {
    post: z.object({
      name: z.string().min(4).max(64),
      username: z.string().min(4).max(64),
      email: z.string().email(),
      language: z.string(),
      password: z.string().min(8).max(30),
      role: z.nativeEnum(Role),
    })
  },
  methods: {
    async post({ reply, schema, request }) {
      // Verificar permissões baseadas no role do usuário autenticado
      if (request.user.role === Role.Administrator && schema.role !== Role.User) {
        return reply.status(403).send({
          message: 'Administradores só podem criar usuários com função de Employee.',
        })
      }

      const existUser = await User.findOneBy({ 
        email: schema.email 
      })

      if (existUser) {
        return reply.status(422).send({
          message: 'Um usuário com este email já existe no sistema.',
        })
      }


      const user = await (await User.create({
        ...schema,
        uuid: nanoid()
      })
        .setPassword(schema.password))
        .save()

      return reply.code(201).send({
        message: 'Usuário criado com sucesso!',
        data: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      })
    }
  }
}) 