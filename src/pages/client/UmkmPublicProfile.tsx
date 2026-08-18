import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  MapPin, Phone, Globe, Instagram, Facebook,
  ShoppingBag, ArrowLeft, MessageCircle, Package,
  ChevronRight, Camera, Grid3X3, Info,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Umkm, Product, GalleryItem } from '../../types/database'
import ProductCard from '../../components/ui/ProductCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

type ActiveTab = 'semua' | 'galeri' | 'tentang'

export default function UmkmPublicProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [umkm, setUmkm] = useState<Umkm | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('semua')
  const [activeCat, setActiveCat] = useState<string>('Semua')
  const [coverLoaded, setCoverLoaded] = useState(false)

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

        const [{ data: prods }, { data: pics }] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('umkm_id', u.id)
            .eq('is_available', true)
            .order('created_at', { ascending: false })
            .limit(48),
          supabase
            .from('gallery')
            .select('*')
            .eq('umkm_id', u.id)
            .order('created_at', { ascending: false })
            .limit(24),
        ])

        setProducts((prods ?? []) as Product[])
        setGallery((pics ?? []) as GalleryItem[])
        setLoading(false)
      })
  }, [slug])

  // Derive unique categories from products
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]
    return ['Semua', ...cats]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (activeCat === 'Semua') return products
    return products.filter(p => p.category === activeCat)
  }, [products, activeCat])

  if (loading) return <LoadingSpinner fullPage />

  if (!umkm) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBag size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-lg font-semibold mb-1">UMKM tidak ditemukan</p>
          <p className="text-gray-400 text-sm mb-6">Mungkin sudah tidak aktif atau link salah.</p>
          <Link to="/umkm-directory" className="inline-flex items-center gap-2 bg-[#2D6A4F] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1B4332] transition-colors">
            <ArrowLeft size={16} /> Kembali ke Direktori
          </Link>
        </div>
      </div>
    )
  }

  const waNumber = umkm.whatsapp?.replace(/\D/g, '')
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk dari ${umkm.name}.`)}`
    : null

  const logoUrl = umkm.logo
  const coverUrl = umkm.cover_image

  const tabs: { id: ActiveTab; label: string; icon: typeof Grid3X3 }[] = [
    { id: 'semua', label: 'Produk', icon: Grid3X3 },
    { id: 'galeri', label: 'Foto', icon: Camera },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ]

  return (
    <>
      <Helmet>
        <title>{umkm.name} – Kebun Kelulut Sangatta</title>
        <meta name="description" content={umkm.short_description ?? `Profil UMKM ${umkm.name}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-100 pt-16">

        {/* ── COVER BANNER ── */}
        <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
          {coverUrl && (
            <img
              src={coverUrl}
              alt=""
              onLoad={() => setCoverLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${coverLoaded ? 'opacity-70' : 'opacity-0'}`}
              loading="lazy"
            />
          )}
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
          }} />
          {/* Back button */}
          <div className="absolute top-4 left-4">
            <Link
              to="/umkm-directory"
              className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/50 transition-colors"
            >
              <ArrowLeft size={13} /> Direktori
            </Link>
          </div>
        </div>

        {/* ── PROFILE CARD ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm -mt-10 relative z-10 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Logo */}
              <div className="-mt-14 sm:-mt-16 shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={umkm.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#40916C] flex items-center justify-center text-3xl sm:text-4xl font-black text-white border-4 border-white shadow-xl select-none">
                    {umkm.name[0]}
                  </div>
                )}
              </div>

              {/* Store Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{umkm.name}</h1>
                    {umkm.owner_name && (
                      <p className="text-sm text-gray-500 mt-0.5">Pemilik: <span className="font-medium text-gray-700">{umkm.owner_name}</span></p>
                    )}
                    {umkm.short_description && (
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{umkm.short_description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm shadow-sm hover:shadow-md active:scale-95"
                        id="umkm-whatsapp-cta"
                      >
                        <MessageCircle size={15} /> Chat
                      </a>
                    )}
                    {umkm.website && (
                      <a
                        href={umkm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 border border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F] text-gray-600 font-medium px-3 py-2.5 rounded-xl transition-all text-sm"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Package size={14} className="text-[#2D6A4F]" />
                    <span className="font-bold text-gray-900">{products.length}</span>
                    <span className="text-gray-500">Produk</span>
                  </div>
                  {gallery.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Camera size={14} className="text-[#2D6A4F]" />
                      <span className="font-bold text-gray-900">{gallery.length}</span>
                      <span className="text-gray-500">Foto</span>
                    </div>
                  )}
                  {umkm.city && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin size={14} className="text-[#2D6A4F]" />
                      <span>{umkm.city}{umkm.province ? `, ${umkm.province}` : ''}</span>
                    </div>
                  )}
                  {/* Social Links */}
                  {umkm.instagram && (
                    <a
                      href={`https://instagram.com/${umkm.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      <Instagram size={13} />
                      <span>{umkm.instagram.startsWith('@') ? umkm.instagram : `@${umkm.instagram}`}</span>
                    </a>
                  )}
                  {umkm.facebook && (
                    <a
                      href={umkm.facebook.startsWith('http') ? umkm.facebook : `https://facebook.com/${umkm.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Facebook size={13} /> Facebook
                    </a>
                  )}
                  {umkm.whatsapp && waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      <Phone size={13} /> {umkm.whatsapp}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── TAB NAVIGATION ── */}
          <div className="bg-white rounded-2xl shadow-sm mt-3 flex items-center border-b border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-[#2D6A4F] border-[#2D6A4F] bg-emerald-50/50'
                    : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'
                }`}
                id={`umkm-tab-${tab.id}`}
              >
                <tab.icon size={15} />
                {tab.label}
                {tab.id === 'semua' && products.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'semua' ? 'bg-[#2D6A4F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {products.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="py-4 pb-24">

            {/* ── PRODUK TAB ── */}
            {activeTab === 'semua' && (
              <div className="space-y-4">
                {/* Category chips */}
                {categories.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                          activeCat === cat
                            ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
                    <ShoppingBag size={44} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">Belum ada produk di kategori ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {filteredProducts.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── GALERI TAB ── */}
            {activeTab === 'galeri' && (
              <div>
                {gallery.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
                    <Camera size={44} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">Belum ada foto dari toko ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {gallery.map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm cursor-pointer"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title ?? ''}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {item.title && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <p className="text-white text-xs font-semibold line-clamp-2">{item.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TENTANG TAB ── */}
            {activeTab === 'tentang' && (
              <div className="space-y-4">
                {/* Description */}
                {umkm.description && (
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Info size={16} className="text-[#2D6A4F]" /> Tentang {umkm.name}
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{umkm.description}</p>
                  </div>
                )}

                {/* Info grid */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Informasi Toko</h2>
                  <div className="space-y-3">
                    {umkm.city && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                          <MapPin size={15} className="text-[#2D6A4F]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Lokasi</p>
                          <p className="text-sm text-gray-800 font-semibold mt-0.5">
                            {[umkm.city, umkm.province].filter(Boolean).join(', ')}
                          </p>
                          {umkm.address && <p className="text-xs text-gray-500 mt-0.5">{umkm.address}</p>}
                        </div>
                      </div>
                    )}
                    {umkm.whatsapp && waLink && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                          <Phone size={15} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">WhatsApp</p>
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 font-semibold mt-0.5 hover:underline block">
                            {umkm.whatsapp}
                          </a>
                        </div>
                      </div>
                    )}
                    {umkm.instagram && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                          <Instagram size={15} className="text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Instagram</p>
                          <a
                            href={`https://instagram.com/${umkm.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pink-600 font-semibold mt-0.5 hover:underline block"
                          >
                            {umkm.instagram.startsWith('@') ? umkm.instagram : `@${umkm.instagram}`}
                          </a>
                        </div>
                      </div>
                    )}
                    {umkm.website && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                          <Globe size={15} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Website</p>
                          <a href={umkm.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-semibold mt-0.5 hover:underline break-all block">
                            {umkm.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {umkm.facebook && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                          <Facebook size={15} className="text-blue-700" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Facebook</p>
                          <a
                            href={umkm.facebook.startsWith('http') ? umkm.facebook : `https://facebook.com/${umkm.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-700 font-semibold mt-0.5 hover:underline block"
                          >
                            {umkm.facebook}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Link ke halaman produk */}
                {products.length > 0 && (
                  <button
                    onClick={() => setActiveTab('semua')}
                    className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between group hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <ShoppingBag size={18} className="text-[#2D6A4F]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">Lihat Semua Produk</p>
                        <p className="text-xs text-gray-500">{products.length} produk tersedia</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#2D6A4F] transition-colors" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── STICKY WA BUTTON (Mobile) ── */}
        {waLink && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40 md:hidden shadow-xl">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg text-sm"
              id="umkm-whatsapp-sticky"
            >
              <MessageCircle size={18} />
              Hubungi via WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  )
}
