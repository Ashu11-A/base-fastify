/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod'
import type { Router } from '../controllers/router.js'
import Home from '../../routers/index.js'
import refresh from '../../routers/auth/refresh.js'
import UserRegistration from '../../routers/auth/signup.js'
import logout from '../../routers/auth/logout.js'
import UserLogin from '../../routers/auth/login.js'

type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? { [K in keyof R]: R[K] }: never
type UnwrapPromise<T> = T extends Promise<any> ? Awaited<T> : T
type FirstParameter<T> = T extends Router<infer First, any, any> ? First : never

type Test = Routers['/auth/login']['post']['response']

export type Routers = {
  '/': {
    get: {
      response: MergeUnion<UnwrapPromise<ReturnType<typeof Home.methods.get>>>,
      request: undefined,
      auth: undefined
    }
  },
  '/auth/refresh': {
    post: {
      response: MergeUnion<UnwrapPromise<ReturnType<typeof refresh.methods.post>>>,
      request: undefined,
      auth: undefined
    }
  },
  '/auth/signup': {
    post: {
      response: MergeUnion<UnwrapPromise<ReturnType<typeof UserRegistration.methods.post>>>,
      request: z.infer<NonNullable<typeof UserRegistration.schema>['post']>,
      auth: undefined
    }
  },
  '/auth/logout': {
    post: {
      response: MergeUnion<UnwrapPromise<ReturnType<typeof logout.methods.post>>>,
      request: undefined,
      auth: FirstParameter<typeof logout>
    }
  },
  '/auth/login': {
    post: {
      response: MergeUnion<UnwrapPromise<ReturnType<typeof UserLogin.methods.post>>>,
      request: z.infer<NonNullable<typeof UserLogin.schema>['post']>,
      auth: undefined
    }
  }
}