import { useEffect, useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { X, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { GalleryItem } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const ITEMS_PER_PAGE = 12

export default function GaleriPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<string[]>(['Semua'])
  
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const [category, setCategory] = useState('Semua')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  // Fetch categories
  useEffect(() => {
    supabase
      .from('gallery')
      .select('category')
      .then(({ data }) => {
        if (data) {
          const uniqueCats = Array.from(new Set(data.map(d => d.category).filter(Boolean))) as string[]
          setCategories(['Semua', ...uniqueCats])
        }
      })
  }, [])

  const fetchGallery = useCallback(async (isReset = false) => {
    if (isReset) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }

    const currentPage = isReset ? 0 : page

    let query = supabase
      .from('gallery')
      .select('id, title, description, image_url, category, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (category !== 'Semua') query = query.eq('category', category)

    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    query = query.range(start, end)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching gallery:', error)
    } else if (data) {
      setItems(prev => isReset ? (data as GalleryItem[]) : [...prev, ...(data as GalleryItem[])])
      setHasMore(count ? (start + data.length) < count : false)
      setPage(currentPage + 1)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [category, page])

  useEffect(() => {
    fetchGallery(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Fungsi untuk menambah parameter resize ke URL gambar Supabase Storage
  const getThumbUrl = useCallback((url: string) => {
    if (url.includes('supabase') && url.includes('/storage/')) {
      // Gunakan Supabase Image Transformation untuk thumbnail
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}width=400&quality=75`
    }
    return url
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

      {/* Filter */}
      <section className="pt-24 pb-4 bg-white border-b border-gray-100">
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
          ) : items.length === 0 ? (
            <p className="text-center py-20 text-gray-500">Belum ada foto.</p>
          ) : (
            <>
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer"
                    onClick={() => setLightbox(item)}
                  >
                    <img
                      src={getThumbUrl(item.image_url)}
                      alt={item.title ?? 'Galeri'}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105 bg-gray-200"
                      loading="lazy"
                      decoding="async"
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

              {hasMore && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => fetchGallery(false)}
                    disabled={loadingMore}
                    className="px-8 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-bold rounded-xl shadow transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                  </button>
                </div>
              )}
            </>
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
