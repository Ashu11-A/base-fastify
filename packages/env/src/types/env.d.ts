type Generic = Dict<string | number | boolean>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Generic, TProcessEnv {}
  }
}

export {}