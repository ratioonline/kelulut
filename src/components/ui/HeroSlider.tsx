import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { HeroSlide } from '../../types/database'
import { cn } from '../../lib/utils'

const AUTOPLAY_DELAY = 5500 // ms

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    title: 'Temukan Keajaiban\nLebah Kelulut',
    subtitle: 'Nikmati wisata edukasi unik bersama lebah kelulut di Sangatta, Kutai Timur. Belajar, panen madu, dan bawa pulang kenangan tak terlupakan.',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
    badge_text: '🎓 Wisata Edukasi Kelulut',
    cta_primary_label: 'Reservasi Sekarang',
    cta_primary_url: '/reservasi',
    cta_secondary_label: 'Lihat Program',
    cta_secondary_url: '/program',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-2',
    title: 'Panen Madu Kelulut\nLangsung dari Kebun',
    subtitle: 'Saksikan proses panen madu kelulut secara langsung bersama pemandu berpengalaman kami di Sangatta, Kalimantan Timur.',
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1600&q=80',
    badge_text: '🍯 Demo Panen Madu',
    cta_primary_label: 'Reservasi Sekarang',
    cta_primary_url: '/reservasi',
    cta_secondary_label: 'Lihat Produk',
    cta_secondary_url: '/produk',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-3',
    title: 'Edukasi Alam Asri\nuntuk Semua Usia',
    subtitle: 'Program wisata edukasi yang dirancang untuk keluarga, pelajar, dan rombongan. Ramah anak dan penuh wawasan.',
    image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80',
    badge_text: '🐝 Edukasi Ramah Keluarga',
    cta_primary_label: 'Reservasi Sekarang',
    cta_primary_url: '/reservasi',
    cta_secondary_label: 'Lihat Program',
    cta_secondary_url: '/program',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
]

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch slides dari Supabase
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (!error && data && data.length > 0) {
          setSlides(data as HeroSlide[])
        } else {
          setSlides(DEFAULT_SLIDES)
        }
      } catch (err) {
        setSlides(DEFAULT_SLIDES)
      } finally {
        setLoading(false)
      }
    }
    fetchSlides()
  }, [])

  const rawActiveSlides = slides.filter((s) => s.is_active)
  const activeSlides = rawActiveSlides.length > 0 ? rawActiveSlides : DEFAULT_SLIDES

  const goTo = useCallback((idx: number) => {
    if (animating || idx === current) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 700)
  }, [animating, current])

  const next = useCallback(() => {
    goTo((current + 1) % activeSlides.length)
  }, [current, activeSlides.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + activeSlides.length) % activeSlides.length)
  }, [current, activeSlides.length, goTo])

  // Autoplay
  useEffect(() => {
    if (activeSlides.length <= 1) return
    timerRef.current = setTimeout(next, AUTOPLAY_DELAY)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, activeSlides.length, next])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  // Swipe support
  const touchStartX = useRef<number>(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

  if (loading) {
    return (
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#1B4332]"
        aria-label="Memuat slider hero"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/85 via-[#1B4332]/65 to-[#1B4332]/90" />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto w-full flex flex-col items-center animate-pulse">
          <div className="h-8 w-52 bg-white/15 rounded-full mb-6" />
          <div className="h-12 md:h-16 w-3/4 max-w-xl bg-white/15 rounded-2xl mb-3" />
          <div className="h-12 md:h-16 w-1/2 max-w-md bg-white/15 rounded-2xl mb-6" />
          <div className="h-4 w-full max-w-lg bg-white/15 rounded mb-2" />
          <div className="h-4 w-2/3 max-w-md bg-white/15 rounded mb-10" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-14 w-44 bg-white/15 rounded-2xl" />
            <div className="h-14 w-40 bg-white/15 rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  const slide = activeSlides[current] ?? activeSlides[0]
  const hasTitle = Boolean(slide.title && slide.title.trim())
  const hasSubtitle = Boolean(slide.subtitle && slide.subtitle.trim())
  const titleParts = hasTitle ? (slide.title ?? '').split('\n') : []

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero slider"
    >
      {/* ── Background images (all preloaded, only active visible) ── */}
      {activeSlides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-in-out',
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {/* Enhanced photo with lively natural brightness & saturation */}
          <img
            src={s.image_url}
            alt=""
            aria-hidden="true"
            onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
            className={cn(
              'w-full h-full object-cover transition-transform duration-[8000ms] ease-out filter brightness-[1.14] contrast-[1.05] saturate-[1.12]',
              i === current && loaded[i] ? 'scale-110' : 'scale-100'
            )}
          />

          {/* ── Layer 1: Desktop Soft Directional Gradient (Dark green left -> Transparent center -> Soft green right) ── */}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(15, 50, 37, 0.65) 0%, rgba(20, 62, 46, 0.38) 42%, rgba(25, 75, 58, 0.18) 75%, rgba(25, 75, 58, 0.10) 100%)',
            }}
          />

          {/* ── Layer 1 (Mobile): Soft Centered Gradient with high transparency ── */}
          <div
            className="absolute inset-0 md:hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(15, 48, 36, 0.58) 0%, rgba(18, 55, 41, 0.36) 45%, rgba(15, 48, 36, 0.62) 100%)',
            }}
          />

          {/* ── Layer 2: Top & Bottom Soft Vignette for navbar clarity & clean edge ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(10, 32, 24, 0.40) 0%, transparent 22%, transparent 75%, rgba(10, 32, 24, 0.50) 100%)',
            }}
          />

          {/* ── Layer 3: Warm Golden Sunlight Accent for energetic & fresh tourism feel ── */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse at 80% 15%, rgba(245, 166, 35, 0.35) 0%, transparent 60%)',
            }}
          />
        </div>
      ))}

      {/* ── Content ── */}
      <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto w-full pt-16 md:pt-0">

        {/* Badge */}
        {slide.badge_text && (
          <div
            key={`badge-${current}`}
            className={cn(
              "inline-flex items-center gap-2 bg-[#F5A623]/25 hover:bg-[#F5A623]/35 border border-[#F5A623]/60 text-amber-200 text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-md shadow-md shadow-amber-950/20 animate-fade-in-up transition-all duration-300",
              hasTitle || hasSubtitle ? "mb-6" : "mb-10"
            )}
          >
            {slide.badge_text}
          </div>
        )}

        {/* Title */}
        {hasTitle && (
          <h1
            key={`title-${current}`}
            className={cn(
              "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight animate-fade-in-up tracking-tight",
              hasSubtitle ? "mb-6" : "mb-10"
            )}
            style={{
              animationDelay: '80ms',
              textShadow: '0 3px 12px rgba(0, 0, 0, 0.5), 0 8px 30px rgba(0, 0, 0, 0.25)',
            }}
          >
            {titleParts.map((part, i) => (
              <span key={i}>
                {i === 1 ? (
                  <span className="text-[#FBBF24] drop-shadow-[0_2px_10px_rgba(245,166,35,0.4)]">
                    {part}
                  </span>
                ) : (
                  part
                )}
                {i < titleParts.length - 1 && <br />}
              </span>
            ))}
          </h1>
        )}

        {/* Subtitle */}
        {hasSubtitle && (
          <p
            key={`sub-${current}`}
            className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up font-normal"
            style={{
              animationDelay: '160ms',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
            }}
          >
            {slide.subtitle}
          </p>
        )}

        {/* CTA buttons */}
        <div
          key={`cta-${current}`}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
          style={{ animationDelay: '240ms' }}
        >
          {slide.cta_primary_label && slide.cta_primary_url && (
            <Link
              to={slide.cta_primary_url}
              className="group inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#e09520]
                text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-300
                active:scale-95 shadow-xl shadow-amber-950/30 hover:shadow-amber-500/25 hover:-translate-y-0.5"
            >
              <span>{slide.cta_primary_label}</span>
              <ChevronRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
          {slide.cta_secondary_label && slide.cta_secondary_url && (
            <Link
              to={slide.cta_secondary_url}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/80
                hover:border-white text-white font-bold text-base px-8 py-4 rounded-2xl
                transition-all duration-300 active:scale-95 bg-white/10 hover:bg-white/20
                backdrop-blur-md shadow-lg shadow-black/15 hover:-translate-y-0.5"
            >
              {slide.cta_secondary_label}
            </Link>
          )}
        </div>

        {/* Location badge */}
        <div
          className="inline-flex items-center justify-center gap-2 mt-10 text-white/90 text-sm font-medium animate-fade-in-up bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10"
          style={{
            animationDelay: '320ms',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
          }}
        >
          <MapPin size={15} className="text-[#FBBF24]" />
          <span>Sangatta Utara, Kutai Timur, Kalimantan Timur</span>
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-md
              flex items-center justify-center text-white transition-all duration-300 border border-white/30 hover:border-white/60
              hover:scale-110 active:scale-95 shadow-lg shadow-black/25"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-md
              flex items-center justify-center text-white transition-all duration-300 border border-white/30 hover:border-white/60
              hover:scale-110 active:scale-95 shadow-lg shadow-black/25"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-7 h-2.5 bg-[#F5A623] shadow-sm shadow-amber-500/50'
                  : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/15 backdrop-blur-xs">
          <div
            key={current}
            className="h-full bg-[#F5A623] shadow-[0_0_10px_rgba(245,166,35,0.8)]"
            style={{
              animation: `progress-bar ${AUTOPLAY_DELAY}ms linear`,
            }}
          />
        </div>
      )}

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-white/70 animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
        <ChevronDown size={28} />
      </div>

      {/* ── Slide counter ── */}
      {activeSlides.length > 1 && (
        <div className="absolute top-24 right-6 z-30 text-white/80 text-xs font-mono bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
          {String(current + 1).padStart(2, '0')} / {String(activeSlides.length).padStart(2, '0')}
        </div>
      )}
    </section>
  )
}

