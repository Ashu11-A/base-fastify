import { Client, ErrorResponse } from 'rpc'
import type { Routers } from 'server'

const rpc = new Client<Routers>('http://0.0.0.0:3500')
const result = await rpc.query('/', 'get')

// All routes can return errors—learn how to handle them!
// A request might not always be successful.
if (result instanceof ErrorResponse) {
  console.log(result.message)
  process.exit()
}

console.log(result.message) // hello world
console.log(result.data) // {}