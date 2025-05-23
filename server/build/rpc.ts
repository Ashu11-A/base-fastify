/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod'
import type { Router } from '../src/controllers/router.js'
import APIRoot from '../routers/index.js'

type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? { [K in keyof R]: R[K] }: never
type UnwrapPromise<T> = T extends Promise<any> ? Awaited<T> : T
type FirstParameter<T> = T extends Router<infer First, any, any, any> ? First : never

export type Routers = {
  '/': {
    post: {
      response: MergeUnion<UnwrapPromise<ReturnType<typeof APIRoot.methods.post>>>,
      request: z.infer<NonNullable<typeof APIRoot.schema>['post']>,
      auth: undefined
    }
  }
}