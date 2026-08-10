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
} from 'lucide-react'
import Modal, { ConfirmModal } from '../ui/Modal'
import Button from '../ui/Button'
import { useMediaStore, MediaItem } from '../../stores/mediaStore'
import { useAuthStore } from '../../stores/authStore'
import { processImageFile, formatBytes, ProcessedMedia } from '../../lib/mediaUtils'
import ImageCropModal from './ImageCropModal'
import MediaDetailModal from './MediaDetailModal'
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
    addMediaBatch,
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

  // Detail Modal state
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scan app images on mount
  useEffect(() => {
    if (isOpen || isInline) {
      scanExistingAppImages()
      setTargetFolderUpload(defaultFolder === 'semua' ? 'Lainnya' : defaultFolder)
    }
  }, [isOpen, isInline, defaultFolder])

  // Handle Clipboard Paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen && !isInline) return

    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items
      if (!clipboardItems) return

      const filesToProcess: File[] = []
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i]
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile()
          if (blob) {
            const pasteFile = new File([blob], `paste_${Date.now()}.png`, { type: blob.type })
            filesToProcess.push(pasteFile)
          }
        }
      }

      if (filesToProcess.length > 0) {
        toast.success(`Ditemukan ${filesToProcess.length} gambar dari Clipboard!`)
        handleBatchProcessFiles(filesToProcess)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen, isInline, targetFolderUpload, moduleName])

  // Batch Process Upload
  const handleBatchProcessFiles = async (files: File[]) => {
    const validFiles: File[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.includes('svg')) {
        toast.error(`File ${file.name} bukan format gambar yang valid.`)
        continue
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi batas 20 MB.`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const folderToSave = targetFolderUpload === 'semua' ? 'Lainnya' : targetFolderUpload
      const processedResults: Array<Omit<MediaItem, 'id' | 'createdAt'>> = []

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const processed: ProcessedMedia = await processImageFile(file, file.name, {
          maxDimension: 1920,
          quality: 0.85,
        })

        processedResults.push({
          fileName: processed.fileName,
          url: processed.base64,
          fileSize: processed.fileSize,
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          checksum: processed.checksum,
          folder: folderToSave,
          module: moduleName,
          altText: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
          umkm_id: role === 'umkm_user' ? (myUmkm?.id || undefined) : undefined,
        })

        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100))
      }

      const added = addMediaBatch(processedResults)
      toast.success(`${added.length} media berhasil diunggah!`)
      setSelectedFolder('semua')
      setActiveTab('library')
    } catch (err) {
      toast.error('Gagal mengunggah berkas gambar')
      console.error(err)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...items]

    // Role-based UMKM isolation
    if (role === 'umkm_user') {
      const umkmId = myUmkm?.id
      result = result.filter(i => !i.umkm_id || i.umkm_id === umkmId)
    }

    // Folder filter
    if (selectedFolder !== 'semua') {
      result = result.filter((i) => i.folder === selectedFolder)
    }

    // Module filter
    if (selectedModule !== 'semua') {
      result = result.filter((i) => i.module === selectedModule)
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.fileName.toLowerCase().includes(q) ||
          (i.altText && i.altText.toLowerCase().includes(q))
      )
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'name-asc':
        result.sort((a, b) => a.fileName.localeCompare(b.fileName))
        break
      case 'name-desc':
        result.sort((a, b) => b.fileName.localeCompare(a.fileName))
        break
      case 'size-desc':
        result.sort((a, b) => b.fileSize - a.fileSize)
        break
      case 'size-asc':
        result.sort((a, b) => a.fileSize - b.fileSize)
        break
      default: // newest
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [items, selectedFolder, selectedModule, searchQuery, sortBy, role, myUmkm])

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
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
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
            Upload Baru
          </button>
        </div>

        {/* Ctrl+V Hint */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <ClipboardCheck size={14} className="text-amber-600 shrink-0" />
          <span>Dukungan <strong>Ctrl+V</strong> dari Clipboard</span>
        </div>
      </div>

      {/* TAB 1: UPLOAD BARU */}
      {activeTab === 'upload' && (
        <div className="space-y-4 py-2">
          {/* Folder Target Selection */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
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
                <FolderPlus size={14} /> Buat Folder
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

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files?.length) {
                handleBatchProcessFiles(Array.from(e.dataTransfer.files))
              }
            }}
            className="border-2 border-dashed border-[#2D6A4F]/40 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5 bg-gray-50/50 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 select-none"
          >
            {isUploading ? (
              <div className="space-y-3">
                <div className="w-12 h-12 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-gray-800">
                  Mengolah & Mengompres Gambar ({uploadProgress}%)
                </p>
                <div className="w-64 max-w-full h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-[#2D6A4F] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-[#2D6A4F]/10 text-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800">
                    Klik atau Seret Gambar ke Sini
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mendukung Multiple Upload, Paste Clipboard (Ctrl+V), JPG, PNG, WebP, SVG, AVIF — Maks. 20 MB
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-block bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Pilih Berkas dari Perangkat
                  </span>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
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

          {/* Media Items Container */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <FileImage size={40} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">Tidak ada media yang ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter atau unggah media baru.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[440px] overflow-y-auto pr-1">
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
            </div>
          ) : (
            /* LIST VIEW */
            <div className="divide-y divide-gray-100 max-h-[440px] overflow-y-auto border border-gray-200 rounded-2xl bg-white">
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

        {/* Crop Modal */}
        {cropItemSrc && (
          <ImageCropModal
            isOpen={!!cropItemSrc}
            onClose={() => setCropItemSrc(null)}
            imageSrc={cropItemSrc}
            fileNameInitial={cropItemName}
            onSave={(processed) => {
              addMediaBatch([
                {
                  fileName: processed.fileName,
                  url: processed.base64,
                  fileSize: processed.fileSize,
                  mimeType: processed.mimeType,
                  width: processed.width,
                  height: processed.height,
                  checksum: processed.checksum,
                  folder: targetFolderUpload,
                  module: moduleName,
                },
              ])
              setActiveTab('library')
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

      {/* Crop Modal */}
      {cropItemSrc && (
        <ImageCropModal
          isOpen={!!cropItemSrc}
          onClose={() => setCropItemSrc(null)}
          imageSrc={cropItemSrc}
          fileNameInitial={cropItemName}
          onSave={(processed) => {
            addMediaBatch([
              {
                fileName: processed.fileName,
                url: processed.base64,
                fileSize: processed.fileSize,
                mimeType: processed.mimeType,
                width: processed.width,
                height: processed.height,
                checksum: processed.checksum,
                folder: targetFolderUpload,
                module: moduleName,
              },
            ])
            setActiveTab('library')
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
