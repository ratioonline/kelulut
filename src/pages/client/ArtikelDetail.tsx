import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Calendar, ArrowLeft, Clock, Share2,
  ChevronUp, BookOpen, ArrowRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Article } from '../../types/database'
import { formatDate, truncate } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────
function readingTime(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200))
}

const FALLBACKS = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1200&q=80',
  'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=1200&q=80',
]

// ── Markdown-like renderer ─────────────────────────────────────
// Converts the plain-text content (with ## headings, - lists, **bold**)
// into readable JSX without needing a markdown library.
function renderContent(raw: string): React.ReactNode[] {
  const lines = raw.split('\n')
  const nodes: React.ReactNode[] = []
  let listBuf: string[] = []
  let key = 0

  const flushList = () => {
    if (listBuf.length === 0) return
    nodes.push(
      <ul key={key++} className="my-5 space-y-2 pl-0">
        {listBuf.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-gray-700 leading-relaxed">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          </li>
        ))}
      </ul>
    )
    listBuf = []
  }

  const inlineFormat = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // internal links like [text](/path)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-[#2D6A4F] font-medium underline underline-offset-2 hover:text-[#1B4332]">$1</a>'
      )

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('### ')) {
      flushList()
      nodes.push(
        <h3 key={key++} className="text-xl font-bold text-[#1B4332] mt-10 mb-3 leading-snug">
          {trimmed.slice(4)}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      nodes.push(
        <h2 key={key++} className="text-2xl md:text-3xl font-bold text-[#1B4332] mt-12 mb-4 leading-snug">
          {trimmed.slice(3)}
        </h2>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      listBuf.push(trimmed.slice(2))
    } else if (/^\d+\.\s/.test(trimmed)) {
      // numbered list item — treat same as bullet
      listBuf.push(trimmed.replace(/^\d+\.\s/, ''))
    } else if (trimmed === '') {
      flushList()
      // empty line = paragraph break (handled by paragraph spacing)
    } else {
      flushList()
      nodes.push(
        <p
          key={key++}
          className="text-gray-700 leading-[1.85] mb-0"
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      )
    }
  }
  flushList()
  return nodes
}

// ── Component ─────────────────────────────────────────────────
export default function ArtikelDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle]     = useState<Article | null>(null)
  const [related, setRelated]     = useState<Article[]>([])
  const [loading, setLoading]     = useState(true)
  const [progress, setProgress]   = useState(0)
  const [showTop, setShowTop]     = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(async ({ data: art }) => {
        setArticle(art)
        setLoading(false)
        if (art) {
          const { data: rel } = await supabase
            .from('articles')
            .select('id, title, slug, excerpt, content, thumbnail_url, created_at')
            .eq('published', true)
            .neq('slug', slug)
            .limit(3)
          setRelated((rel as Article[]) ?? [])
        }
      })
  }, [slug])

  // Reading progress bar + back-to-top
  useEffect(() => {
    const onScroll = () => {
      const el   = contentRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight
      const read  = Math.max(0, -rect.top)
      setProgress(Math.min(100, (read / total) * 100))
      setShowTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link artikel disalin!')
  }

  if (loading) return <LoadingSpinner fullPage />

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20 px-4">
        <BookOpen size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-4">Artikel tidak ditemukan.</p>
        <Link to="/artikel" className="text-[#2D6A4F] hover:underline flex items-center gap-2 text-sm font-medium">
          <ArrowLeft size={15} /> Kembali ke Artikel
        </Link>
      </div>
    )
  }

  const minutes = readingTime(article.content)
  const heroImg = article.thumbnail_url || FALLBACKS[0]

  return (
    <>
      <Helmet>
        <title>{article.title} – Kebun Kelulut Sangatta</title>
        <meta name="description" content={article.excerpt ?? truncate(article.content, 160)} />
        <meta property="og:title"       content={article.title} />
        <meta property="og:description" content={article.excerpt ?? ''} />
        <meta property="og:image"       content={heroImg} />
      </Helmet>

      {/* ── Reading progress bar ── */}
      <div
        className="fixed top-0 left-0 z-50 h-0.5 bg-[#F5A623] transition-all duration-100"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />

      <div className="bg-gray-50 min-h-screen">

        {/* ── Hero image ── */}
        <div className="pt-16 relative h-64 md:h-[420px] overflow-hidden">
          <img
            src={heroImg}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
          {/* Breadcrumb on image */}
          <div className="absolute bottom-6 left-0 right-0 px-4">
            <div className="max-w-3xl mx-auto">
              <Link
                to="/artikel"
                className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft size={14} /> Semua Artikel
              </Link>
            </div>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10 items-start">

            {/* ── Article body ── */}
            <article className="bg-white rounded-b-3xl shadow-sm lg:rounded-3xl lg:-mt-10 relative">
              <div className="px-6 py-8 md:px-12 md:py-12" ref={contentRef}>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(article.created_at)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {minutes} menit baca
                  </span>
                  <button
                    onClick={handleShare}
                    className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-[#2D6A4F] transition-colors"
                    aria-label="Bagikan artikel"
                  >
                    <Share2 size={14} /> Bagikan
                  </button>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  {article.title}
                </h1>

                {/* Excerpt / lead */}
                {article.excerpt && (
                  <p className="text-lg text-gray-600 leading-relaxed mb-8 pb-8 border-b border-gray-100 font-light italic">
                    {article.excerpt}
                  </p>
                )}

                {/* Body content */}
                <div className="space-y-5 text-[17px]">
                  {renderContent(article.content)}
                </div>

                {/* Bottom share */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
                  <Link
                    to="/artikel"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2D6A4F] transition-colors font-medium"
                  >
                    <ArrowLeft size={14} /> Semua Artikel
                  </Link>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors active:scale-95"
                  >
                    <Share2 size={14} /> Bagikan Artikel
                  </button>
                </div>

              </div>
            </article>

            {/* ── Sidebar ── */}
            <aside className="hidden lg:block pt-6 space-y-6 sticky top-24">

              {/* CTA reservasi */}
              <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 text-white text-center">
                <div className="text-3xl mb-2">🐝</div>
                <h3 className="font-bold text-base mb-2 leading-snug">
                  Ingin Melihat Langsung?
                </h3>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  Kunjungi Kebun Kelulut Sangatta dan rasakan pengalaman bersama lebah kelulut secara langsung.
                </p>
                <Link
                  to="/reservasi"
                  className="block w-full bg-[#F5A623] hover:bg-[#e09520] text-white font-bold py-2.5 rounded-xl text-sm transition-colors active:scale-95"
                >
                  Reservasi Sekarang
                </Link>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                    Artikel Terkait
                  </h4>
                  <div className="space-y-4">
                    {related.map((rel, i) => (
                      <Link
                        key={rel.id}
                        to={`/artikel/${rel.slug}`}
                        className="group flex gap-3 items-start"
                      >
                        <img
                          src={rel.thumbnail_url || FALLBACKS[i % FALLBACKS.length]}
                          alt=""
                          className="w-16 h-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-[#2D6A4F] transition-colors">
                            {rel.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {readingTime(rel.content)} menit baca
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/artikel"
                    className="mt-4 flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold hover:gap-2.5 transition-all"
                  >
                    Lihat semua artikel <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              {/* Produk CTA */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-sm font-bold text-amber-800 mb-1">🍯 Produk Madu Kelulut</p>
                <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                  Madu kelulut murni langsung dari kebun kami di Sangatta, Kalimantan Timur.
                </p>
                <Link
                  to="/produk"
                  className="block text-center text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors"
                >
                  Lihat Produk
                </Link>
              </div>

            </aside>
          </div>

          {/* ── Mobile related articles ── */}
          {related.length > 0 && (
            <section className="lg:hidden mt-10 pb-10">
              <h3 className="text-base font-bold text-gray-800 mb-5">Artikel Lainnya</h3>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((rel, i) => (
                  <Link
                    key={rel.id}
                    to={`/artikel/${rel.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={rel.thumbnail_url || FALLBACKS[i % FALLBACKS.length]}
                      alt=""
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-[#2D6A4F] transition-colors">
                        {rel.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{readingTime(rel.content)} menit baca</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Mobile CTA strip ── */}
          <div className="lg:hidden sticky bottom-4 mx-auto max-w-xs mb-6">
            <Link
              to="/reservasi"
              className="block text-center bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-colors"
            >
              🐝 Reservasi Kunjungan
            </Link>
          </div>

        </div>
      </div>

      {/* ── Back to top ── */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-5 z-40 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-[#2D6A4F] hover:shadow-xl transition-all border border-gray-100 lg:bottom-8"
          aria-label="Kembali ke atas"
        >
          <ChevronUp size={18} />
        </button>
      )}
    </>
  )
}
