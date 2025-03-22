export type JWTData = {
  id: number
  uuid: string
  username: string
  email: string
  iat?: number
  exp?: number
}