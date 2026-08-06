import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { X, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { GalleryItem } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function GaleriPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [filtered, setFiltered] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Semua')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setItems(data)
          setFiltered(data)
        }
        setLoading(false)
      })
  }, [])

  const categories = ['Semua', ...Array.from(new Set(items.map((i) => i.category ?? 'Umum')))]

  useEffect(() => {
    if (category === 'Semua') {
      setFiltered(items)
    } else {
      setFiltered(items.filter((i) => (i.category ?? 'Umum') === category))
    }
  }, [category, items])

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <Helmet>
        <title>Galeri - Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Lihat foto-foto kegiatan dan fasilitas Kebun Kelulut Sangatta."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-[#F5A623] text-sm font-semibold uppercase tracking-widest">
            Foto & Video
          </span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold">Galeri</h1>
          <p className="mt-4 text-gray-200 text-lg">
            Dokumentasi kegiatan, fasilitas, dan momen berharga di Kebun Kelulut Sangatta.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-6 bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-[#FAF3E0] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-20 text-gray-500">Belum ada foto.</p>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer"
                  onClick={() => setLightbox(item)}
                >
                  <img
                    src={item.image_url}
                    alt={item.title ?? 'Galeri'}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                    {item.title && (
                      <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                        {item.title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Tutup"
          >
            <X size={28} />
          </button>
          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.image_url}
              alt={lightbox.title ?? ''}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
            />
            {(lightbox.title || lightbox.description) && (
              <div className="text-center text-white">
                {lightbox.title && <p className="font-semibold text-lg">{lightbox.title}</p>}
                {lightbox.description && (
                  <p className="text-gray-400 text-sm mt-1">{lightbox.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
