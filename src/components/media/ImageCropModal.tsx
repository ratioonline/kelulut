import { useState, useRef, useEffect } from 'react'
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Crop as CropIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { processImageFile, CropArea, ProcessedMedia } from '../../lib/mediaUtils'
import toast from 'react-hot-toast'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | File
  fileNameInitial?: string
  onSave: (processed: ProcessedMedia) => void
}

const ASPECT_RATIOS = [
  { label: 'Original', ratio: 0 },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
]

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  fileNameInitial = 'image',
  onSave,
}: ImageCropModalProps) {
  const [rotate, setRotate] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(0)
  const [fileName, setFileName] = useState(fileNameInitial)
  const [isProcessing, setIsProcessing] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setRotate(0)
      setFlipH(false)
      setFlipV(false)
      setAspectRatio(0)
      setFileName(fileNameInitial)
      setImgLoaded(false)
    }
  }, [isOpen, fileNameInitial])

  const handleRotate = () => {
    setRotate((prev) => (prev + 90) % 360)
  }

  const handleSave = async () => {
    setIsProcessing(true)
    try {
      const processed = await processImageFile(imageSrc, fileName, {
        rotate,
        flipH,
        flipV,
        aspectRatio,
        maxDimension: 1920,
        quality: 0.85,
      })
      onSave(processed)
      toast.success('Gambar berhasil diproses!')
      onClose()
    } catch (err) {
      toast.error('Gagal mengedit gambar')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit & Crop Gambar"
      size="lg"
    >
      <div className="space-y-5 select-none">
        {/* Preview Container */}
        <div className="relative w-full h-80 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-800">
          <img
            ref={imgRef}
            src={typeof imageSrc === 'string' ? imageSrc : URL.createObjectURL(imageSrc)}
            alt="Preview Crop"
            onLoad={() => setImgLoaded(true)}
            className="max-h-full max-w-full object-contain transition-all duration-200"
            style={{
              transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            }}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-sm">
              Memuat gambar...
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-200">
          {/* Filename Input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1">
              Nama File
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Masukkan nama file..."
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          {/* Aspect Ratios */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              Rasio Aspek (Crop)
            </label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAspectRatio(item.ratio)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    aspectRatio === item.ratio
                      ? 'bg-[#2D6A4F] text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transformation Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200">
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCw size={14} /> Rotasi 90°
            </button>

            <button
              type="button"
              onClick={() => setFlipH(!flipH)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                flipH
                  ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] text-[#2D6A4F]'
                  : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FlipHorizontal size={14} /> Flip H
            </button>

            <button
              type="button"
              onClick={() => setFlipV(!flipV)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                flipV
                  ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] text-[#2D6A4F]'
                  : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FlipVertical size={14} /> Flip V
            </button>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? 'Mengolah...' : 'Terapkan & Simpan'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
