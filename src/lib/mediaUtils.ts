/**
 * Media Utilities for Image Compression, WebP/AVIF Conversion,
 * Crop, Rotate, Flip, and SHA-256 Deduplication Checksum.
 */

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageTransformOptions {
  rotate?: number // 0, 90, 180, 270
  flipH?: boolean
  flipV?: boolean
  crop?: CropArea
  aspectRatio?: number // e.g. 1 (1:1), 4/3, 16/9, 9/16, or 0 (free/original)
  maxDimension?: number // max width/height in px (default 1920)
  quality?: number // 0.1 to 1.0 (default 0.85)
  format?: 'image/webp' | 'image/avif' | 'image/jpeg' | 'image/png'
}

export interface ProcessedMedia {
  base64: string
  blob: Blob
  fileName: string
  fileSize: number // in bytes
  mimeType: string
  width: number
  height: number
  checksum: string
}

/**
 * Calculates SHA-256 checksum of ArrayBuffer / Blob for deduplication
 */
export async function calculateChecksum(blobOrBuffer: Blob | ArrayBuffer): Promise<string> {
  const buffer = blobOrBuffer instanceof Blob ? await blobOrBuffer.arrayBuffer() : blobOrBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Checks if AVIF format is supported by current browser's canvas
 */
export function checkAvifSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  } catch {
    return false
  }
}

/**
 * Loads an image File or Base64 string into an HTMLImageElement
 */
export function loadImage(src: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(new Error('Gagal memuat gambar: ' + err))

    if (src instanceof File || src instanceof Blob) {
      img.src = URL.createObjectURL(src)
    } else {
      img.src = src
    }
  })
}

/**
 * Main function to crop, rotate, flip, compress & convert images
 */
export async function processImageFile(
  fileOrSrc: File | Blob | string,
  fileNameCustom?: string,
  options: ImageTransformOptions = {}
): Promise<ProcessedMedia> {
  const img = await loadImage(fileOrSrc)

  const origWidth = img.naturalWidth || img.width
  const origHeight = img.naturalHeight || img.height

  // Setup canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D Context tidak tersedia')

  const rotate = (options.rotate || 0) % 360
  const isRotated90 = rotate === 90 || rotate === 270

  // Calculate rotated bounding canvas dimensions
  const boundWidth = isRotated90 ? origHeight : origWidth
  const boundHeight = isRotated90 ? origWidth : origHeight

  // Handle crop or use full image
  const crop = options.crop || { x: 0, y: 0, width: boundWidth, height: boundHeight }

  // Target canvas dimension based on crop
  let targetWidth = crop.width
  let targetHeight = crop.height

  // Scale down if exceeds maxDimension
  const maxDim = options.maxDimension || 1920
  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight / targetWidth) * maxDim)
      targetWidth = maxDim
    } else {
      targetWidth = Math.round((targetWidth / targetHeight) * maxDim)
      targetHeight = maxDim
    }
  }

  canvas.width = targetWidth
  canvas.height = targetHeight

  // Background for transparency conversion
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  // Save context state for rotation & flipping
  ctx.save()

  // Scale context to target size
  const scaleX = targetWidth / crop.width
  const scaleY = targetHeight / crop.height
  ctx.scale(scaleX, scaleY)

  // Translate to crop center
  ctx.translate(-crop.x, -crop.y)

  // Apply rotation around image center
  ctx.translate(boundWidth / 2, boundHeight / 2)
  if (rotate !== 0) {
    ctx.rotate((rotate * Math.PI) / 180)
  }

  // Apply flip
  const flipH = options.flipH ? -1 : 1
  const flipV = options.flipV ? -1 : 1
  if (options.flipH || options.flipV) {
    ctx.scale(flipH, flipV)
  }

  // Draw original image centered
  ctx.drawImage(img, -origWidth / 2, -origHeight / 2, origWidth, origHeight)

  ctx.restore()

  // Format selection (AVIF if supported, otherwise WebP)
  let targetFormat = options.format
  if (!targetFormat) {
    if (checkAvifSupport()) {
      targetFormat = 'image/avif'
    } else {
      targetFormat = 'image/webp'
    }
  }

  const quality = options.quality ?? 0.85
  const base64 = canvas.toDataURL(targetFormat, quality)

  // Convert canvas to Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error('Gagal mengolah blob gambar'))
      },
      targetFormat,
      quality
    )
  })

  // Calculate SHA-256 checksum
  const checksum = await calculateChecksum(blob)

  // Determine file extension
  let ext = 'webp'
  if (targetFormat === 'image/avif') ext = 'avif'
  else if (targetFormat === 'image/png') ext = 'png'
  else if (targetFormat === 'image/jpeg') ext = 'jpg'

  // Prepare filename
  let baseName = fileNameCustom || (fileOrSrc instanceof File ? fileOrSrc.name : 'media')
  baseName = baseName.substring(0, baseName.lastIndexOf('.')) || baseName
  baseName = baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  const finalFileName = `${baseName}.${ext}`

  return {
    base64,
    blob,
    fileName: finalFileName,
    fileSize: blob.size,
    mimeType: targetFormat,
    width: targetWidth,
    height: targetHeight,
    checksum,
  }
}

/**
 * Format bytes to readable size (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
