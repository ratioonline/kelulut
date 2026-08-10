import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShoppingCart, Plus, Minus, ArrowLeft, Share2,
  ShieldCheck, Truck, RefreshCw, Star, ChevronRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product, ProductReview, Umkm } from '../../types/database'
import { formatCurrency, formatDate } from '../../lib/utils'
import { useCartStore } from '../../stores/cartStore'
import StarRating from '../../components/ui/StarRating'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const TABS = ['Deskripsi', 'Detail', 'Ulasan'] as const
type Tab = (typeof TABS)[number]

export default function ProdukDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [umkm, setUmkm] = useState<Umkm | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<Tab>('Deskripsi')
  const { addItem, openCart } = useCartStore()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setActiveImg(0)
    setQty(1)

    Promise.all([
      supabase.from('products').select('*').eq('slug', slug).single(),
    ]).then(async ([{ data: prod }]) => {
      if (!prod) { setLoading(false); return }
      setProduct(prod as Product)

      const [{ data: rv }, { data: rel }] = await Promise.all([
        supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', (prod as Product).id)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('category', (prod as Product).category ?? '')
          .eq('is_available', true)
          .neq('id', (prod as Product).id)
          .limit(4),
      ])
      setReviews((rv as ProductReview[]) ?? [])
      setRelated((rel as Product[]) ?? [])

      if ((prod as Product).umkm_id) {
        const { data: uData } = await supabase.from('umkms').select('*').eq('id', (prod as Product).umkm_id).single()
        if (uData) setUmkm(uData as Umkm)
      }

      setLoading(false)
    })
  }, [slug])

  if (loading) return <LoadingSpinner fullPage />
  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-[#FAF3E0]">
        <p className="text-gray-500 mb-4">Produk tidak ditemukan.</p>
        <Link to="/produk" className="text-[#2D6A4F] flex items-center gap-1 hover:underline">
          <ArrowLeft size={15} /> Kembali ke Produk
        </Link>
      </div>
    )
  }

  const images: string[] = [
    ...(product.images?.filter(Boolean) ?? []),
    ...(product.image_url ? [product.image_url] : []),
  ]
  if (images.length === 0) images.push('https://images.unsplash.com/photo-1471943311424-646960669fbc?w=600')

  const hasDiscount = product.discount_price != null
  const finalPrice  = hasDiscount ? product.discount_price! : (product.price ?? 0)
  const discountPct = hasDiscount
    ? Math.round((1 - finalPrice / (product.price ?? 1)) * 100)
    : 0

  const handleAddCart = () => {
    addItem(product, qty)
  }

  const handleBuyNow = () => {
    addItem(product, qty)
    openCart()
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link disalin!')
  }

  return (
    <>
      <Helmet>
        <title>{product.name} – Kebun Kelulut Sangatta</title>
        <meta name="description" content={product.description ?? ''} />
      </Helmet>

      <div className="pt-20 min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-1 text-xs text-gray-500">
            <Link to="/" className="hover:text-[#2D6A4F]">Beranda</Link>
            <ChevronRight size={12} />
            <Link to="/produk" className="hover:text-[#2D6A4F]">Produk</Link>
            <ChevronRight size={12} />
            <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── Main grid ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">

              {/* ── Left: Image Gallery ── */}
              <div className="p-6 border-r border-gray-100">
                {/* Main image */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={images[activeImg]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {hasDiscount && discountPct > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      -{discountPct}%
                    </span>
                  )}
                  <button
                    onClick={handleShare}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow text-gray-600 hover:text-[#2D6A4F] transition-colors"
                    aria-label="Bagikan"
                  >
                    <Share2 size={14} />
                  </button>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                          activeImg === i ? 'border-[#2D6A4F]' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right: Info ── */}
              <div className="p-6 flex flex-col gap-4">
                {/* Category */}
                {product.category && (
                  <span className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider">
                    {product.category}
                  </span>
                )}

                {/* Name */}
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                  {product.name}
                </h1>

                {/* Rating + sold */}
                <div className="flex items-center gap-3">
                  <StarRating value={product.rating ?? 5} count={product.rating_count ?? 0} />
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    {product.sold_count ?? 0} terjual
                  </span>
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#F5A623]">
                      {formatCurrency(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(product.price ?? 0)}
                      </span>
                    )}
                  </div>
                  {hasDiscount && discountPct > 0 && (
                    <span className="text-xs font-semibold text-red-500 mt-0.5 inline-block">
                      Hemat {formatCurrency((product.price ?? 0) - finalPrice)}
                    </span>
                  )}
                </div>

                {/* Stock info */}
                <div className="text-sm">
                  <span className="text-gray-500">Stok: </span>
                  <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? `${product.stock} tersedia` : 'Habis'}
                  </span>
                  {product.weight_gram && (
                    <span className="text-gray-400 ml-3">Berat: {product.weight_gram}g</span>
                  )}
                </div>

                {/* Qty selector */}
                {product.stock > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">Jumlah</span>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-semibold text-gray-900">{qty}</span>
                      <button
                        onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                        className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">Maks. {product.stock}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddCart}
                      disabled={product.stock === 0}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/5 font-semibold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
                    >
                      <ShoppingCart size={17} />
                      Keranjang
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={product.stock === 0}
                      className="flex-1 bg-[#F5A623] hover:bg-[#e09520] text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-40"
                    >
                      Beli Sekarang
                    </button>
                  </div>
                  {umkm?.whatsapp && (
                    <a
                      href={`https://wa.me/${umkm.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk ${product.name} dari ${umkm.name}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      Hubungi via WhatsApp
                    </a>
                  )}
                </div>

                {/* UMKM Info */}
                {umkm && (
                  <div className="mt-2 p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
                    {umkm.logo ? (
                      <img src={umkm.logo} alt={umkm.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-[#2D6A4F] rounded-lg flex items-center justify-center text-white font-bold">
                        {umkm.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{umkm.name}</p>
                      <p className="text-xs text-gray-500 truncate">{umkm.city ?? 'Sangatta'}</p>
                    </div>
                    <Link to={`/umkm/${umkm.slug}`} className="shrink-0 text-xs font-semibold text-[#2D6A4F] hover:underline">
                      Kunjungi Toko
                    </Link>
                  </div>
                )}

                {/* Guarantees */}
                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                  {[
                    { icon: ShieldCheck, label: '100% Original' },
                    { icon: Truck,       label: 'Pengiriman Aman' },
                    { icon: RefreshCw,   label: 'Garansi Produk' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-center">
                      <Icon size={18} className="text-[#2D6A4F]" />
                      <span className="text-[10px] text-gray-500 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs: Deskripsi / Detail / Ulasan ── */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    tab === t
                      ? 'border-[#2D6A4F] text-[#2D6A4F]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t} {t === 'Ulasan' && reviews.length > 0 && `(${reviews.length})`}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'Deskripsi' && (
                <div className="prose max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {product.description ?? 'Tidak ada deskripsi.'}
                </div>
              )}

              {tab === 'Detail' && (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {[
                      ['Kategori',     product.category ?? '-'],
                      ['Berat',        product.weight_gram ? `${product.weight_gram} gram` : '-'],
                      ['Stok',         `${product.stock} unit`],
                      ['Terjual',      `${product.sold_count ?? 0} unit`],
                      ['Kondisi',      'Baru'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2.5 pr-4 text-gray-500 w-36">{k}</td>
                        <td className="py-2.5 font-medium text-gray-800">{v}</td>
                      </tr>
                    ))}
                    {product.details && (
                      <tr>
                        <td className="py-2.5 pr-4 text-gray-500 align-top">Info Lainnya</td>
                        <td className="py-2.5 text-gray-700 whitespace-pre-line">{product.details}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {tab === 'Ulasan' && (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-[#1B4332]">
                        {(product.rating ?? 5).toFixed(1)}
                      </p>
                      <StarRating value={product.rating ?? 5} showValue={false} size={16} />
                      <p className="text-xs text-gray-400 mt-1">{product.rating_count ?? 0} ulasan</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((s) => {
                        const cnt = reviews.filter((r) => r.rating === s).length
                        const pct = reviews.length > 0 ? (cnt / reviews.length) * 100 : 0
                        return (
                          <div key={s} className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-4 text-right">{s}</span>
                            <Star size={10} className="text-[#F5A623] fill-[#F5A623]" />
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#F5A623] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-4">{cnt}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Review list */}
                  {reviews.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">Belum ada ulasan.</p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center">
                            {r.buyer_name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{r.buyer_name}</span>
                          <StarRating value={r.rating} showValue={false} size={11} />
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(r.created_at)}</span>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 ml-9">{r.comment}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Related products ── */}
          {related.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Produk Serupa</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {related.map((p) => {
                  const rThumb =
                    (p.images?.length ? p.images[0] : null) ?? p.image_url ??
                    'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=300'
                  return (
                    <Link
                      key={p.id}
                      to={`/produk/${p.slug}`}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img src={rThumb} alt={p.name} className="w-full aspect-square object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</p>
                        <p className="text-sm font-bold text-[#F5A623] mt-1">
                          {formatCurrency(p.discount_price ?? p.price ?? 0)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
