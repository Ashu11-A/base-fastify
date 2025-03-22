import { Column, type ColumnOptions } from 'typeorm'

export function Hidden(options: ColumnOptions = {}): PropertyDecorator {
  return Column({
    ...options,
    select: false
  })
}