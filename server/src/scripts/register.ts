import { User } from '@/database/entity/User'
import { Role } from '@/database/enums'
import { isDev } from '@/utils/dev'
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'

if (isDev) {

  let admim = await User.findOneBy({ email: 'admin@admin.com' })
  if (!admim) {
    admim = await (await User.create({
      name: 'Matheus',
      username: 'Ashu',
      email: 'admin@admin.com',
      language: 'pt-BR',
      uuid: nanoid(),
      role: Role.Administrator
    })
      .setPassword('admin1234'))
      .save()
  }

  let testUser = await User.findOneBy({ email: 'user@user.com' })
  if (!testUser) {
    testUser = await (await User.create({
      name: 'User Teste',
      username: 'user',
      email: 'user@user.com',
      language: 'pt-BR',
      uuid: nanoid(),
      role: Role.User,
    })
      .setPassword('user1234'))
      .save()
  }

  // 2) Verifica quantos usuários já existem
  const totalUsers = await User.count()
  const MAX_USERS = 20

  if (totalUsers < MAX_USERS) {
    const toGenerate = MAX_USERS - totalUsers

    const fakeUsersData: Array<{
      name: string
      username: string
      email: string
      language: string
      role: Role
    }> = Array.from({ length: toGenerate }).map(() => ({
      name: faker.person.fullName(),
      username: faker.internet.username().toLowerCase(),
      email: faker.internet.email().toLowerCase(),
      language: faker.helpers.arrayElement(['pt-BR', 'en-US']),
      role: Role.User
    }))

    for (const u of fakeUsersData) {
      const exists = await User.findOneBy({ email: u.email })
      if (!exists) {
        await (await User.create({
          name: u.name,
          username: u.username,
          email: u.email,
          language: u.language,
          uuid: nanoid(),
          role: u.role,
        })
          .setPassword('password123'))
          .save()
      }
    }
  } else {
    console.log(`Já existem ${totalUsers} usuários. Ignorando criação de fakes.`)
  }
}
