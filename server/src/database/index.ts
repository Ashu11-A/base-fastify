import dataSource from './dataSource.js'
import { Auth } from './entity/Auth.js'
import { User } from './entity/User.js'

export const authTreeRepository = dataSource.getTreeRepository(Auth)

export const repository = {
  user: dataSource.getRepository(User),
  request: dataSource.getRepository(Request),
  auth: dataSource.getRepository(Auth),
}
