<div align="center">

# Base Fastify

![license-info](https://img.shields.io/github/license/Ashu11-A/base-fastify?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![stars-infoa](https://img.shields.io/github/stars/Ashu11-A/base-fastify?colorA=302D41&colorB=f9e2af&style=for-the-badge)

![Last-Comitt](https://img.shields.io/github/last-commit/Ashu11-A/base-fastify?style=for-the-badge&colorA=302D41&colorB=b4befe)
![Comitts Year](https://img.shields.io/github/commit-activity/y/Ashu11-A/base-fastify?style=for-the-badge&colorA=302D41&colorB=f9e2af&logoColor=f9e2af)
![reposize-info](https://img.shields.io/github/languages/code-size/Ashu11-A/base-fastify?style=for-the-badge&colorA=302D41&colorB=90dceb)

![SourceForge Languages](https://img.shields.io/github/languages/top/Ashu11-A/base-fastify?style=for-the-badge&colorA=302D41&colorB=90dceb)

</div>
<div align="left">

## 📃 | Description

This is a "simple" base project that I've been developing for a few months. As the name suggests, it uses Fastify. My initial goal was to create a dynamic router, but the project evolved into something more like tRPC to meet my needs. You can also use this base in your front-end via the `packages/rpc` package, as shown below.

**Note:** This project is developed on-demand as new features are needed and does not have continuous maintenance. Do not expect regular bug fixes! ⚠️

## ⚡ | Using Generated Types in the Server Folder

To use the generated types in the server folder, you need to modify your project's `tsconfig.json` to enable dynamic type acquisition:

```json
{
  "compilerOptions": {
    // The usual
  },
  "references": [
    { "path": "../server" }
  ]
}
```

For an example configuration, see the [client/tsconfig.json](https://github.com/Ashu11-A/base-fastify/blob/main/client/tsconfig.json) file.

For more details on what the `references` field means, please refer to the [TypeScript Project References documentation](https://www.typescriptlang.org/docs/handbook/project-references.html#what-is-a-project-reference).

## 💡 | Examples:

### 📡 | Router:

```ts
import { Router } from '@/controllers/router.js'

export default new Router({
  name: 'Home',
  description: 'Home API',
  methods: {
    get({ reply }) {
      return reply.code(200).send({
        message: 'hello world',
        data: {}
      })
    }
  },
})
```

### 🛠️ | RPC:

```ts
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
```

The routes are dynamically typed, but their types are built in `server/src/build/rpc.ts`.

**Important:** Do not use this project in production unless you’re ready for potential headaches! 😅

</div>