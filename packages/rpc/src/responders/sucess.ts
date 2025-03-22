import { Response } from './base'

type MetadataList = {
  total: number
  currentPage: number
  totalPages: number
  pageSize: number
}

export type SuccessResponseOptions<TData> =
  TData extends unknown[]
    ? { message: string; data: TData; metadata: MetadataList }
    : { message: string; data: TData }

export class SuccessResponse<TData> extends Response {
  readonly data: TData
  readonly metadata?: TData extends unknown[] ? MetadataList : never

  constructor(options: SuccessResponseOptions<TData>) {
    super({ message: options.message })

    this.data = options.data
    if ('metadata' in options) this.metadata = options.metadata as TData extends unknown[] ? MetadataList : never
  }
}