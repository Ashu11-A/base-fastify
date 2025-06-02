import 'dotenv/config'
import mysql from 'mysql2/promise'
import { dirname, join } from 'path'
import { DataSource } from 'typeorm'
import { fileURLToPath } from 'url'

const path = dirname(fileURLToPath(import.meta.url))

async function getDatabase(database: 'mysql' | 'sqljs' = 'sqljs') {
  switch (database) {
  case 'mysql': {
    const host = String(process.env.DATABASE_HOST || 'localhost')
    const port = Number(process.env.DATABASE_PORT || 3306)
    const username = String(process.env.DATABASE_USERNAME || 'root')
    const password = String(process.env.DATABASE_PASSWORD || '')
    const dbName = String(process.env.DATABASE_NAME || 'posto')

    const rootSource = await mysql.createConnection({
      host,
      port,
      user: username,
      password
    })
      
    await rootSource.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await rootSource.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${username}'@'%' IDENTIFIED BY '${password}';`)
    await rootSource.query('FLUSH PRIVILEGES;')
    await rootSource.end()

    return {
      type: 'mysql' as const,
      host,
      port,
      username,
      password,
      database: dbName,
      charset: 'utf8mb4',
    }
  }
  default: {
    return {
      type: 'sqljs' as const,
      autoSave: true,
      useLocalForage: true,
      location: String(process.env.DATABASE_FILE || 'database.wm'),
    }
  }
  }
}

export default new DataSource({
  ...(await getDatabase(process.env.DATABASE_TYPE as 'mysql' | 'sqljs' | undefined)),
  synchronize: true,
  logging: true,
  entities: [join(path, 'entity', '**', '*.{js,ts}')],
  migrations: [join(path, 'migration', '**', '*.{js,ts}')],
})