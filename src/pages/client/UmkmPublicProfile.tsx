import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MapPin, Phone, Globe, Instagram, Facebook, ShoppingBag, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Umkm, Product } from '../../types/database'
import ProductCard from '../../components/ui/ProductCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function UmkmPublicProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [umkm, setUmkm] = useState<Umkm | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('umkms')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }
        const u = data as Umkm
        setUmkm(u)

        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('umkm_id', u.id)
          .eq('is_available', true)
          .order('created_at', { ascending: false })
        setProducts((prods ?? []) as Product[])
        setLoading(false)
      })
  }, [slug])

  if (loading) return <LoadingSpinner fullPage />

  if (!umkm) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-[#FAF3E0]">
        <p className="text-gray-500 mb-4">UMKM tidak ditemukan.</p>
        <Link to="/umkm-directory" className="text-[#2D6A4F] flex items-center gap-1 hover:underline">
          <ArrowLeft size={15} /> Kembali ke Direktori
        </Link>
      </div>
    )
  }

  const waNumber = umkm.whatsapp?.replace(/\D/g, '')
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk dari ${umkm.name}.`)}`
    : null

  return (
    <>
      <Helmet>
        <title>{umkm.name} – Kebun Kelulut Sangatta</title>
        <meta name="description" content={umkm.short_description ?? `Profil UMKM ${umkm.name}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Cover */}
        <div className="h-52 md:h-72 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] relative">
          {umkm.cover_image && (
            <img src={umkm.cover_image} alt="" className="w-full h-full object-cover opacity-50" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            {umkm.logo ? (
              <img src={umkm.logo} alt={umkm.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg -mt-16 md:-mt-20" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg -mt-16 md:-mt-20">
                {umkm.name[0]}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#1B4332]">{umkm.name}</h1>
              {umkm.owner_name && <p className="text-gray-600 text-sm mt-0.5">Pemilik: {umkm.owner_name}</p>}
              {umkm.short_description && (
                <p className="text-gray-700 mt-2">{umkm.short_description}</p>
              )}

              {/* Info badges */}
              <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
                {umkm.city && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                    <MapPin size={14} className="text-[#2D6A4F]" /> {umkm.city}{umkm.province ? `, ${umkm.province}` : ''}
                  </span>
                )}
                {umkm.whatsapp && (
                  <a href={waLink!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors">
                    <Phone size={14} /> WhatsApp
                  </a>
                )}
                {umkm.website && (
                  <a href={umkm.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                    <Globe size={14} /> Website
                  </a>
                )}
                {umkm.instagram && (
                  <a href={`https://instagram.com/${umkm.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-full hover:bg-pink-100 transition-colors">
                    <Instagram size={14} /> {umkm.instagram}
                  </a>
                )}
                {umkm.facebook && (
                  <a href={umkm.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                    <Facebook size={14} /> Facebook
                  </a>
                )}
              </div>
            </div>

            {/* WhatsApp CTA */}
            {waLink && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 md:static md:p-0 md:bg-transparent md:border-0 md:w-auto md:shrink-0">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center md:justify-start gap-2 shadow-lg md:shadow-none"
                >
                  <Phone size={18} /> Hubungi via WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {umkm.description && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
              <h2 className="text-lg font-bold text-[#1B4332] mb-3">Tentang {umkm.name}</h2>
              <div className="prose text-gray-700 text-sm whitespace-pre-line">{umkm.description}</div>
            </div>
          )}

          {/* Products */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={20} className="text-[#2D6A4F]" />
              <h2 className="text-lg font-bold text-[#1B4332]">Produk ({products.length})</h2>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Belum ada produk dari UMKM ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
