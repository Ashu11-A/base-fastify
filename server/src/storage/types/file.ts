export enum FileType {
  Video = 'video',
  Image = 'image',
  Text = 'text',
  Binary = 'binary'
}

export type FileMetadata = {
  id: number
  name: string
  size: number
  type: FileType
  mimeType: string
}