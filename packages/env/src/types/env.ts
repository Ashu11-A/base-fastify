export type EnvParams = {
  envFile?: string
  /**
   * @default .env
   */
  envName?: string
  /**
   * @default process.cwd()
   */
  cwd?: string
}