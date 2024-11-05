import dataSource from './dataSource.js'
import { User } from './entity/User.js'

export const userRepository = dataSource.getRepository(User)