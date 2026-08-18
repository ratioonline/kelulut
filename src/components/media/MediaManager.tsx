import { useState, useEffect, useRef, useMemo } from 'react'
import {
  UploadCloud,
  Grid,
  List,
  Search,
  Trash2,
  Download,
  FolderPlus,
  X,
  FileImage,
  Folder,
  ClipboardCheck,
  Check,
  Camera,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Modal, { ConfirmModal } from '../ui/Modal'
import Button from '../ui/Button'
import { useMediaStore, MediaItem } from '../../stores/mediaStore'
import { useAuthStore } from '../../stores/authStore'
import { processImageFile, formatBytes, ProcessedMedia } from '../../lib/mediaUtils'
import ImageCropModal from './ImageCropModal'
import MediaDetailModal from './MediaDetailModal'
import CameraCaptureModal from './CameraCaptureModal'
import toast from 'react-hot-toast'

interface MediaManagerProps {
  isOpen?: boolean
  onClose?: () => void
  onSelect?: (items: MediaItem[]) => void
  multiple?: boolean
  defaultFolder?: string
  moduleName?: string
  isInline?: boolean
}

export default function MediaManager({
  isOpen = true,
  onClose = () => {},
  onSelect,
  multiple = false,
  defaultFolder = 'Lainnya',
  moduleName = 'Lainnya',
  isInline = false,
}: MediaManagerProps) {
  const {
    items,
    folders,
    selectedFolder,
    searchQuery,
    selectedModule,
    sortBy,
    viewMode,
    selectedIds,
    isLoading,
    hasMore,
    fetchMedia,
    addOptimisticMedia,
    deleteMediaBatch,
    createFolder,
    setSelectedFolder,
    setSearchQuery,
    setSortBy,
    setViewMode,
    toggleSelectId,
    selectAll,
    clearSelection,
    scanExistingAppImages,
  } = useMediaStore()
  const { role, myUmkm } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library')
  const initialFolder = defaultFolder === 'semua' ? 'Lainnya' : defaultFolder
  const [targetFolderUpload, setTargetFolderUpload] = useState(initialFolder)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cropItemSrc, setCropItemSrc] = useState<string | File | null>(null)
  const [cropItemName, setCropItemName] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  // Detail Modal state
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch media on mount
  useEffect(() => {
    if (isOpen || isInline) {
      fetchMedia(true)
      setTargetFolderUpload(defaultFolder === 'semua' ? 'Lainnya' : defaultFolder)
    }
  }, [isOpen, isInline, defaultFolder])

  // ── Paste via navigator.clipboard.read() — called by explicit button click ──
  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      toast.error('Browser tidak mendukung Clipboard API. Gunakan drag-drop atau Upload File.')
      return
    }
    try {
      const clipboardItems = await navigator.clipboard.read()
      const filesToProcess: File[] = []

      for (const clipItem of clipboardItems) {
        for (const type of clipItem.types) {
          if (type.startsWith('image/') || type.startsWith('video/')) {
            const blob = await clipItem.getType(type)
            const ext = type.split('/')[1] || 'png'
            filesToProcess.push(new File([blob], `paste_${Date.now()}.${ext}`, { type }))
          }
        }
      }

      if (filesToProcess.length > 0) {
        const imgCount = filesToProcess.filter(f => f.type.startsWith('image/')).length
        const vidCount = filesToProcess.filter(f => f.type.startsWith('video/')).length
        const label = [imgCount && `${imgCount} gambar`, vidCount && `${vidCount} video`].filter(Boolean).join(' & ')
        toast.success(`📋 ${label} dari clipboard — sedang diunggah...`)
        handleBatchProcessFiles(filesToProcess)
      } else {
        toast.error('Tidak ada gambar/video di clipboard. Salin gambar terlebih dahulu.')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error('Akses clipboard ditolak. Izinkan akses clipboard di browser Anda.')
      } else {
        toast.error('Gagal membaca clipboard.')
      }
      console.warn('Clipboard read error:', err)
    }
  }

  // Batch Process Upload to Supabase Storage (images + videos)
  const handleBatchProcessFiles = async (files: File[]) => {
    const imageFiles: File[] = []
    const videoFiles: File[] = []

    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.includes('svg')) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} melebihi batas 50 MB.`)
          continue
        }
        imageFiles.push(file)
      } else if (file.type.startsWith('video/')) {
        if (file.size > 200 * 1024 * 1024) {
          toast.error(`Video ${file.name} melebihi batas 200 MB.`)
          continue
        }
        videoFiles.push(file)
      } else {
        toast.error(`Format file ${file.name} tidak didukung.`)
      }
    }

    if (imageFiles.length === 0 && videoFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(5)

    try {
      const folderToSave = targetFolderUpload === 'semua' ? 'Lainnya' : targetFolderUpload
      let successCount = 0
      const total = imageFiles.length + videoFiles.length
      let done = 0

      // ── Upload IMAGES (with compression) ──
      for (const file of imageFiles) {
        try {
          const processed = await processImageFile(file, file.name, {
            maxDimension: 1200,
            quality: 0.80,
          })

          const uniqueFileName = `${Date.now()}_${processed.fileName}`
          const storagePath = `${folderToSave}/${uniqueFileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(storagePath, processed.blob, {
              cacheControl: '31536000',
              upsert: false,
              contentType: processed.mimeType
            })

          if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            toast.error(`Gagal mengunggah ${processed.fileName}`)
            done++; setUploadProgress(Math.round((done / total) * 95))
            continue
          }

          const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath)

          const { data: dbData, error: dbError } = await supabase.from('media_assets').insert({
            file_name: processed.fileName,
            file_size: processed.fileSize,
            url: publicUrlData.publicUrl,
            mime_type: processed.mimeType,
            module: moduleName,
            checksum: processed.checksum,
            folder: folderToSave,
            alt_text: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
            umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : null
          }).select().single()

          if (!dbError && dbData) {
            addOptimisticMedia({
              id: dbData.id,
              fileName: dbData.file_name,
              fileSize: dbData.file_size,
              url: dbData.url,
              mimeType: dbData.mime_type,
              checksum: dbData.checksum || '',
              folder: dbData.folder,
              module: dbData.module,
              createdAt: dbData.created_at,
              altText: dbData.alt_text || '',
              umkm_id: dbData.umkm_id
            })
            successCount++
          } else if (dbError) {
            toast.error(`Gagal menyimpan metadata ${processed.fileName}`)
          }
        } catch (imgErr) {
          console.error('Image processing error:', imgErr)
          toast.error(`Gagal memproses ${file.name}`)
        }
        done++; setUploadProgress(Math.round((done / total) * 95))
      }

      // ── Upload VIDEOS (direct, no compression) ──
      for (const file of videoFiles) {
        try {
          const ext = file.name.split('.').pop() || 'mp4'
          const baseName = file.name.replace(/[^a-z0-9._-]/gi, '_')
          const uniqueFileName = `${Date.now()}_${baseName}`
          const storagePath = `${folderToSave}/${uniqueFileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(storagePath, file, {
              cacheControl: '31536000',
              upsert: false,
              contentType: file.type || `video/${ext}`
            })

          if (uploadError) {
            console.error('Video Upload Error:', uploadError)
            toast.error(`Gagal mengunggah video ${file.name}`)
            done++; setUploadProgress(Math.round((done / total) * 95))
            continue
          }

          const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(storagePath)

          const { data: dbData, error: dbError } = await supabase.from('media_assets').insert({
            file_name: uniqueFileName,
            file_size: file.size,
            url: publicUrlData.publicUrl,
            mime_type: file.type || `video/${ext}`,
            module: moduleName,
            checksum: '',
            folder: folderToSave,
            alt_text: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
            umkm_id: role === 'umkm_user' ? (myUmkm?.id || null) : null
          }).select().single()

          if (!dbError && dbData) {
            addOptimisticMedia({
              id: dbData.id,
              fileName: dbData.file_name,
              fileSize: dbData.file_size,
              url: dbData.url,
              mimeType: dbData.mime_type,
              checksum: '',
              folder: dbData.folder,
              module: dbData.module,
              createdAt: dbData.created_at,
              altText: dbData.alt_text || '',
              umkm_id: dbData.umkm_id
            })
            successCount++
          } else if (dbError) {
            toast.error(`Gagal menyimpan metadata video ${file.name}`)
          }
        } catch (vidErr) {
          console.error('Video upload error:', vidErr)
          toast.error(`Gagal mengunggah video ${file.name}`)
        }
        done++; setUploadProgress(Math.round((done / total) * 95))
      }

      if (successCount > 0) {
        toast.success(`${successCount} file berhasil diunggah!`)
        setSelectedFolder('semua')
        setActiveTab('library')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem saat mengunggah')
      console.error(err)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Debounced Search Trigger
  useEffect(() => {
    if (!isOpen && !isInline) return
    const timer = setTimeout(() => {
      fetchMedia(true) // Reset pagination when filter changes
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, isInline])

  // Handlers for infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoading && hasMore) {
      fetchMedia(false)
    }
  }

  // Use items directly since they are now filtered on the server side
  const filteredItems = items

  // Bulk actions
  const handleBulkDelete = () => {
    deleteMediaBatch(selectedIds)
    toast.success(`${selectedIds.length} media berhasil dihapus`)
    setConfirmBulkDelete(false)
  }

  const handleBulkDownload = () => {
    selectedIds.forEach((id) => {
      const item = items.find((i) => i.id === id)
      if (item) {
        const link = document.createElement('a')
        link.href = item.url
        link.download = item.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
    toast.success(`Mengunduh ${selectedIds.length} media...`)
  }

  const handleItemClick = (item: MediaItem) => {
    if (onSelect) {
      if (multiple) {
        toggleSelectId(item.id)
      } else {
        onSelect([item])
        clearSelection()
        onClose()
      }
    } else {
      setDetailItem(item)
    }
  }

  const handleSelectConfirm = () => {
    if (!onSelect) return
    const selectedMedia = items.filter((i) => selectedIds.includes(i.id))
    onSelect(selectedMedia)
    clearSelection()
    onClose()
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder(newFolderName.trim())
    setTargetFolderUpload(newFolderName.trim())
    setNewFolderName('')
    setShowCreateFolder(false)
    toast.success('Folder baru dibuat!')
  }

  const mainContent = (
    <div className="space-y-4">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'library'
                ? 'bg-[#2D6A4F] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid size={16} className="inline mr-2" />
            Media Library ({filteredItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-[#2D6A4F] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UploadCloud size={16} className="inline mr-2" />
            Upload Berkas
          </button>

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5"
            title="Buka kamera untuk mengambil foto secara langsung"
          >
            <Camera size={16} className="text-[#2D6A4F]" />
            <span>Foto Kamera Langsung</span>
          </button>
        </div>

        {/* Ctrl+V → Paste Button */}
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold transition-colors cursor-pointer"
          title="Paste gambar atau video dari clipboard"
        >
          <ClipboardCheck size={14} className="text-amber-600 shrink-0" />
          <span>Paste dari Clipboard</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD BARU */}
      {activeTab === 'upload' && (
        <div className="space-y-4 py-2">
          {/* Folder Target Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2">
              <Folder size={18} className="text-[#2D6A4F]" />
              <span className="text-xs font-semibold text-gray-700">Simpan ke Folder:</span>
              <select
                value={targetFolderUpload}
                onChange={(e) => setTargetFolderUpload(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              >
                {folders
                  .filter((f) => f.id !== 'semua')
                  .map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>

            {!showCreateFolder ? (
              <button
                type="button"
                onClick={() => setShowCreateFolder(true)}
                className="text-xs font-semibold text-[#2D6A4F] hover:underline flex items-center gap-1"
              >
                <FolderPlus size={14} /> Buat Folder Baru
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nama folder..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="px-2.5 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <Button size="sm" onClick={handleCreateFolder}>
                  Simpan
                </Button>
                <button onClick={() => setShowCreateFolder(false)}>
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Method Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files?.length) {
                  handleBatchProcessFiles(Array.from(e.dataTransfer.files))
                }
              }}
              className="border-2 border-dashed border-[#2D6A4F]/40 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5 bg-gray-50/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center min-h-[220px]"
            >
              {isUploading ? (
                <div className="space-y-3 w-full">
                  <div className="w-10 h-10 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-gray-800">
                    Mengolah & Mengunggah ({uploadProgress}%)
                  </p>
                  <div className="w-48 max-w-full h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div
                      className="h-full bg-[#2D6A4F] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-14 h-14 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Pilih / Seret Berkas
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Gambar (JPG, PNG, WebP, SVG) atau Video (MP4, MOV, WebM) — Maks. 200 MB
                    </p>
                  </div>
                  <div className="pt-1">
                    <span className="inline-block bg-white border border-gray-200 shadow-sm px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      Buka File Manager
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Option 2: Live Camera Capture */}
            <div
              onClick={() => setIsCameraOpen(true)}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 bg-emerald-50/20 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center min-h-[220px]"
            >
              <div className="space-y-2.5">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <Camera size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">
                    Ambil Foto Langsung (Kamera)
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Gunakan kamera HP / webcam laptop secara langsung
                  </p>
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 bg-[#2D6A4F] text-white shadow-sm px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#1B4332]">
                    <Camera size={13} />
                    <span>Buka Kamera Sekarang</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleBatchProcessFiles(Array.from(e.target.files))
              }
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* TAB 2: MEDIA LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            {/* Folder Selector */}
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name-asc">Nama A–Z</option>
              <option value="name-desc">Nama Z–A</option>
              <option value="size-desc">Ukuran Terbesar</option>
              <option value="size-asc">Ukuran Terkecil</option>
            </select>

            {/* View Mode & Selection toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex border border-gray-200 rounded-xl bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-[#2D6A4F] text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Grid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-[#2D6A4F] text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <List size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  selectedIds.length === filteredItems.length
                    ? clearSelection()
                    : selectAll(filteredItems.map((i) => i.id))
                }
                className="text-xs text-[#2D6A4F] hover:underline font-semibold"
              >
                {selectedIds.length === filteredItems.length ? 'Batal Pilih' : 'Pilih Semua'}
              </button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 px-4 py-2.5 rounded-xl text-xs">
              <span className="font-semibold text-[#1B4332]">
                {selectedIds.length} media terpilih
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkDownload}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Download size={13} /> Download
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Trash2 size={13} /> Hapus ({selectedIds.length})
                </button>
              </div>
            </div>
          )}

          {filteredItems.length === 0 && !isLoading ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <FileImage size={40} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">Tidak ada media yang ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter atau unggah media baru.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[440px] overflow-y-auto pr-1"
              onScroll={handleScroll}
            >
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer aspect-square bg-gray-900 ${
                      isSelected
                        ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.fileName}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay selection checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelectId(item.id)
                      }}
                      className={`absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#2D6A4F] text-white shadow'
                          : 'bg-black/40 text-transparent opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white text-[11px] truncate">
                      <p className="font-semibold truncate">{item.fileName}</p>
                      <p className="text-[10px] text-gray-300">{formatBytes(item.fileSize)}</p>
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="col-span-full py-4 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            /* LIST VIEW */
            <div 
              className="divide-y divide-gray-100 max-h-[440px] overflow-y-auto border border-gray-200 rounded-2xl bg-white"
              onScroll={handleScroll}
            >
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center justify-between p-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#2D6A4F]/10' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectId(item.id)}
                        className="rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
                      />
                      <img
                        src={item.url}
                        alt={item.fileName}
                        className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{item.fileName}</p>
                        <p className="text-[11px] text-gray-400">
                          {formatBytes(item.fileSize)} • {item.folder}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailItem(item)
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="py-4 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Selector Controls */}
      {onSelect && selectedIds.length > 0 && (
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
          <Button variant="outline" onClick={clearSelection}>
            Batal Pilih
          </Button>
          <Button onClick={handleSelectConfirm}>
            Gunakan ({selectedIds.length}) Gambar Terpilih
          </Button>
        </div>
      )}
    </div>
  )

  if (isInline) {
    return (
      <>
        {mainContent}

        {/* Camera Capture Modal */}
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          folderName={targetFolderUpload}
          onCapture={(file) => {
            handleBatchProcessFiles([file])
          }}
        />

        {/* Crop Modal */}
        {cropItemSrc && (
          <ImageCropModal
            isOpen={!!cropItemSrc}
            onClose={() => setCropItemSrc(null)}
            imageSrc={cropItemSrc}
            fileNameInitial={cropItemName}
            onSave={async (processed) => {
              // Convert ProcessedMedia back to File for batch uploader
              const file = new File([processed.blob], processed.fileName, { type: processed.mimeType })
              handleBatchProcessFiles([file])
              setCropItemSrc(null)
            }}
          />
        )}

        {/* Detail Modal */}
        {detailItem && (
          <MediaDetailModal
            isOpen={!!detailItem}
            onClose={() => setDetailItem(null)}
            item={detailItem}
          />
        )}

        {/* Bulk Delete Confirm */}
        <ConfirmModal
          open={confirmBulkDelete}
          onClose={() => setConfirmBulkDelete(false)}
          onConfirm={handleBulkDelete}
          title="Hapus Media Terpilih?"
          message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} media secara permanen?`}
          confirmLabel="Hapus Semua"
        />
      </>
    )
  }

  return (
    <>
      <Modal open={isOpen} onClose={onClose} title="Media Manager" size="xl">
        {mainContent}
      </Modal>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        folderName={targetFolderUpload}
        onCapture={(file) => {
          handleBatchProcessFiles([file])
        }}
      />

      {/* Crop Modal */}
      {cropItemSrc && (
        <ImageCropModal
          isOpen={!!cropItemSrc}
          onClose={() => setCropItemSrc(null)}
          imageSrc={cropItemSrc}
          fileNameInitial={cropItemName}
          onSave={async (processed) => {
            const file = new File([processed.blob], processed.fileName, { type: processed.mimeType })
            handleBatchProcessFiles([file])
            setCropItemSrc(null)
          }}
        />
      )}

      {/* Detail Modal */}
      {detailItem && (
        <MediaDetailModal
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          item={detailItem}
        />
      )}

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Media Terpilih?"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} media secara permanen?`}
        confirmLabel="Hapus Semua"
      />
    </>
  )
}
