import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Calendar, ArrowRight, BookOpen, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Article } from '../../types/database'
import { formatDate, truncate } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

// Thumbnail fallbacks per artikel (cycling)
const FALLBACKS = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70',
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=70',
  'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800&q=70',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=70',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=70',
]

function thumb(article: Article, idx: number) {
  return article.thumbnail_url || FALLBACKS[idx % FALLBACKS.length]
}

// ── Reading time estimate ─────────────────────────────────────
function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

// ── Category badge derived from title keywords ────────────────
const CATS: { label: string; keywords: string[] }[] = [
  { label: 'Budidaya', keywords: ['budidaya', 'meliponikultur', 'stup', 'koloni', 'hama'] },
  { label: 'Madu', keywords: ['madu', 'panen', 'kualitas', 'simpan', 'kemasan'] },
  { label: 'Bisnis', keywords: ['bisnis', 'wisata', 'memasarkan', 'pemasaran', 'izin'] },
  { label: 'Konservasi', keywords: ['konservasi', 'ekosistem', 'hutan', 'penyerbuk'] },
]

function getCategory(article: Article) {
  const text = (article.title + ' ' + (article.excerpt ?? '')).toLowerCase()
  for (const cat of CATS) {
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.label
  }
  return 'Edukasi'
}

const CAT_COLORS: Record<string, string> = {
  Budidaya:   'bg-emerald-100 text-emerald-700',
  Madu:       'bg-amber-100 text-amber-700',
  Bisnis:     'bg-blue-100 text-blue-700',
  Konservasi: 'bg-teal-100 text-teal-700',
  Edukasi:    'bg-purple-100 text-purple-700',
}

export default function ArtikelPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [activecat, setActivecat] = useState('Semua')

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() => {
    const set = new Set(articles.map(getCategory))
    return ['Semua', ...Array.from(set)]
  }, [articles])

  const filtered = useMemo(() => {
    let r = articles
    if (activecat !== 'Semua') r = r.filter((a) => getCategory(a) === activecat)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt ?? '').toLowerCase().includes(q)
      )
    }
    return r
  }, [articles, activecat, search])

  const featured = filtered[0]
  const rest      = filtered.slice(1)

  return (
    <>
      <Helmet>
        <title>Artikel Edukasi – Kebun Kelulut Sangatta</title>
        <meta
          name="description"
          content="Baca artikel edukasi seputar lebah kelulut, budidaya, madu, dan manfaatnya bagi kesehatan dan lingkungan."
        />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332]">
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-[#F5A623]/10 rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-[#F5A623]/20 text-[#F5A623] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <BookOpen size={12} /> Blog & Edukasi
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Artikel Edukasi
          </h1>
          <p className="mt-4 text-gray-300 text-lg max-w-xl mx-auto">
            Pelajari lebih dalam tentang lebah kelulut, budidaya, madu, dan
            perannya bagi ekosistem hutan Kalimantan.
          </p>

          {/* Search */}
          <div className="relative mt-8 max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari artikel…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white text-gray-800 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
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
        </div>
      </section>

      {/* ── Category pills ── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActivecat(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activecat === cat
                  ? 'bg-[#2D6A4F] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <section className="py-14 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <BookOpen size={52} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">Tidak ada artikel yang sesuai.</p>
              {(search || activecat !== 'Semua') && (
                <button
                  onClick={() => { setSearch(''); setActivecat('Semua') }}
                  className="mt-3 text-sm text-[#2D6A4F] underline"
                >
                  Hapus filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Featured (first article) ── */}
              {featured && (
                <Link
                  to={`/artikel/${featured.slug}`}
                  className="group block mb-14 rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="md:grid md:grid-cols-2">
                    {/* image */}
                    <div className="relative overflow-hidden aspect-video md:aspect-auto md:h-full min-h-[220px]">
                      <img
                        src={thumb(featured, 0)}
                        alt={featured.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full bg-[#F5A623] text-white shadow">
                        Artikel Pilihan
                      </span>
                    </div>

                    {/* content */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLORS[getCategory(featured)]}`}>
                          {getCategory(featured)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={12} />
                          {formatDate(featured.created_at)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {readingTime(featured.content)} menit baca
                        </span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4 group-hover:text-[#2D6A4F] transition-colors">
                        {featured.title}
                      </h2>

                      <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
                        {featured.excerpt || truncate(featured.content, 200)}
                      </p>

                      <span className="inline-flex items-center gap-2 text-[#2D6A4F] font-semibold text-sm group-hover:gap-3 transition-all">
                        Baca Selengkapnya <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* ── Result count ── */}
              {rest.length > 0 && (
                <p className="text-xs text-gray-400 mb-6">
                  Menampilkan {filtered.length} artikel
                  {activecat !== 'Semua' ? ` · ${activecat}` : ''}
                  {search ? ` · "${search}"` : ''}
                </p>
              )}

              {/* ── Grid ── */}
              {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {rest.map((article, idx) => (
                    <Link
                      key={article.id}
                      to={`/artikel/${article.slug}`}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden aspect-video">
                        <img
                          src={thumb(article, idx + 1)}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[getCategory(article)]}`}>
                          {getCategory(article)}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDate(article.created_at)}
                          </span>
                          <span>{readingTime(article.content)} menit baca</span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2 flex-1 group-hover:text-[#2D6A4F] transition-colors">
                          {article.title}
                        </h3>

                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                          {article.excerpt || truncate(article.content, 110)}
                        </p>

                        <span className="inline-flex items-center gap-1.5 text-[#2D6A4F] text-sm font-semibold mt-auto group-hover:gap-2.5 transition-all">
                          Baca <ArrowRight size={13} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
