import { addYears, endOfDay, endOfHour, endOfMonth, startOfDay, startOfHour, startOfMonth, subYears } from 'date-fns'
import { Between, Repository, type FindOptionsOrder, type FindOptionsRelations, type FindOptionsWhere, type ObjectLiteral } from 'typeorm'
import { z } from 'zod'

export const AfterDate = (date: Date) => Between(date, addYears(date, 100))
export const BeforeDate = (date: Date) => Between(subYears(date, 100), date)

export const paginateSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value) : 1))
    .refine((value) => value > 0, { message: 'Page must be greater than 0' }),

  pageSize: z
    .string()
    .optional()
    .transform((value) => (value ? parseInt(value) : 10))
    .refine((value) => value > 0, { message: 'PageSize must be greater than 0' }),

  interval: z.enum(['month', 'day', 'hour', 'none']).default('none'),

  day: z.string().optional().refine((value) => {
    if (!value) return true
    const date = new Date(value)
    return !isNaN(date.getTime())
  }, { message: 'Invalid date format for day' }),

  orderBy: z.string().optional(),
  orderDirection: z.enum(['ASC', 'DESC']).optional().default('DESC'),
})
export const paginateQuery = ['page', 'pageSize', 'interval', 'day', 'orderBy', 'orderDirection'] as const
 
export async function paginate<T extends ObjectLiteral>({
  repository,
  page,
  pageSize,
  interval,
  relations,
  order,
  orderBy,
  orderDirection = 'DESC',
  day,
  ...args
}: {
    repository: Repository<T>
    page: number
    pageSize: number
    interval?: 'month' | 'day' | 'hour' | 'none'
    day?: string
    relations?: FindOptionsRelations<T>
    order?: FindOptionsOrder<T>
    orderBy?: string
    orderDirection?: 'ASC' | 'DESC'
  } & FindOptionsWhere<T>
) {
  const targetDate = day ? new Date(day) : new Date()

  console.log(args)
  
  let start: Date | undefined = undefined
  let end: Date | undefined = undefined

  switch (interval) {
  case 'day':
    start = startOfDay(targetDate)
    end = endOfDay(targetDate)
    break
  case 'month':
    start = startOfMonth(targetDate)
    end = endOfMonth(targetDate)
    break
  case 'hour':
    start = startOfHour(targetDate)
    end = endOfHour(targetDate)
    break
  }

  const whereCondition: FindOptionsWhere<T> = {
    createdAt: (start !== undefined && end !== undefined) ? (Between(start, end) as unknown as T[keyof T]) : undefined, // forçando a tipagem
    ...args
  }

  // relations defaults from metadata
  const defaultRelations = repository.metadata.relations
    .map(rel => rel.propertyName)

  // merge defaultRelations with provided relations
  let mergedRelations: FindOptionsRelations<T> | string[]

  if (relations) {
    if (Array.isArray(relations)) {
      mergedRelations = Array.from(new Set([...defaultRelations, ...relations]))
    } else {
      // convert defaultRelations to object tree
      const defaultsTree = defaultRelations.reduce((acc, rel) => ({ ...acc, [rel]: true }), {} as Record<string, boolean>)
      mergedRelations = { ...defaultsTree, ...relations }
    }
  } else {
    mergedRelations = defaultRelations
  }

  console.log(mergedRelations)

  // Configurar ordenação
  const finalOrder = {
    ...(order || {}),
    ...(orderBy ? { [orderBy]: orderDirection } : {})
  } as FindOptionsOrder<T>

  const [data, total] = await repository.findAndCount({
    where: whereCondition,
    relations: mergedRelations,
    skip: (page - 1) * pageSize,
    take: pageSize,
    order: finalOrder
  })

  return {
    data,
    metadata: {
      total,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      pageSize,
    }
  }
}
