export type CacheEntry = {
  buffer: Buffer
  mime: string
  size: number
  lastAccessed: number
  accessCount: number
}


export abstract class Cache {
  protected totalSize: number = 0
  protected fileCount: number = 0
  protected maxSize: number = 0

  abstract get (key: string): Promise<CacheEntry | null>
  abstract add (key: string, buffer: Buffer): CacheEntry
  abstract exist (key: string): boolean

  get stats () {
    return {
      totalSize: this.totalSize,
      fileCount: this.fileCount,
      maxSize: this.maxSize,
    }
  }
}