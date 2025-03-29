import Home from '../../routers/index.js'
import refresh from '../../routers/auth/refresh.js'
import UserRegistration from '../../routers/auth/signup.js'
import logout from '../../routers/auth/logout.js'
import UserLogin from '../../routers/auth/login.js'

export const routers = {
  '/': Home,
  '/auth/refresh': refresh,
  '/auth/signup': UserRegistration,
  '/auth/logout': logout,
  '/auth/login': UserLogin
}
