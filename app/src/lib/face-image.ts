import { FILE_BYTES, FILE_TYPES, IMAGE_BYTES, IMAGE_SIZE } from './forum'

// A player's picture for their avatar (SKATGO-232, the human: 「大小自动压缩到一个行业惯例的中小尺寸」), made in the browser: the
// largest square in the middle of the photo, drawn 256×256 on white, as WebP — or JPEG where the browser cannot write
// WebP — each at lower quality until it is at most `IMAGE_BYTES`. Nothing is added to the site for it.

const blobOf = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((done) => canvas.toBlob(done, type, quality))

async function base64Of(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let text = ''
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(text)
}

/** The picture to upload, base64, or 'refused' for a file that is not a JPEG, PNG or WebP picture of at most
 *  `FILE_BYTES`, or that does not open as one. */
export async function squarePicture(file: File): Promise<string | 'refused'> {
  if (!FILE_TYPES.some((t) => t === file.type) || file.size > FILE_BYTES) return 'refused'
  let picture: ImageBitmap
  try {
    picture = await createImageBitmap(file)
  } catch {
    return 'refused'
  }
  const side = Math.min(picture.width, picture.height)
  const canvas = document.createElement('canvas')
  canvas.width = IMAGE_SIZE
  canvas.height = IMAGE_SIZE
  const g = canvas.getContext('2d')
  if (!g || side === 0) return 'refused'
  g.fillStyle = 'white'
  g.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE)
  g.imageSmoothingQuality = 'high'
  g.drawImage(picture, (picture.width - side) / 2, (picture.height - side) / 2, side, side, 0, 0, IMAGE_SIZE, IMAGE_SIZE)
  picture.close()
  for (const quality of [0.85, 0.7, 0.5]) {
    let blob = await blobOf(canvas, 'image/webp', quality)
    if (blob?.type !== 'image/webp') blob = await blobOf(canvas, 'image/jpeg', quality)
    if (blob && blob.size <= IMAGE_BYTES) return base64Of(blob)
  }
  return 'refused'
}
