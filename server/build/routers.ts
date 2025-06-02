import APIRoot from '../routers/index.js'
import CreateUser from '../routers/users/create.js'
import DeleteUser from '../routers/users/$id/delete.js'
import EditUser from '../routers/users/$id/edit.js'
import GetUser from '../routers/users/$id/get.js'
import GetUserProfile from '../routers/users/profile.js'
import ListUsers from '../routers/users/index.js'
import TokenRefresh from '../routers/auth/refresh.js'
import UserAuthentication from '../routers/auth/login.js'
import UserLogout from '../routers/auth/logout.js'
import UserRegistration from '../routers/auth/signup.js'

export const routers = {
  '/': APIRoot,
  '/auth/login': UserAuthentication,
  '/auth/logout': UserLogout,
  '/auth/refresh': TokenRefresh,
  '/auth/signup': UserRegistration,
  '/users': [CreateUser, ListUsers],
  '/users/:id': [DeleteUser, EditUser, GetUser],
  '/users/profile': GetUserProfile
}
