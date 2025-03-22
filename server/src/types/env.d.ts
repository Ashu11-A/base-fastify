export type TProcessEnv = {
  PRODUCTION: boolean
  PORT: number
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_PASSWORD: number
  DATABASE_TYPE: string
  DATABASE_HOST: string
  DATABASE_PORT: number
  DATABASE_USERNAME: string
  DATABASE_PASSWORD: string
  DATABASE_NAME: string
  JWT_TOKEN: string
  JWT_EXPIRE: string
  REFRESH_TOKEN: string
  REFRESH_EXPIRE: string
  COOKIE_TOKEN: string
  FRONT_END_URL: string
  STORAGE_TYPE: string
  LOCAL_STORAGE_PATH: string
}

type Generic = Dict<string | number | boolean>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Generic, TProcessEnv {}
  }
}

export {}