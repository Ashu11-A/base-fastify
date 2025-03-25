import 'dotenv/config'
import { glob } from 'glob'
import { dirname, join } from 'path'
import { DataSource } from 'typeorm'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const path = dirname(fileURLToPath(import.meta.url))

async function getDatabase (database: 'mysql' | 'sqljs' = 'sqljs') {
  switch (database) {
    case 'mysql': {
      const rootSource = await mysql.createConnection({
        host: process.env['DATABASE_HOST'],
        port: Number(process.env['DATABASE_PORT']),
        user: process.env['DATABASE_USERNAME'],
        password: String(process.env['DATABASE_PASSWORD'])
      })
      
      await rootSource.query(`CREATE DATABASE IF NOT EXISTS ${process.env['DATABASE_NAME']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
      await rootSource.query(`GRANT ALL PRIVILEGES ON ${process.env['DATABASE_NAME']}.* TO '${process.env.DATABASE_USERNAME}'@'%' IDENTIFIED BY '${process.env.DATABASE_PASSWORD}';`)
      await rootSource.query('FLUSH PRIVILEGES;')

      return {
        type: 'mysql',
        host: process.env['DATABASE_HOST'],
        port: Number(process.env['DATABASE_PORT']),
        username: process.env['DATABASE_USERNAME'],
        password: String(process.env['DATABASE_PASSWORD']),
        database: process.env['DATABASE_NAME'],
        charset: 'utf8mb4',
      } as const
    }
    default: {
      return {
        type: 'sqljs',
        autoSave: true,
        useLocalForage: true,
        location: String(process.env['DATABASE_FILE']) || 'database.wm',
      } as const
    }
  }
}

export default new DataSource({
  ...(await getDatabase(process.env['DATABASE_TYPE'] as "mysql" | "sqljs" | undefined)),
  synchronize: true,
  logging: true,
  entities: await glob(join(path, 'entity', '**/*.{js,ts}')),
  migrations: await glob(join(path, 'migration', '**/*.{js,ts}')),
})