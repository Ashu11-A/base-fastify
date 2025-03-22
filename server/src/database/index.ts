import dataSource from './dataSource.js'
import { Auth } from './entity/Auth.js'
import { User } from './entity/User.js'

export const userRepository = dataSource.getRepository(User)
export const authRepository = dataSource.getRepository(Auth)
export const authTreeRepository = dataSource.getTreeRepository(Auth)
