import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Camera,
  RotateCcw,
  Check,
  X,
  SwitchCamera,
  AlertCircle,
  Sparkles,
  Upload,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  folderName?: string
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  folderName,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nativeCameraInputRef = useRef<HTMLInputElement>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(false)
  const [flashEffect, setFlashEffect] = useState(false)

  // Stop current video stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  // Start video stream from camera
  const startCamera = useCallback(async () => {
    stopStream()
    setCameraError(null)
    setIsInitializing(true)

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses kamera langsung.')
      }

      // Query available video devices
      try {
        const devList = await navigator.mediaDevices.enumerateDevices()
        const videoDevs = devList.filter((d) => d.kind === 'videoinput')
        setDevices(videoDevs)
      } catch {
        // Enumerate fallback
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(() => {})
      }
    } catch (err: any) {
      console.warn('Camera access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera tidak ditemukan pada perangkat Anda.')
      } else {
        setCameraError(err.message || 'Gagal mengakses kamera.')
      }
    } finally {
      setIsInitializing(false)
    }
  }, [facingMode, selectedDeviceId, stopStream])

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedBlob(null)
      setCapturedPreview(null)
      setCameraError(null)
      startCamera()
    } else {
      stopStream()
    }
    return () => {
      stopStream()
    }
  }, [isOpen, startCamera, stopStream])

  // Capture photo from video stream
  const handleTakePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720

    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Gagal mengambil gambar')
      return
    }

    // Trigger shutter flash effect
    setFlashEffect(true)
    setTimeout(() => setFlashEffect(false), 200)

    ctx.drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Gagal memproses foto')
          return
        }
        setCapturedBlob(blob)
        setCapturedPreview(URL.createObjectURL(blob))
        stopStream()
      },
      'image/jpeg',
      0.92
    )
  }

  // Handle native camera file capture fallback
  const handleNativeCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCapturedBlob(file)
    setCapturedPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  // Retake photo
  const handleRetake = () => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview)
    }
    setCapturedBlob(null)
    setCapturedPreview(null)
    startCamera()
  }

  // Accept and use captured photo
  const handleUsePhoto = () => {
    if (!capturedBlob) return

    const fileName = `foto_kamera_${Date.now()}.jpg`
    const file = new File([capturedBlob], fileName, { type: 'image/jpeg' })

    onCapture(file)
    onClose()
  }

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    setSelectedDeviceId('')
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Ambil Foto Langsung dari Kamera"
      size="lg"
    >
      <div className="space-y-4">
        {/* Hidden canvas for snapshot rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for native device camera fallback */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCameraChange}
        />

        {/* Viewfinder / Preview Area */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-800">
          {/* Shutter flash animation overlay */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150" />
          )}

          {capturedPreview ? (
            /* Snapshot Preview */
            <div className="relative w-full h-full">
              <img
                src={capturedPreview}
                alt="Hasil Foto"
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                <Check size={13} className="text-emerald-400" />
                <span>Foto Siap Digunakan</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Fallback View */
            <div className="text-center px-6 py-8 text-white space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                <AlertCircle size={28} />
              </div>
              <p className="text-sm font-semibold text-gray-200">{cameraError}</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Anda juga dapat menggunakan kamera bawaan HP / perangkat dengan tombol di bawah ini:
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs py-2 px-4 rounded-xl flex items-center gap-2"
                >
                  <Camera size={15} /> Buka Kamera Perangkat
                </Button>
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="border-gray-600 text-gray-300 hover:bg-white/10 text-xs py-2 px-3 rounded-xl"
                >
                  <RotateCcw size={14} className="mr-1" /> Coba Lagi
                </Button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream View */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {isInitializing && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white space-y-2">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-gray-300">Menghubungkan ke kamera...</p>
                </div>
              )}

              {/* Viewfinder Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-white/10" />
                <div className="border-r border-white/10" />
                <div />
              </div>

              {/* Top Controls: Switch Facing Mode / Device */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none"
                  >
                    <option value="">Kamera Default</option>
                    {devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Kamera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-xl border border-white/20 transition-colors shadow-lg"
                  title="Putar Kamera (Depan / Belakang)"
                >
                  <SwitchCamera size={16} />
                </button>
              </div>

              {/* Native camera direct launcher button */}
              <div className="absolute bottom-3 left-3 z-10">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-gray-200 text-xs px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors"
                  title="Gunakan Kamera Bawaan HP"
                >
                  <Upload size={12} />
                  <span>Kamera Bawaan HP</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Target folder indication */}
        {folderName && (
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#2D6A4F]" />
              Foto akan otomatis disimpan ke folder: <strong className="text-gray-800">{folderName}</strong>
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Batal
          </Button>

          {capturedPreview ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="flex items-center gap-1.5 text-xs"
              >
                <RotateCcw size={14} /> Ambil Ulang
              </Button>
              <Button
                type="button"
                onClick={handleUsePhoto}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white flex items-center gap-1.5 text-xs"
              >
                <Check size={14} /> Gunakan & Unggah Foto
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleTakePhoto}
                disabled={!stream || isInitializing || !!cameraError}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm"
              >
                <Camera size={18} />
                <span>Ambil Foto</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
