import { Env } from './controllers/Env'
import { Generator } from './controllers/Generator'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const path = process.cwd()
const isPKG = __dirname === path

if (!isPKG) {
  const values = new Env({ cwd: process.cwd() }).loader()
  new Generator({ values })
}
