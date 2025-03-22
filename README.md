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

## 💡 Example: How the RPC Works 🛠️

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
```

The routes are dynamically typed, but their types are built in `server/src/rpc.ts`.

**Important:** This project does not actually implement the RPC protocol; its name is merely inspired by the tRPC project. Do not use this project in production unless you’re ready for potential headaches! 😅

</div>