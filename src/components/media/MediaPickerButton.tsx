import { useState, useRef, useCallback } from 'react'
import { Images, X, Clipboard, Upload } from 'lucide-react'
import MediaManager from './MediaManager'
import { MediaItem } from '../../stores/mediaStore'
import { supabase } from '../../lib/supabase'
import { processImageFile } from '../../lib/mediaUtils'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface MediaPickerButtonProps {
  value?: string
  onChange: (url: string | null) => void
  label?: string
  error?: string
  folder?: string
  moduleName?: string
  className?: string
}

export default function MediaPickerButton({
  value,
  onChange,
  label = 'Gambar',
  error,
  folder = 'Lainnya',
  moduleName = 'Lainnya',
  className,
}: MediaPickerButtonProps) {
  const [managerOpen, setManagerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [pastingClipboard, setPastingClipboard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { role, myUmkm } = useAuthStore()

  // ── Core upload function ──
  const uploadFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/') || file.type.includes('svg')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error(`Format tidak didukung: ${file.type || file.name}`)
      return
    }

    setUploading(true)
    const folderToSave = folder === 'semua' ? 'Lainnya' : folder

    try {
      let uploadBlob: Blob = file
      let fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `upload_${Date.now()}`
      let mimeType = file.type

      if (isImage) {
        const processed = await processImageFile(file, file.name, {
          maxDimension: 1200,
          quality: 0.82,
        })
        uploadBlob = processed.blob
        fileName = processed.fileName
        mimeType = processed.mimeType
      }

      const storagePath = `${folderToSave}/${Date.now()}_${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, uploadBlob, {
          cacheControl: '31536000',
          upsert: false,
          contentType: mimeType,
        })

      if (uploadError) {
        toast.error('Gagal mengunggah: ' + uploadError.message)
        return
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath)

      await supabase.from('media_assets').insert({
        file_name: fileName,
        file_size: uploadBlob.size,
        url: urlData.publicUrl,
        mime_type: mimeType,
        module: moduleName,
        checksum: '',
        folder: folderToSave,
        alt_text: file.name.replace(/\.[^.]+$/, '') || fileName,
        umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : null,
      })

      onChange(urlData.publicUrl)
      toast.success('Berhasil diunggah! ✅')
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat mengunggah')
    } finally {
      setUploading(false)
    }
  }, [folder, moduleName, role, myUmkm, onChange])

  // ── Paste via explicit button click → navigator.clipboard.read() ──
  // This is the ONLY reliable way to read clipboard in modern browsers
  const handlePasteFromClipboard = async () => {
    setPastingClipboard(true)
    try {
      // Modern Clipboard API — requires user gesture (this button click IS the gesture)
      if (!navigator.clipboard?.read) {
        toast.error('Browser Anda tidak mendukung paste clipboard. Gunakan Ctrl+C lalu drag-drop, atau Upload dari Perangkat.')
        return
      }

      const clipboardItems = await navigator.clipboard.read()
      let handled = false

      for (const clipItem of clipboardItems) {
        for (const type of clipItem.types) {
          if (type.startsWith('image/') || type.startsWith('video/')) {
            const blob = await clipItem.getType(type)
            const ext = type.split('/')[1] || 'png'
            const file = new File([blob], `paste_${Date.now()}.${ext}`, { type })
            await uploadFile(file)
            handled = true
            break
          }
        }
        if (handled) break
      }

      if (!handled) {
        toast.error('Tidak ada gambar atau video di clipboard. Salin gambar terlebih dahulu lalu klik Paste.')
      }
    } catch (err: unknown) {
      // NotAllowedError = user denied clipboard permission
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error('Akses clipboard ditolak. Izinkan akses clipboard di browser Anda.')
      } else {
        // Fallback: try legacy paste via event dispatch
        toast('Gunakan Ctrl+V saat berada di area ini untuk paste gambar.', { icon: '📋' })
      }
      console.warn('Clipboard read error:', err)
    } finally {
      setPastingClipboard(false)
    }
  }

  // ── Fallback: listen to native paste event on the component area ──
  const handleNativePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        const blob = item.getAsFile()
        if (!blob) continue
        const ext = item.type.split('/')[1] || 'png'
        const file = new File([blob], `paste_${Date.now()}.${ext}`, { type: item.type })
        uploadFile(file)
        e.preventDefault()
        return
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files[0]) uploadFile(files[0])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
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
        /* ── Empty state ── */
        <div
          tabIndex={0}
          onPaste={handleNativePaste}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-2xl transition-all outline-none focus:ring-2 focus:ring-[#2D6A4F] ${
            isDragOver
              ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 scale-[1.01]'
              : 'border-gray-300 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5'
          }`}
        >
          {uploading || pastingClipboard ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <div className="w-7 h-7 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#2D6A4F]">
                {pastingClipboard ? 'Membaca clipboard...' : 'Mengunggah...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-6 px-4">
              {/* Row 1: Media Library */}
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

              {/* Row 2: Upload + Paste */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {/* Upload from device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Upload size={13} /> Upload File
                </button>

                {/* Paste from clipboard — uses navigator.clipboard.read() on click */}
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors"
                  title="Paste gambar/video dari clipboard (Ctrl+C dahulu lalu klik tombol ini)"
                >
                  <Clipboard size={13} />
                  Paste dari Clipboard
                </button>
              </div>

              {/* Hint text */}
              <p className="text-[10px] text-gray-400 text-center">
                Seret file ke sini · Gambar &amp; Video · Atau fokus area ini lalu <kbd className="px-1 bg-gray-100 border rounded text-[9px] font-mono">Ctrl+V</kbd>
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Media Manager Modal */}
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
