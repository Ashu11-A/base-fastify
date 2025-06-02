/**
 * Converte um tamanho em bytes num string legível (B, KB, MB, GB, ...).
 *
 * @param byteLength - tamanho em bytes
 * @param decimals - número de casas decimais (padrão: 2)
 * @returns string formatada, ex: "1.23 MB"
 */
export function bytesToSizeString(byteLength: number, decimals: number = 2): string {
  if (byteLength === 0) {
    return '0 B'
  }

  const k = 1024
  const dm = Math.max(0, decimals)
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const

  const i = Math.floor(Math.log(Math.abs(byteLength)) / Math.log(k))
  const value = byteLength / Math.pow(k, i)
  const formatted = value.toFixed(dm)

  return `${formatted} ${sizes[i]}`
}