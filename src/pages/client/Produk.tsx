import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types/database'
import ProductCard from '../../components/ui/ProductCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const SORT_OPTIONS = [
  { value: 'terbaru',    label: 'Terbaru' },
  { value: 'terlaris',   label: 'Terlaris' },
  { value: 'harga-asc',  label: 'Harga Terendah' },
  { value: 'harga-desc', label: 'Harga Tertinggi' },
  { value: 'rating',     label: 'Rating Tertinggi' },
]

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [sort, setSort] = useState('terbaru')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .then(({ data }) => {
        if (data) setProducts(data)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(products.map((p) => p.category ?? 'Lainnya')))],
    [products]
  )

  const filtered = useMemo(() => {
    let r = [...products]

    if (category !== 'Semua') r = r.filter((p) => (p.category ?? 'Lainnya') === category)

    if (search) {
      const q = search.toLowerCase()
      r = r.filter((p) => p.name.toLowerCase().includes(q))
    }

    const min = priceMin ? parseInt(priceMin) : null
    const max = priceMax ? parseInt(priceMax) : null
    if (min !== null) r = r.filter((p) => (p.discount_price ?? p.price ?? 0) >= min)
    if (max !== null) r = r.filter((p) => (p.discount_price ?? p.price ?? 0) <= max)

    switch (sort) {
      case 'terlaris':   r.sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0)); break
      case 'harga-asc':  r.sort((a, b) => (a.discount_price ?? a.price ?? 0) - (b.discount_price ?? b.price ?? 0)); break
      case 'harga-desc': r.sort((a, b) => (b.discount_price ?? b.price ?? 0) - (a.discount_price ?? a.price ?? 0)); break
      case 'rating':     r.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break
      default:           r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return r
  }, [products, category, search, sort, priceMin, priceMax])

  const clearFilters = () => {
    setCategory('Semua')
    setSearch('')
    setPriceMin('')
    setPriceMax('')
    setSort('terbaru')
  }

  const hasFilter = category !== 'Semua' || search || priceMin || priceMax

  const Sidebar = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Kategori</h3>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => { setCategory(cat); setSidebarOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  category === cat
                    ? 'bg-[#2D6A4F] text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Rentang Harga</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            placeholder="Maks"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>
      </div>

      {/* Clear */}
      {hasFilter && (
        <button
          onClick={clearFilters}
          className="w-full text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 font-medium"
        >
          <X size={14} /> Hapus Semua Filter
        </button>
      )}
    </div>
  )

  return (
    <>
      <Helmet>
        <title>Produk Madu Kelulut – Kebun Kelulut Sangatta</title>
        <meta name="description" content="Beli madu kelulut murni berkualitas tinggi dari kebun kami." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Search & Mobile Filter Button */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>

        <div className="flex gap-6">

          {/* ── Sidebar (desktop) ── */}
          <aside className="hidden lg:block w-52 shrink-0">{Sidebar}</aside>

          {/* ── Mobile sidebar overlay ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <div className="relative z-10 bg-white w-72 p-5 overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900">Filter</h3>
                  <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                </div>
                {Sidebar}
              </div>
            </div>
          )}

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                <SlidersHorizontal size={15} />
                Filter
                {hasFilter && (
                  <span className="w-2 h-2 bg-[#F5A623] rounded-full" />
                )}
              </button>

              {/* Category pills (tablet/desktop) */}
              <div className="hidden sm:flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="ml-auto relative">
                <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer">
                  <span className="text-gray-500 hidden sm:inline">Urutkan:</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent text-gray-700 font-medium focus:outline-none pr-5 appearance-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="text-gray-400 absolute right-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Result count */}
            <p className="text-xs text-gray-400 mb-4">
              {loading ? 'Memuat...' : `${filtered.length} produk ditemukan`}
            </p>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">🍯</p>
                <p className="font-medium">Tidak ada produk yang sesuai</p>
                <button onClick={clearFilters} className="mt-3 text-sm text-[#2D6A4F] underline">
                  Hapus filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
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
