import { lookup } from 'mime-types'
import { Cache, type CacheEntry } from '../../controllers/Cache.js'

type CacheProps = {
  /**
   * Maximum size that can be cached, must be a value in bytes
   * 
   * @default 2 * 1024 * 1024 * 1024 // 2GB
   */
  maxSize: number
  /**
   * Maximum time the file will remain in cache, the value must be in ms
   * 
   * @default 30 * 60 * 1000 // 30 minutes
   */
  maxAge: number
}

export class LRUCache extends Cache {
  private cache = new Map<string, CacheEntry>()
  private accessQueue: string[] = []
  public readonly maxSize: number = 2 * 1024 * 1024 * 1024 // 2GB
  public readonly maxAge: number = 30 * 60 * 1000 // 30 minutes

  constructor (params?: CacheProps) {
    super()
    if (params?.maxAge) this.maxSize = params.maxAge
    if (params?.maxSize) this.maxSize = params.maxSize

    setInterval(this.cleanup.bind(this), 60 * 1000)
  }

  exist(key: string): boolean {
    return this.cache.has(key)
  }

  async get (key: string): Promise<CacheEntry | null> {
    const cached = this.cache.get(key)

    if (cached) {
      cached.lastAccessed = Date.now()
      cached.accessCount++
      this.updateAccessQueue(key)

      return cached
    }

    return null
  }

  add(key: string, buffer: Buffer) {
    const mime = lookup(key) || 'application/octet-stream'
    const entry: CacheEntry = {
      buffer: Buffer.from(buffer),
      mime,
      size: buffer.byteLength,
      lastAccessed: Date.now(),
      accessCount: 1
    }

    if (entry.size > this.maxSize) return entry
    if (this.totalSize + entry.size > this.maxSize) this.evictLRU(entry.size)
    if (this.totalSize + entry.size <= this.maxSize) {
      this.cache.set(key, entry)
      this.totalSize += entry.size
      this.fileCount++
      this.accessQueue.unshift(key)
    }

    return entry
  }

  private evictLRU(requiredSpace: number) {
    while (this.accessQueue.length > 0 && this.totalSize + requiredSpace > this.maxSize) {
      const lruKey = this.accessQueue.pop()!
      const entry = this.cache.get(lruKey)!

      this.totalSize -= entry.size
      this.fileCount--
      this.cache.delete(lruKey)
    }
  }

  private updateAccessQueue(key: string) {
    this.accessQueue = this.accessQueue.filter(k => k !== key)
    this.accessQueue.unshift(key)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > this.maxAge) {
        this.totalSize -= entry.size
        this.cache.delete(key)
        this.accessQueue = this.accessQueue.filter(k => k !== key)
      }
    }
  }
}