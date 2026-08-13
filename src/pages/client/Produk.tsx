import { useEffect, useState, useRef, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Flame,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types/database'
import ProductCard from '../../components/ui/ProductCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlaris', label: 'Terlaris' },
  { value: 'harga-asc', label: 'Harga Terendah' },
  { value: 'harga-desc', label: 'Harga Tertinggi' },
  { value: 'rating', label: 'Rating Tertinggi' },
]

const ITEMS_PER_PAGE = 8

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(['Semua'])
  
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  const [category, setCategory] = useState('Semua')
  const [sort, setSort] = useState('terbaru')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)

  // Fetch unique categories (only fetch category column)
  useEffect(() => {
    supabase
      .from('products')
      .select('category')
      .eq('is_available', true)
      .then(({ data }) => {
        if (data) {
          const uniqueCats = Array.from(new Set(data.map(d => d.category).filter(Boolean))) as string[]
          setCategories(['Semua', ...uniqueCats])
        }
      })
  }, [])

  // Fetch Top Products
  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, slug, price, discount_price, stock, sold_count, rating, rating_count, images, image_url, category, is_available, created_at')
      .eq('is_available', true)
      .order('sold_count', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setTopProducts(data as Product[])
      })
  }, [])

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchProducts = useCallback(async (isReset = false) => {
    if (isReset) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }

    const currentPage = isReset ? 0 : page

    let query = supabase
      .from('products')
      .select('id, name, slug, price, discount_price, stock, sold_count, rating, rating_count, images, image_url, category, is_available, created_at', { count: 'exact' })
      .eq('is_available', true)

    if (category !== 'Semua') query = query.eq('category', category)
    if (debouncedSearch) query = query.ilike('name', `%${debouncedSearch}%`)
    if (priceMin) query = query.gte('price', parseInt(priceMin))
    if (priceMax) query = query.lte('price', parseInt(priceMax))

    // Sorting
    switch (sort) {
      case 'terlaris':
        query = query.order('sold_count', { ascending: false })
        break
      case 'harga-asc':
        query = query.order('price', { ascending: true }) // Note: Supabase cannot easily sort by calculated (discount_price ?? price) without RPC, we sort by price as fallback
        break
      case 'harga-desc':
        query = query.order('price', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE - 1
    query = query.range(start, end)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
    } else if (data) {
      setProducts(prev => isReset ? (data as Product[]) : [...prev, ...(data as Product[])])
      setHasMore(count ? (start + data.length) < count : false)
      setPage(currentPage + 1)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [category, debouncedSearch, priceMin, priceMax, sort, page])

  // Refetch when filters change
  useEffect(() => {
    fetchProducts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedSearch, priceMin, priceMax, sort])

  const clearFilters = () => {
    setCategory('Semua')
    setSearch('')
    setDebouncedSearch('')
    setPriceMin('')
    setPriceMax('')
    setSort('terbaru')
  }

  const hasFilter = category !== 'Semua' || search || priceMin || priceMax

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const Sidebar = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Kategori</h3>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => {
                  setCategory(cat)
                  setSidebarOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  category === cat
                    ? 'bg-[#EE4D2D] text-white font-semibold shadow-xs'
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
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]"
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            placeholder="Maks"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EE4D2D]"
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
        <meta
          name="description"
          content="Beli madu kelulut murni berkualitas tinggi dari kebun kami."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 space-y-8">
        {/* Search Bar & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk madu kelulut, olahan, dll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EE4D2D] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>

        {/* ── SECTION 1: PRODUK TERLARIS (SHOPEE STYLE CAROUSEL) ── */}
        {!search && topProducts.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-[#EE4D2D]" />
                <h2 className="text-base sm:text-lg font-extrabold uppercase text-[#EE4D2D] tracking-wide">
                  PRODUK TERLARIS
                </h2>
              </div>

              <button
                onClick={() => setSort('terlaris')}
                className="text-xs sm:text-sm font-semibold text-[#EE4D2D] hover:underline flex items-center gap-0.5"
              >
                Lihat Semua <ChevronRight size={16} />
              </button>
            </div>

            <div className="relative group">
              {/* Left Arrow */}
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Carousel Container */}
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
              >
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="w-44 sm:w-48 shrink-0">
                    <ProductCard
                      product={p}
                      isTop={idx < 5}
                      salesRibbon={
                        (p.sold_count ?? 0) > 0
                          ? `Penjualan / Bulan ${p.sold_count > 100 ? `${p.sold_count}+` : p.sold_count}`
                          : 'Terlaris'
                      }
                      showBadge={false}
                    />
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </section>
        )}

        {/* ── SECTION 2: REKOMENDASI (MAIN GRID & FILTERS) ── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-6">
          {/* Header Tab */}
          <div className="border-b border-gray-200">
            <div className="flex items-center gap-6">
              <button className="pb-3 text-base font-extrabold text-[#EE4D2D] border-b-2 border-[#EE4D2D] flex items-center gap-2">
                <Sparkles size={18} />
                REKOMENDASI
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* ── Sidebar (desktop) ── */}
            <aside className="hidden lg:block w-52 shrink-0">{Sidebar}</aside>

            {/* ── Mobile sidebar overlay ── */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="relative z-10 bg-white w-72 p-5 overflow-y-auto shadow-xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Filter Produk</h3>
                    <button onClick={() => setSidebarOpen(false)}>
                      <X size={20} />
                    </button>
                  </div>
                  {Sidebar}
                </div>
              </div>
            )}

            {/* ── Main Product Grid Content ── */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Category Pills & Sort Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-gray-50 p-3 rounded-xl border border-gray-100">
                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        category === cat
                          ? 'bg-[#EE4D2D] text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="ml-auto relative shrink-0">
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white cursor-pointer shadow-2xs">
                    <span className="text-gray-500 hidden sm:inline">Urutkan:</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="bg-transparent text-gray-800 font-bold focus:outline-none pr-5 appearance-none cursor-pointer"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="text-gray-400 absolute right-3 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Result counter */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {loading ? 'Memuat produk...' : `${products.length} produk ditampilkan`}
                </span>
                {hasFilter && (
                  <button
                    onClick={clearFilters}
                    className="text-[#EE4D2D] hover:underline font-semibold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="flex justify-center py-24">
                  <LoadingSpinner size="lg" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-5xl mb-3">🍯</p>
                  <p className="font-bold text-gray-700">Tidak ada produk yang sesuai</p>
                  <p className="text-xs text-gray-400 mt-1">Coba kata kunci pencarian atau filter lain.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-xs font-bold text-white bg-[#EE4D2D] hover:bg-[#d03d1e] px-4 py-2 rounded-xl shadow transition-colors"
                  >
                    Hapus Filter
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((p, idx) => (
                      <ProductCard key={p.id} product={p} isTop={idx < 2 && category === 'Semua' && sort === 'terbaru'} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => fetchProducts(false)}
                        disabled={loadingMore}
                        className="px-8 py-2.5 bg-[#EE4D2D] hover:bg-[#d03d1e] text-white text-sm font-bold rounded-xl shadow transition-colors active:scale-95 disabled:opacity-50"
                      >
                        {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
