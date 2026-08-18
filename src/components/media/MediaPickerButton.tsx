import { useState, useEffect, useRef, useCallback } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { role, myUmkm } = useAuthStore()

  // ── Upload a single file (image or video) directly to Supabase ──
  const uploadFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/') || file.type.includes('svg')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error(`Format file tidak didukung: ${file.type}`)
      return
    }

    setUploading(true)
    const folderToSave = folder === 'semua' ? 'Lainnya' : folder

    try {
      let uploadBlob: Blob = file
      let fileName = file.name.replace(/[^a-z0-9._-]/gi, '_')
      let mimeType = file.type

      if (isImage) {
        // Compress images
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

      // Save to media_assets
      await supabase.from('media_assets').insert({
        file_name: fileName,
        file_size: uploadBlob.size,
        url: urlData.publicUrl,
        mime_type: mimeType,
        module: moduleName,
        checksum: '',
        folder: folderToSave,
        alt_text: file.name.replace(/\.[^.]+$/, ''),
        umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : null,
      })

      onChange(urlData.publicUrl)
      toast.success('File berhasil diunggah! ✅')
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat mengunggah')
    } finally {
      setUploading(false)
    }
  }, [folder, moduleName, role, myUmkm, onChange])

  // ── Global paste listener (Ctrl+V / Cmd+V) when this component is mounted ──
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only intercept if MediaManager is NOT open (avoid double handling)
      if (managerOpen) return

      // Don't steal from text inputs
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
          const blob = item.getAsFile()
          if (!blob) continue
          const ext = item.type.split('/')[1] || 'png'
          const file = new File([blob], `paste_${Date.now()}.${ext}`, { type: blob.type })
          uploadFile(file)
          e.preventDefault()
          return // only first match
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [managerOpen, uploadFile])

  const handleSelectMedia = (selected: MediaItem[]) => {
    if (selected.length > 0) {
      onChange(selected[0].url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  // Determine preview type
  const isVideo = value && (
    value.includes('.mp4') || value.includes('.mov') || value.includes('.webm') ||
    value.includes('.avi') || value.includes('.mkv') || value.includes('video')
  )

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 ${className || ''}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {value ? (
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
              <Images size={14} className="text-[#2D6A4F]" />
              Ganti Media
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow"
            >
              <X size={14} />
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Drop/Paste Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`w-full py-7 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 text-gray-600 transition-all select-none group ${
              isDragOver
                ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 scale-[1.01]'
                : 'border-gray-300 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-[#2D6A4F]">Mengunggah...</p>
              </div>
            ) : (
              <>
                {/* Pilih dari library */}
                <button
                  type="button"
                  onClick={() => setManagerOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#2D6A4F] hover:underline"
                >
                  <Images size={14} /> Pilih dari Media Library
                </button>

                <div className="flex items-center gap-2 text-[10px] text-gray-400 w-full px-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span>atau</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Upload from device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#2D6A4F] transition-colors"
                >
                  <Upload size={13} /> Upload dari Perangkat
                </button>

                {/* Paste hint */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-500">Ctrl</kbd>
                  <span className="text-[10px] text-gray-400">+</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-500">V</kbd>
                  <span className="text-[10px] text-gray-500">untuk paste dari clipboard</span>
                  <Clipboard size={11} className="text-gray-400" />
                </div>

                <p className="text-[10px] text-gray-400">Gambar & Video — Seret file ke sini</p>
              </>
            )}
          </div>
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
