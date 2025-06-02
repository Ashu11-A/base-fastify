import { fileURLToPath } from 'bun'

export const isDev = fileURLToPath(import.meta.url).includes('.ts') 