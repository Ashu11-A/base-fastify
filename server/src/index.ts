import { join } from 'path'
import { LocalStorage, MemoryStorage } from 'storage'

const cwd = import.meta.filename.endsWith('.ts') ? join(process.cwd(), '../') : process.cwd()

export const storage = process.env.STORAGE_TYPE === 'memory'
  ? new MemoryStorage()
  : new LocalStorage({
    storagePath: process.env.LOCAL_STORAGE_PATH ?? join(cwd, 'storage')
  })