import { useState } from 'react'
import {
  Copy,
  Download,
  Trash2,
  ExternalLink,
  Check,
  Tag,
  Folder,
  Calendar,
  HardDrive,
  Maximize2,
  FileImage,
  Info,
} from 'lucide-react'
import Modal, { ConfirmModal } from '../ui/Modal'
import Button from '../ui/Button'
import { MediaItem, useMediaStore } from '../../stores/mediaStore'
import { formatBytes } from '../../lib/mediaUtils'
import toast from 'react-hot-toast'

interface MediaDetailModalProps {
  item: MediaItem | null
  isOpen: boolean
  onClose: () => void
}

export default function MediaDetailModal({ item, isOpen, onClose }: MediaDetailModalProps) {
  const { deleteMedia, renameMedia } = useMediaStore()
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fileName, setFileName] = useState('')
  const [altText, setAltText] = useState('')

  if (!item) return null

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(item.url)
    setCopied(true)
    toast.success('URL berhasil disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = item.url
    link.download = item.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Mengunduh berkas...')
  }

  const handleDelete = () => {
    deleteMedia(item.id)
    toast.success('Media berhasil dihapus')
    setConfirmDelete(false)
    onClose()
  }

  const handleStartEdit = () => {
    setFileName(item.fileName)
    setAltText(item.altText || '')
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!fileName.trim()) return
    renameMedia(item.id, fileName.trim(), altText.trim())
    setIsEditing(false)
    toast.success('Metadata media berhasil diperbarui')
  }

  return (
    <>
      <Modal open={isOpen} onClose={onClose} title="Detail Media" size="lg">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Preview */}
          <div className="flex flex-col items-center justify-center bg-gray-900 rounded-2xl p-4 min-h-[300px] border border-gray-800 relative group">
            <img
              src={item.url}
              alt={item.altText || item.fileName}
              className="max-h-80 max-w-full object-contain rounded-lg shadow-md"
            />
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl transition-all"
              title="Buka gambar penuh"
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Right Column: Metadata Details */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header Info */}
              {isEditing ? (
                <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nama File</label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Alt Text (SEO)</label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Batal
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Simpan
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-base truncate max-w-[200px]" title={item.fileName}>
                      {item.fileName}
                    </h3>
                    <button
                      onClick={handleStartEdit}
                      className="text-xs text-[#2D6A4F] hover:underline font-semibold"
                    >
                      Edit Meta
                    </button>
                  </div>
                  {item.altText && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Tag size={12} /> Alt: {item.altText}
                    </p>
                  )}
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-medium flex items-center gap-1 mb-1">
                    <HardDrive size={13} /> Ukuran
                  </span>
                  <span className="font-bold text-gray-800">{formatBytes(item.fileSize)}</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-medium flex items-center gap-1 mb-1">
                    <FileImage size={13} /> Format
                  </span>
                  <span className="font-bold text-gray-800 uppercase">{item.mimeType.split('/')[1] || 'WebP'}</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-medium flex items-center gap-1 mb-1">
                    <Folder size={13} /> Folder
                  </span>
                  <span className="font-bold text-gray-800">{item.folder}</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-medium flex items-center gap-1 mb-1">
                    <Calendar size={13} /> Upload
                  </span>
                  <span className="font-bold text-gray-800">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Usage Tracking */}
              <div className="bg-[#2D6A4F]/5 border border-[#2D6A4F]/20 p-3 rounded-xl">
                <p className="text-xs font-bold text-[#1B4332] flex items-center gap-1.5 mb-1">
                  <Info size={14} className="text-[#2D6A4F]" /> Dipakai di Modul
                </p>
                <p className="text-xs text-gray-600">
                  Digunakan pada modul <span className="font-semibold text-gray-900">{item.module || item.folder}</span>
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCopyUrl}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Tersalin!' : 'Copy URL'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download size={14} /> Download
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:bg-red-50 hover:border-red-200"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} /> Hapus dari Library
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Hapus Media?"
        message={`Apakah Anda yakin ingin menghapus berkas "${item.fileName}" dari Media Library?`}
        confirmLabel="Hapus Permanen"
      />
    </>
  )
}
