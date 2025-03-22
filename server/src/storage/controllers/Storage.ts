import type { BaseStorage } from '../plugins/storages/Base.js'

type StorageParams = {
  driver: BaseStorage
}

export class Storage {
  driver: BaseStorage
  
  constructor ({ driver }: StorageParams) {
    this.driver = driver
  }
}