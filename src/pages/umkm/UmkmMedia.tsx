import MediaManager from '../../components/media/MediaManager'
import { useState } from 'react'
import { Image } from 'lucide-react'

export default function UmkmMedia() {
  const [managerOpen, setManagerOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola gambar dan media UMKM Anda.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <button
          onClick={() => setManagerOpen(true)}
          className="w-full py-16 border-2 border-dashed border-gray-300 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-600 transition-all"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Image size={24} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-[#2D6A4F]">Buka Media Manager</p>
            <p className="text-xs text-gray-400 mt-1">Upload, kelola, dan pilih gambar untuk produk dan profil UMKM</p>
          </div>
        </button>
      </div>

      <MediaManager
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        onSelect={() => setManagerOpen(false)}
        multiple={false}
        defaultFolder="Produk"
        moduleName="UMKM"
      />
    </div>
  )
}
