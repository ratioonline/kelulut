import { useState, useRef } from 'react'
import { Images, X, Clipboard, Upload } from 'lucide-react'
import MediaManager from './MediaManager'
import { MediaItem } from '../../stores/mediaStore'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

interface MediaPickerButtonProps {
  value?: string
  onChange: (url: string | null) => void
  label?: string
  error?: string
  folder?: string
  moduleName?: string
  className?: string
  accept?: string
  uploadToStorage?: boolean
}

// ── Convert File/Blob to base64 data URL ──
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

// ── Compress image via canvas, return base64 ──
async function compressImage(file: File | Blob, maxPx = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round((height / width) * maxPx); width = maxPx }
        else { width = Math.round((width / height) * maxPx); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/webp', quality))
    }
    img.onerror = () => reject(new Error('Gagal memuat gambar'))
    img.src = url
  })
}

export default function MediaPickerButton({
  value,
  onChange,
  label = 'Gambar',
  error,
  folder = 'Lainnya',
  moduleName = 'Lainnya',
  className,
  accept,
  uploadToStorage = false,
}: MediaPickerButtonProps) {
  const [managerOpen, setManagerOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Process any file → base64 or upload to storage ──
  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/') || file.type.includes('svg')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error(`Format tidak didukung: ${file.type || file.name}`)
      return
    }

    if (isVideo && !uploadToStorage && file.size > 50 * 1024 * 1024) {
      toast.error('Video melebihi batas 50 MB untuk preview langsung. Gunakan Media Library.')
      return
    }
    if (isVideo && uploadToStorage && file.size > 200 * 1024 * 1024) {
      toast.error(`Video ${file.name} melebihi batas 200 MB.`)
      return
    }

    setProcessing(true)
    const toastId = uploadToStorage ? toast.loading(`Mengunggah ${file.name}...`) : undefined

    try {
      if (uploadToStorage) {
        let blobToUpload: Blob = file
        let contentType = file.type
        let uploadFileName = file.name

        // Compress image before upload, but keep video as is
        if (isImage && !file.type.includes('svg')) {
           const base64 = await compressImage(file)
           const res = await fetch(base64)
           blobToUpload = await res.blob()
           contentType = 'image/webp'
           uploadFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
        }

        const ext = uploadFileName.split('.').pop() || (isVideo ? 'mp4' : 'webp')
        const baseName = uploadFileName.replace(/[^a-z0-9._-]/gi, '_')
        const uniqueFileName = `${Date.now()}_${baseName}`
        const storagePath = `${folder}/${uniqueFileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, blobToUpload, {
            cacheControl: '31536000',
            upsert: false,
            contentType: contentType
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath)
        const finalUrl = publicUrlData.publicUrl

        // Insert to media_assets silently
        await supabase.from('media_assets').insert({
            file_name: uniqueFileName,
            file_size: blobToUpload.size,
            url: finalUrl,
            mime_type: contentType,
            module: moduleName,
            folder: folder,
            alt_text: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
        })

        onChange(finalUrl)
        if (toastId) toast.success('Berhasil diunggah ✅', { id: toastId })
        else toast.success('File siap digunakan ✅')

      } else {
        let base64: string
        if (isImage) {
          base64 = await compressImage(file)
        } else {
          base64 = await fileToBase64(file)
        }
        onChange(base64)
        toast.success('File siap digunakan ✅')
      }
    } catch (err) {
      console.error(err)
      if (toastId) toast.error('Gagal mengunggah file. Silakan coba lagi.', { id: toastId })
      else toast.error('Gagal memproses file')
    } finally {
      setProcessing(false)
    }
  }

  // ── Paste via navigator.clipboard.read() — button click as user gesture ──
  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      toast.error('Browser tidak mendukung Clipboard API. Gunakan Upload File atau drag-drop.')
      return
    }
    setProcessing(true)
    try {
      const clipboardItems = await navigator.clipboard.read()
      let handled = false

      for (const clipItem of clipboardItems) {
        for (const type of clipItem.types) {
          if (type.startsWith('image/') || type.startsWith('video/')) {
            const blob = await clipItem.getType(type)
            const ext = type.split('/')[1]?.replace(/\+.*/, '') || 'png'
            const file = new File([blob], `paste_${Date.now()}.${ext}`, { type })
            setProcessing(false)
            await processFile(file)
            handled = true
            break
          }
        }
        if (handled) break
      }

      if (!handled) {
        toast.error('Tidak ada gambar di clipboard. Salin gambar terlebih dahulu lalu klik Paste.')
        setProcessing(false)
      }
    } catch (err: unknown) {
      setProcessing(false)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error('Akses clipboard ditolak. Izinkan akses clipboard di pengaturan browser.')
      } else {
        toast.error('Gagal membaca clipboard. Coba gunakan Upload File.')
      }
      console.warn('Clipboard read:', err)
    }
  }

  // ── Native paste fallback (when container is focused → user presses Ctrl+V) ──
  const handleNativePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        const blob = item.getAsFile()
        if (!blob) continue
        const ext = item.type.split('/')[1]?.replace(/\+.*/, '') || 'png'
        const file = new File([blob], `paste_${Date.now()}.${ext}`, { type: item.type })
        processFile(file)
        e.preventDefault()
        return
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleSelectMedia = (selected: MediaItem[]) => {
    if (selected.length > 0) onChange(selected[0].url)
  }

  const isVideo = value && /\.(mp4|mov|webm|avi|mkv|ogv)(\?|$)/i.test(value)

  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {value ? (
        /* ── Preview state ── */
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 group bg-gray-900 h-44 flex items-center justify-center shadow-sm">
          {isVideo ? (
            <video src={value} controls className="max-h-full max-w-full object-contain" />
          ) : (
            <img src={value} alt="Selected media" className="max-h-full max-w-full object-contain" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow"
            >
              <Images size={14} className="text-[#2D6A4F]" /> Ganti Media
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow"
            >
              <X size={14} /> Hapus
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty / upload state ── */
        <div
          tabIndex={0}
          onPaste={handleNativePaste}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-2xl transition-all outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] ${
            isDragOver
              ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 scale-[1.01]'
              : 'border-gray-300 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5'
          }`}
        >
          {processing ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <div className="w-7 h-7 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#2D6A4F]">Memproses...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
              {/* Media Library */}
              <button
                type="button"
                onClick={() => setManagerOpen(true)}
                className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F] hover:underline"
              >
                <Images size={15} /> Pilih dari Media Library
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2 text-[10px] text-gray-400 w-full">
                <div className="flex-1 h-px bg-gray-200" />
                <span>atau</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Upload size={13} /> Upload File
                </button>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors"
                  title="Salin gambar dahulu lalu klik ini (atau Ctrl+V setelah klik area ini)"
                >
                  <Clipboard size={13} /> Paste Gambar
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                Seret file ke sini · Atau klik area ini lalu tekan{' '}
                <kbd className="px-1 bg-gray-100 border rounded text-[9px] font-mono">Ctrl+V</kbd>
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept || "image/*,video/*,image/svg+xml"}
        className="hidden"
        onChange={handleFileChange}
      />

      <MediaManager
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        onSelect={handleSelectMedia}
        multiple={false}
        defaultFolder={folder}
        moduleName={moduleName}
      />
    </div>
  )
}
