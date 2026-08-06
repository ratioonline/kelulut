import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { HeroSlide } from '../../types/database'
import { cn } from '../../lib/utils'

// Fallback slides jika DB kosong
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    title: 'Temukan Keajaiban\nLebah Kelulut',
    subtitle: 'Nikmati wisata edukasi unik bersama lebah kelulut di Sangatta, Kutai Timur. Belajar, panen madu, dan bawa pulang kenangan tak terlupakan.',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
    badge_text: '🐝 Wisata Edukasi Kelulut',
    cta_primary_label: 'Reservasi Sekarang',
    cta_primary_url: '/reservasi',
    cta_secondary_label: 'Lihat Program',
    cta_secondary_url: '/program',
    is_active: true,
    sort_order: 1,
    created_at: '',
  },
]

const AUTOPLAY_DELAY = 5500 // ms

export default function HeroSlider() {
  const [slides, setSlides]       = useState<HeroSlide[]>([])
  const [current, setCurrent]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const [loaded, setLoaded]       = useState<Record<number, boolean>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch slides dari Supabase
  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setSlides(data as HeroSlide[])
        else setSlides(FALLBACK_SLIDES)
      })
      .catch(() => setSlides(FALLBACK_SLIDES))
  }, [])

  const activeSlides = slides.length > 0 ? slides : FALLBACK_SLIDES

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

  const slide = activeSlides[current] ?? FALLBACK_SLIDES[0]

  // Split title on \n for highlight effect
  const titleParts = (slide.title ?? '').split('\n')

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
          <img
            src={s.image_url}
            alt=""
            aria-hidden="true"
            onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
            className={cn(
              'w-full h-full object-cover transition-transform duration-[8000ms] ease-linear',
              i === current && loaded[i] ? 'scale-110' : 'scale-100'
            )}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/75 via-[#1B4332]/55 to-[#1B4332]/80" />
        </div>
      ))}

      {/* ── Content ── */}
      <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto w-full">

        {/* Badge */}
        {slide.badge_text && (
          <div
            key={`badge-${current}`}
            className="inline-flex items-center gap-2 bg-[#F5A623]/20 border border-[#F5A623]/40
              text-[#F5A623] text-sm font-semibold px-4 py-1.5 rounded-full mb-6
              animate-fade-in-up"
          >
            {slide.badge_text}
          </div>
        )}

        {/* Title */}
        <h1
          key={`title-${current}`}
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          {titleParts.map((part, i) => (
            <span key={i}>
              {i === 1
                ? <span className="text-[#F5A623]">{part}</span>
                : part}
              {i < titleParts.length - 1 && <br />}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        {slide.subtitle && (
          <p
            key={`sub-${current}`}
            className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '160ms' }}
          >
            {slide.subtitle}
          </p>
        )}

        {/* CTA buttons */}
        <div
          key={`cta-${current}`}
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
          style={{ animationDelay: '240ms' }}
        >
          {slide.cta_primary_label && slide.cta_primary_url && (
            <Link
              to={slide.cta_primary_url}
              className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#e09520]
                text-white font-bold text-base px-8 py-4 rounded-2xl transition-all
                active:scale-95 shadow-lg shadow-black/20"
            >
              {slide.cta_primary_label}
              <ChevronRight size={18} />
            </Link>
          )}
          {slide.cta_secondary_label && slide.cta_secondary_url && (
            <Link
              to={slide.cta_secondary_url}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/70
                hover:border-white text-white font-bold text-base px-8 py-4 rounded-2xl
                transition-all active:scale-95 hover:bg-white/10 backdrop-blur-sm"
            >
              {slide.cta_secondary_label}
            </Link>
          )}
        </div>

        {/* Location badge */}
        <div
          className="flex items-center justify-center gap-2 mt-10 text-gray-300 text-sm animate-fade-in-up"
          style={{ animationDelay: '320ms' }}
        >
          <MapPin size={14} className="text-[#F5A623]" />
          <span>Sangatta Utara, Kutai Timur, Kalimantan Timur</span>
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30
              w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm
              flex items-center justify-center text-white transition-all border border-white/20
              hover:scale-110 active:scale-95"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30
              w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm
              flex items-center justify-center text-white transition-all border border-white/20
              hover:scale-110 active:scale-95"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-7 h-2.5 bg-[#F5A623]'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar ── */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-0.5 bg-white/10">
          <div
            key={current}
            className="h-full bg-[#F5A623]"
            style={{
              animation: `progress-bar ${AUTOPLAY_DELAY}ms linear`,
            }}
          />
        </div>
      )}

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-white/60 animate-bounce">
        <ChevronDown size={28} />
      </div>

      {/* ── Slide counter ── */}
      {activeSlides.length > 1 && (
        <div className="absolute top-24 right-6 z-30 text-white/50 text-sm font-mono">
          {String(current + 1).padStart(2, '0')} / {String(activeSlides.length).padStart(2, '0')}
        </div>
      )}
    </section>
  )
}
