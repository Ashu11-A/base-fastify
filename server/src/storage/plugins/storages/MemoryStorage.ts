import { Readable } from 'stream'
import { BaseStorage } from './Base.js'

export class MemoryStorage extends BaseStorage {
  private storage = new Map<string, Map<string, Buffer>>()
  
  constructor() {
    super('memory', '1.0.0')
  }

  async save(key: string, file: Blob | ArrayBuffer | Buffer, options?: { folder?: string }) {
    const folder = options?.folder ?? 'root'
    if (!this.storage.has(folder)) {
      this.storage.set(folder, new Map())
    }
    const buffer = file instanceof Blob
      ? Buffer.from(await file.arrayBuffer())
      : file instanceof ArrayBuffer
        ? Buffer.from(file)
        : file
    this.storage.get(folder)!.set(key, buffer)
  }

  async append(key: string, file: Blob | ArrayBuffer | Buffer, options?: { folder?: string }) {
    const folder = options?.folder ?? 'root'
    if (!this.storage.has(folder)) {
      this.storage.set(folder, new Map())
    }
    const existingBuffer = this.storage.get(folder)!.get(key) || Buffer.alloc(0)
    const buffer = file instanceof Blob
      ? Buffer.from(await file.arrayBuffer())
      : file instanceof ArrayBuffer
        ? Buffer.from(file)
        : file
    
    this.storage.get(folder)!.set(key, Buffer.concat([existingBuffer, buffer]))
  }

  load(key: string, folder?: string) {
    return this.storage.get(folder ?? 'root')?.get(key)
  }

  delete(key: string, folder?: string): void {
    this.storage.get(folder ?? 'root')?.delete(key)
  }

  exist(key: string, folder?: string) {
    return this.storage.get(folder ?? 'root')?.has(key) ?? false
  }

  list(folder?: string) {
    return Array.from(this.storage.get(folder ?? 'root')?.keys() ?? [])
  }

  async stream(key: string, folder?: string): Promise<Readable> {
    const buffer = this.load(key, folder)
    if (!buffer) {
      throw new Error(`Chave "${key}" não encontrada`)
    }
    return Readable.from(buffer)
  }
}
