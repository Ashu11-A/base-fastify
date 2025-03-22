import { Readable } from 'stream'

export abstract class BaseStorage {
  name: string
  version: string

  constructor(name: string, version: string) {
    this.name = name
    this.version = version
  }

  abstract save(key: string, file: Blob | ArrayBuffer | Buffer, options?: { folder?: string }): Promise<void> | void
  abstract append(key: string, file: Blob | ArrayBuffer | Buffer, options?: { folder?: string }): Promise<void> | void
  abstract load(key: string, folder?: string): Promise<Buffer | undefined> | Buffer | undefined
  abstract list(folder?: string): Promise<string[]> | string[]
  abstract exist(key: string, folder?: string): Promise<boolean> | boolean
  abstract delete(key: string, folder?: string): Promise<void> | void
  abstract stream(key: string, folder?: string): Promise<Readable> | Readable
}