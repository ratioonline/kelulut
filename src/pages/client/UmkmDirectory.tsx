import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search, MapPin, ShoppingBag, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Umkm } from '../../types/database'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function UmkmDirectory() {
  const [umkms, setUmkms] = useState<(Umkm & { product_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('umkms')
      .select('*')
      .eq('status', 'active')
      .order('name')
      .then(async ({ data }) => {
        if (data) {
          const enriched = await Promise.all(
            (data as Umkm[]).map(async (u) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('umkm_id', u.id)
                .eq('is_available', true)
              return { ...u, product_count: count ?? 0 }
            })
          )
          setUmkms(enriched)
        }
        setLoading(false)
      })
  }, [])

  const filtered = search
    ? umkms.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.city?.toLowerCase().includes(search.toLowerCase()))
    : umkms

  return (
    <>
      <Helmet>
        <title>Direktori UMKM – Kebun Kelulut Sangatta</title>
        <meta name="description" content="Temukan UMKM madu kelulut terpercaya di wilayah Sangatta dan sekitarnya." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1B4332]">Direktori UMKM</h1>
          <p className="text-gray-600 mt-2">Temukan UMKM madu kelulut terpercaya</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari UMKM berdasarkan nama atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Tidak ada UMKM ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(u => (
              <Link
                key={u.id}
                to={`/umkm/${u.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#2D6A4F]/30 transition-all group"
              >
                {/* Cover */}
                <div className="h-36 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] relative overflow-hidden">
                  {(u.cover_image_url || u.cover_image) && (
                    <img src={u.cover_image_url || u.cover_image} alt="" className="w-full h-full object-cover opacity-60" loading="lazy" />
                  )}
                  {/* Logo overlay */}
                  <div className="absolute -bottom-6 left-4">
                    {(u.logo_url || u.logo) ? (
                      <img src={u.logo_url || u.logo} alt={u.name} className="w-14 h-14 rounded-xl object-cover border-3 border-white shadow-lg" loading="lazy" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center text-xl font-bold text-[#2D6A4F] border-3 border-white">
                        {u.name[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 pt-8">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#2D6A4F] transition-colors">{u.name}</h3>
                  {u.owner_name && <p className="text-xs text-gray-500 mt-0.5">Pemilik: {u.owner_name}</p>}
                  {u.short_description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{u.short_description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    {u.city && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {u.city}</span>
                    )}
                    <span className="flex items-center gap-1"><ShoppingBag size={12} /> {u.product_count} produk</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
