import { existsSync, createReadStream } from 'fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'
import { LRUCache } from '../caches/LRU.js'
import { BaseStorage } from './Base.js'
import { appendFile } from 'fs/promises'

type LocalStorageParams = {
  storagePath: string
  cache?: LRUCache
}

export class LocalStorage extends BaseStorage {
  private storagePath: string
  public readonly cache = new LRUCache()

  constructor(params: LocalStorageParams) {
    super('local', '1.0.0')
    this.storagePath = params.storagePath
    if (params.cache) this.cache = params.cache
  }

  async save(key: string, file: Blob | ArrayBuffer | Buffer, options?: { folder?: string }) {
    const folderPath = options?.folder ? join(this.storagePath, options.folder) : this.storagePath
    const filePath = join(folderPath, key)
    const buffer = file instanceof Blob
      ? Buffer.from(await file.arrayBuffer())
      : file instanceof ArrayBuffer
        ? Buffer.from(file)
        : file

    if (!existsSync(folderPath)) await mkdir(folderPath, { recursive: true })
    
    this.cache.add(key, buffer)
    await writeFile(filePath, buffer)
  }

  async append(key: string, file: Blob | ArrayBuffer | Buffer, options?: { folder?: string }) {
    const folderPath = options?.folder ? join(this.storagePath, options.folder) : this.storagePath
    const filePath = join(folderPath, key)
    const buffer = file instanceof Blob
      ? Buffer.from(await file.arrayBuffer())
      : file instanceof ArrayBuffer
        ? Buffer.from(file)
        : file
    
    if (!existsSync(folderPath)) await mkdir(folderPath, { recursive: true })
    await appendFile(filePath, buffer)
  }

  async load(key: string, folder?: string) {
    const filePath = join(this.storagePath, folder ?? '', key)
    if (this.cache.exist(key)) {
      console.log('Arquivo em cache')
      const cached = await this.cache.get(key)
      if (cached) return cached.buffer
    }
    const buffer = await readFile(filePath)
    this.cache.add(key, buffer)
    return buffer
  }

  async delete(key: string, folder?: string) {
    const filePath = join(this.storagePath, folder ?? '', key)
    if (existsSync(filePath)) await rm(filePath)
  }

  exist(key: string, folder?: string) {
    const filePath = join(this.storagePath, folder ?? '', key)
    return existsSync(filePath)
  }

  async list(folder?: string) {
    const dirPath = join(this.storagePath, folder ?? '')
    return await readdir(dirPath)
  }
  
  async stream(key: string, folder?: string): Promise<Readable> {
    const filePath = join(this.storagePath, folder ?? '', key)
    if (!existsSync(filePath)) {
      throw new Error(`Arquivo ${key} não encontrado`)
    }
    return createReadStream(filePath)
  }
}