import { useRef, useState } from 'react'
import { UploadCloud, X, ImageIcon, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (base64: string | null) => void
  label?: string
  error?: string
  /** Max dimensi terpanjang setelah resize (px). Default 800 */
  maxDimension?: number
  /** Kualitas WebP 0–1. Default 0.82 */
  quality?: number
  /** Batas ukuran file input sebelum diproses (MB). Default 10 */
  maxInputMB?: number
  /** Alias untuk maxInputMB agar kompatibel dengan prop lama */
  maxSizeMB?: number
  className?: string
}

interface CompressInfo {
  originalKB: number
  resultKB: number
  ratio: number   // persen pengurangan
}

/**
 * Compress + resize gambar menggunakan Canvas API, output WebP.
 * Tidak butuh library eksternal.
 */
function compressImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<{ base64: string; info: CompressInfo }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Gagal memuat gambar'))
      img.onload = () => {
        // Hitung dimensi baru — pertahankan aspect ratio
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension)
            width = maxDimension
          } else {
            width = Math.round((width / height) * maxDimension)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas tidak tersedia')); return }

        // Gambar dengan background putih (penting untuk PNG transparan → WebP)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // Output WebP — fallback ke JPEG kalau browser tidak support
        const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp')
        const mime = supportsWebP ? 'image/webp' : 'image/jpeg'
        const base64 = canvas.toDataURL(mime, quality)

        const originalKB = Math.round(file.size / 1024)
        const resultKB = Math.round((base64.length * 3) / 4 / 1024)
        const ratio = Math.max(0, Math.round((1 - resultKB / originalKB) * 100))

        resolve({ base64, info: { originalKB, resultKB, ratio } })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function ImageUpload({
  value,
  onChange,
  label = 'Gambar',
  error,
  maxDimension = 800,
  quality = 0.82,
  maxInputMB: maxInputMBProp,
  maxSizeMB,
  className,
}: ImageUploadProps) {
  // Support both maxInputMB and legacy maxSizeMB prop
  const maxInputMB = maxInputMBProp ?? maxSizeMB ?? 10
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [info, setInfo] = useState<CompressInfo | null>(null)

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WebP, dll).')
      return
    }
    if (file.size > maxInputMB * 1024 * 1024) {
      alert(`Ukuran file terlalu besar. Maksimal ${maxInputMB}MB.`)
      return
    }

    setProcessing(true)
    setInfo(null)
    try {
      const { base64, info: compressInfo } = await compressImage(file, maxDimension, quality)
      onChange(base64)
      setInfo(compressInfo)
    } catch (err) {
      alert('Gagal memproses gambar. Coba file lain.')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setInfo(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div
        onClick={() => !value && !processing && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden',
          value
            ? 'border-[#2D6A4F]/40 cursor-default'
            : 'cursor-pointer hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5',
          dragging && !value ? 'border-[#2D6A4F] bg-[#2D6A4F]/8 scale-[1.01]' : '',
          error ? 'border-red-400' : 'border-gray-300'
        )}
      >
        {value ? (
          /* ── Preview ── */
          <div className="relative group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            {/* Overlay tombol aksi */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-200 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 hover:bg-gray-100 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
              >
                <UploadCloud size={14} />
                Ganti
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white hover:bg-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
              >
                <X size={14} />
                Hapus
              </button>
            </div>
          </div>
        ) : (
          /* ── Empty / Processing state ── */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
            {processing ? (
              <>
                <div className="w-10 h-10 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-600">Mengompres gambar...</p>
                <p className="text-xs text-gray-400 mt-1">Resize + konversi ke WebP</p>
              </>
            ) : (
              <>
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors',
                  dragging ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  {dragging ? <UploadCloud size={24} /> : <ImageIcon size={24} />}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {dragging ? 'Lepaskan untuk upload' : 'Klik atau seret gambar ke sini'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WebP — Maks. {maxInputMB}MB
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Otomatis dikompres → WebP, max {maxDimension}px
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info hasil kompresi */}
      {info && value && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
          <CheckCircle size={13} className="shrink-0 text-green-500" />
          <span>
            Dikompres: <strong>{info.originalKB} KB</strong> → <strong>{info.resultKB} KB</strong>
            {' '}
            <span className="text-green-500 font-semibold">(-{info.ratio}%)</span>
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
