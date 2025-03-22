import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { EnvParams } from '../types/env'
import '../types/env.d'

const cwd = process.cwd()
const regex = /^([A-Z0-9_]+)="?([^"\n]*)"?$/gm

export class Env {
  constructor (public options?: EnvParams) {}

  loader () {
    const locale = this.options?.cwd ?? cwd
    const filePath = join(locale, (this.options?.envName ?? '.env'))

    if (!existsSync(filePath)) throw new Error(`The Env file could not be located: ${filePath}`)
    const content = readFileSync(filePath, { encoding: 'utf-8' })

    const matches: { variable: string, value: string | boolean | number }[] = []
    let match: RegExpExecArray | null = null

    while ((match = regex.exec(content)) !== null) {
      const value = this.parser(match[2])
      matches.push({ variable: match[1], value })
    }
  
    for (const { value, variable } of matches) {
      process.env[variable] = value
    }
    
    return matches
  }

  parser (value: string) {
    switch (true) {
    case !Number.isNaN(Number(value)): return Number(value)
    case /^(true|false)$/.test(value): return Boolean(value)
    default: return value
    }
  }
}