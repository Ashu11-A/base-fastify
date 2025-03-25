import { execSync } from 'child_process'
import cluster from 'cluster'
import { cpus } from 'os'

if (cluster.isPrimary) {
  console.log(`Master ${process.pid}`)
  execSync('bun run migration:run || true', { stdio: 'inherit' })
  
  const numCPUs = cpus().length - 1
  for (let index = 0; index < numCPUs; index++) cluster.fork()
} else await import('@/app')