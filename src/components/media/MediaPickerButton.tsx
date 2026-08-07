import { useState } from 'react'
import { Images, UploadCloud, X, Image as ImageIcon } from 'lucide-react'
import MediaManager from './MediaManager'
import { MediaItem } from '../../stores/mediaStore'

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

  const handleSelectMedia = (selected: MediaItem[]) => {
    if (selected.length > 0) {
      onChange(selected[0].url)
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 group bg-gray-900 h-44 flex items-center justify-center shadow-sm">
          <img src={value} alt="Selected media" className="max-h-full max-w-full object-contain" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow"
            >
              <Images size={14} className="text-[#2D6A4F]" />
              Ganti Gambar
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
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-600 transition-all select-none group"
          >
            <div className="w-10 h-10 bg-gray-100 group-hover:bg-[#2D6A4F] group-hover:text-white text-gray-400 rounded-xl flex items-center justify-center transition-colors">
              <Images size={20} />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-[#2D6A4F] group-hover:underline">
                Pilih dari Media Library
              </span>
              <span className="text-xs text-gray-400 block">atau Unggah / Paste (Ctrl+V)</span>
            </div>
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

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
