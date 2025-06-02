export function formatPath (path: string) {
  path = path.replace(/\.(ts|js)$/i, '') // Remove extensões ".ts" ou ".js"
    .replace('index', '')       // Remove "/index" para deixar "/"
    .replace(/\([^)]*\)/g, '')  // Remove parênteses e seu conteúdo
    .replace(/[/\\]+$/, '')     // Remove barras finais "/" ou "\"
    .replace(/\\/g, '/')        // Converte "\" para "/"
    .replace(/\$/g, ':')        // Substitui todos '$' por ':'
  // Garante que o path comece com '/'
  if (!path.startsWith('/')) path = '/' + path
  
  return path
}