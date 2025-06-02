import { dirname, join } from 'path'
import { LocalStorage, MemoryStorage } from 'storage'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const cwd = import.meta.filename.endsWith('.ts')
  ? join(__dirname, '../')
  : process.cwd()

export const storage = process.env.STORAGE_TYPE === 'memory'
  ? new MemoryStorage()
  : new LocalStorage({
    storagePath: join(cwd, process.env.LOCAL_STORAGE_PATH ?? 'storage')
  })

export const baseUrl = (process.env.BACK_END_URL ?? `http://localhost:${process.env.PORT}`)