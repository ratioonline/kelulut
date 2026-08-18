import { Images } from 'lucide-react'
import MediaManager from '../../components/media/MediaManager'

export default function AdminMedia() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Images size={24} className="text-[#2D6A4F]" />
            Media Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola seluruh aset gambar, dokumen, dan media di seluruh sistem Kebun Kelulut Sangatta.
          </p>
        </div>
      </div>

      {/* Embedded Media Manager */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 min-h-[500px]">
        <MediaManager
          isInline={true}
          defaultFolder="semua"
          moduleName="Media Library"
        />
      </div>
    </div>
  )
}
