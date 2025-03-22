import { writeFileSync } from 'fs'
import { join } from 'path'
import type { GeneratorParams } from '../types/generator'

export class Generator {
  constructor (public options: GeneratorParams) {
    this.run()
  }

  private run () {
    const outputFile = join(process.cwd(), 'src/types/env.d.ts')
    const content = `export type TProcessEnv = {
${this.options.values.map(({ value, variable }) => `  ${variable}: ${typeof value}`).join('\n')}
}

type Generic = Dict<string | number | boolean>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Generic, TProcessEnv {}
  }
}

export {}`

    writeFileSync(outputFile, content, { encoding: 'utf-8' })
  }
}