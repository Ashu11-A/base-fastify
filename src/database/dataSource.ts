import 'dotenv/config'
import { glob } from 'glob'
import { dirname, join } from 'path'
import { DataSource } from 'typeorm'
import { fileURLToPath } from 'url'

const path = dirname(fileURLToPath(import.meta.url))

const database = process.env['DATABASE_TYPE'] === 'mysql'
  ? {
    type: 'mysql',
    host: process.env['DATABASE_HOST'],
    port: Number(process.env['DATABASE_PORT']),
    username: process.env['DATABASE_USERNAME'],
    password: process.env['DATABASE_PASSWORD'],
    database: process.env['DATABASE_NAME'],
    charset: 'utf8mb4',
  } as const
  : {
    type: 'sqljs',
    autoSave: true,
    useLocalForage: true,
    location: process.env['DATABASE_FILE'] || 'database.wm',
  } as const

export default new DataSource({
  ...database,
  synchronize: true,
  logging: true,
  entities: await glob(join(path, 'entity', '**/*.{js,ts}')),
  migrations: await glob(join(path, 'migration', '**/*.{js,ts}')),
  subscribers: [],
})