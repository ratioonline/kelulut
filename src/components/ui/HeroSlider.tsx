import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Play } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { HeroSlide } from '../../types/database'
import { cn } from '../../lib/utils'

const DEFAULT_AUTOPLAY_IMAGE_MS = 6000
const DEFAULT_AUTOPLAY_VIDEO_MS = 9000
const CACHE_KEY = 'hero_slides_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours TTL

interface HeroCacheData {
  slides: HeroSlide[]
  timestamp: number
}

function getInitialCachedSlides(): { slides: HeroSlide[]; hasValidCache: boolean } {
  if (typeof window === 'undefined') {
    return { slides: [], hasValidCache: false }
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return { slides: [], hasValidCache: false }
    const parsed: HeroCacheData = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
      const isFresh = Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS
      if (isFresh) {
        return { slides: parsed.slides, hasValidCache: true }
      }
    }
  } catch {
    // Ignore JSON parse error
  }
  return { slides: [], hasValidCache: false }
}

export default function HeroSlider() {
  const cached = useRef(getInitialCachedSlides())
  const [slides, setSlides] = useState<HeroSlide[]>(() => cached.current.slides)
  const [loading, setLoading] = useState<boolean>(() => !cached.current.hasValidCache)
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const [videoReady, setVideoReady] = useState<Record<number, boolean>>({})
  const [videoError, setVideoError] = useState<Record<number, boolean>>({})
  const [renderedSlides, setRenderedSlides] = useState<Set<number>>(() => new Set([0]))
  const [autoplayDuration, setAutoplayDuration] = useState<number>(DEFAULT_AUTOPLAY_IMAGE_MS)
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({})

  // Fetch slides dari Supabase di background (stale-while-revalidate)
  useEffect(() => {
    let isMounted = true
    const fetchSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (!isMounted) return

        if (!error && data && data.length > 0) {
          const freshSlides = data as HeroSlide[]
          setSlides(freshSlides)
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ slides: freshSlides, timestamp: Date.now() })
            )
          } catch {
            // Ignore localStorage errors
          }
        }
      } catch (err) {
        console.warn('Notice: Background hero slides fetch:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchSlides()
    return () => { isMounted = false }
  }, [])

  // Page Visibility API handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      setIsTabVisible(isVisible)
      if (!isVisible) {
        // Pause all videos when tab is hidden
        Object.values(videoRefs.current).forEach((videoEl) => videoEl?.pause())
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const activeSlides = useMemo(() => slides.filter((s) => s.is_active), [slides])

  // Pastikan slide aktif dan slide adjacent disiapkan
  useEffect(() => {
    if (activeSlides.length === 0) return
    setRenderedSlides((prev) => {
      const nextIdx = (current + 1) % activeSlides.length
      const prevIdx = (current - 1 + activeSlides.length) % activeSlides.length
      if (prev.has(current) && prev.has(nextIdx) && prev.has(prevIdx)) return prev
      const nextSet = new Set(prev)
      nextSet.add(current)
      nextSet.add(nextIdx)
      nextSet.add(prevIdx)
      return nextSet
    })
  }, [current, activeSlides.length])

  // Muat sisa slide lainnya secara bertahap setelah browser idle (2.5 detik)
  useEffect(() => {
    if (activeSlides.length === 0) return
    const timer = setTimeout(() => {
      setRenderedSlides(new Set(activeSlides.map((_, i) => i)))
    }, 2500)
    return () => clearTimeout(timer)
  }, [activeSlides])

  // Navigasi Slide
  const goTo = useCallback((idx: number) => {
    if (animating || idx === current) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 700)
  }, [animating, current])

  const next = useCallback(() => {
    if (activeSlides.length <= 1) return
    goTo((current + 1) % activeSlides.length)
  }, [current, activeSlides.length, goTo])

  const prev = useCallback(() => {
    if (activeSlides.length <= 1) return
    goTo((current - 1 + activeSlides.length) % activeSlides.length)
  }, [current, activeSlides.length, goTo])

  // Kontrol Video Playback & Pause saat pergantian slide
  useEffect(() => {
    if (!isTabVisible) return
    const activeSlide = activeSlides[current]
    if (!activeSlide) return

    const isVideoSlide = (activeSlide.media_type === 'video' || Boolean(activeSlide.video_url)) && Boolean(activeSlide.video_url)

    // Tentukan durasi autoplay yang adaptif
    if (isVideoSlide) {
      const videoEl = videoRefs.current[current]
      if (videoEl && !isNaN(videoEl.duration) && videoEl.duration > 0) {
        setAutoplayDuration(Math.max(6000, Math.min(videoEl.duration * 1000, 16000)))
      } else {
        setAutoplayDuration(DEFAULT_AUTOPLAY_VIDEO_MS)
      }
    } else {
      setAutoplayDuration(DEFAULT_AUTOPLAY_IMAGE_MS)
    }

    // Play video slide aktif, pause slide lainnya
    Object.entries(videoRefs.current).forEach(([idxStr, videoEl]) => {
      const idx = Number(idxStr)
      if (!videoEl) return

      if (idx === current && !videoError[idx]) {
        videoEl.currentTime = 0
        const playPromise = videoEl.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser autoplay restrictions handled gracefully; poster fallback remains visible
          })
        }
      } else {
        videoEl.pause()
      }
    })
  }, [current, activeSlides, isTabVisible, videoError])

  // Autoplay Timer
  useEffect(() => {
    if (!isTabVisible || activeSlides.length <= 1) return
    timerRef.current = setTimeout(next, autoplayDuration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, activeSlides.length, next, autoplayDuration, isTabVisible])

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

  // Jika cold start tanpa cache dan Supabase belum kembali
  if (loading && activeSlides.length === 0) {
    return (
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0e271d]"
        aria-label="Memuat slider hero"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e271d]/90 via-[#133527]/70 to-[#0e271d]/95" />
      </section>
    )
  }

  if (activeSlides.length === 0) {
    return null
  }

  const slide = activeSlides[current] ?? activeSlides[0]

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A1F17]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Hero slider cinematic Kebun Kelulut"
    >
      {/* Semantic H1 for SEO (visually hidden to maintain approved clean cinematic design) */}
      <h1 className="sr-only">Wisata Edukasi Lebah Kelulut Sangatta</h1>

      {/* ── Background Media Layers ── */}
      {activeSlides.map((s, i) => {
        const isRendered = renderedSlides.has(i)
        const isVideo = (s.media_type === 'video' || Boolean(s.video_url)) && Boolean(s.video_url) && !videoError[i]
        const posterSrc = s.poster_url || s.image_url
        const isActive = i === current

        return (
          <div
            key={s.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none',
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            )}
          >
            {isRendered && (
              <div className="relative w-full h-full overflow-hidden bg-black">
                {isVideo ? (
                  <>
                    {/* Poster Image (LCP & Buffering Fallback) */}
                    <img
                      src={posterSrc}
                      alt=""
                      aria-hidden="true"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      className="absolute inset-0 w-full h-full object-cover filter brightness-[1.08] contrast-[1.04] saturate-[1.08]"
                    />

                    {/* HTML5 Native Video */}
                    <video
                      ref={(el) => { videoRefs.current[i] = el }}
                      src={s.video_url!}
                      poster={posterSrc}
                      autoPlay={isActive}
                      muted
                      loop
                      playsInline
                      preload={isActive ? 'auto' : (i === (current + 1) % activeSlides.length ? 'metadata' : 'none')}
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration
                        if (!isNaN(dur) && dur > 0 && isActive) {
                          setAutoplayDuration(Math.max(6000, Math.min(dur * 1000, 16000)))
                        }
                      }}
                      onLoadedData={() => setVideoReady((p) => ({ ...p, [i]: true }))}
                      onError={() => setVideoError((p) => ({ ...p, [i]: true }))}
                      onEnded={next}
                      className={cn(
                        'absolute inset-0 w-full h-full object-cover filter brightness-[1.08] contrast-[1.04] saturate-[1.08] transition-opacity duration-700 motion-reduce:transition-none',
                        videoReady[i] ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </>
                ) : (
                  /* Image Media */
                  <img
                    src={s.image_url}
                    alt=""
                    aria-hidden="true"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
                    className={cn(
                      'w-full h-full object-cover transition-transform duration-[9000ms] ease-out filter brightness-[1.12] contrast-[1.05] saturate-[1.10] motion-reduce:transform-none',
                      isActive && loaded[i] ? 'scale-105' : 'scale-100'
                    )}
                  />
                )}
              </div>
            )}

            {/* ── Layer 1: Directional Soft Vignette Gradient ── */}
            <div
              className="absolute inset-0 hidden md:block pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, rgba(10, 31, 23, 0.68) 0%, rgba(15, 45, 33, 0.38) 45%, rgba(18, 55, 40, 0.18) 75%, rgba(10, 31, 23, 0.30) 100%)',
              }}
            />

            {/* ── Layer 1 Mobile: Soft Vertical Gradient ── */}
            <div
              className="absolute inset-0 md:hidden pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(10, 31, 23, 0.62) 0%, rgba(15, 45, 33, 0.40) 45%, rgba(10, 31, 23, 0.70) 100%)',
              }}
            />

            {/* ── Layer 2: Top (Navbar) & Bottom Edge Vignette ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(7, 22, 16, 0.50) 0%, transparent 20%, transparent 72%, rgba(7, 22, 16, 0.65) 100%)',
              }}
            />

            {/* ── Layer 3: Warm Sunbeam Accent ── */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
              style={{
                background:
                  'radial-gradient(ellipse at 85% 15%, rgba(245, 166, 35, 0.40) 0%, transparent 60%)',
              }}
            />
          </div>
        )
      })}

      {/* ── Hero Center Content (Clean Cinematic Look) ── */}
      <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto w-full pt-20 pb-28 md:pt-6 md:pb-24">

        {/* Badge */}
        {slide.badge_text && (
          <div
            key={`badge-${current}`}
            className="inline-flex items-center gap-2 bg-[#F5A623]/25 hover:bg-[#F5A623]/35 border border-[#F5A623]/60 text-amber-200 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-md shadow-md shadow-amber-950/20 animate-fade-in-up transition-all duration-300 mb-8"
          >
            <span>{slide.badge_text}</span>
          </div>
        )}

        {/* CTA buttons */}
        <div
          key={`cta-${current}`}
          className="flex flex-col sm:flex-row gap-3.5 justify-center items-center animate-fade-in-up"
          style={{ animationDelay: '150ms' }}
        >
          {slide.cta_primary_label && slide.cta_primary_url && (
            <Link
              to={slide.cta_primary_url}
              className="group inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#e09520]
                text-white font-bold text-sm md:text-base px-7 py-3.5 rounded-2xl transition-all duration-300
                active:scale-95 shadow-xl shadow-amber-950/40 hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              <span>{slide.cta_primary_label}</span>
              <ChevronRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
          {slide.cta_secondary_label && slide.cta_secondary_url && (
            <Link
              to={slide.cta_secondary_url}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/80
                hover:border-white text-white font-bold text-sm md:text-base px-7 py-3.5 rounded-2xl
                transition-all duration-300 active:scale-95 bg-white/10 hover:bg-white/20
                backdrop-blur-md shadow-lg shadow-black/20 hover:-translate-y-0.5"
            >
              {slide.cta_secondary_label}
            </Link>
          )}
        </div>

        {/* Location badge */}
        <div
          className="inline-flex items-center justify-center gap-2 mt-8 text-white/85 text-xs md:text-sm font-medium animate-fade-in-up bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 shadow-sm"
          style={{ animationDelay: '220ms' }}
        >
          <MapPin size={14} className="text-[#FBBF24]" />
          <span>Sangatta Utara, Kutai Timur, Kalimantan Timur</span>
        </div>
      </div>

      {/* ── Prev / Next floating arrows ── */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-md
              items-center justify-center text-white transition-all duration-300 border border-white/25 hover:border-white/60
              hover:scale-110 active:scale-95 shadow-xl shadow-black/30"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30
              w-12 h-12 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-md
              items-center justify-center text-white transition-all duration-300 border border-white/25 hover:border-white/60
              hover:scale-110 active:scale-95 shadow-xl shadow-black/30"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* ── Modern Tourism Horizontal Bottom Navigation Bar ── */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-lg px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-white/15 max-w-full overflow-x-auto shadow-2xl no-scrollbar">
            {activeSlides.map((s, i) => {
              const isActive = i === current
              const isVideo = (s.media_type === 'video' || Boolean(s.video_url)) && Boolean(s.video_url)
              const cleanTitle = s.title ? s.title.replace('\n', ' ') : `Slide ${i + 1}`

              return (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  className={cn(
                    'group relative text-left py-1.5 px-2.5 sm:px-3.5 rounded-xl transition-all duration-300 shrink-0 flex flex-col justify-between',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  )}
                  aria-label={`Pindah ke slide ${i + 1}: ${cleanTitle}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className={cn(
                      'text-[10px] sm:text-xs font-mono font-bold transition-colors',
                      isActive ? 'text-[#FBBF24]' : 'text-white/50 group-hover:text-white/80'
                    )}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {isVideo && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/80 text-white font-bold flex items-center gap-0.5">
                        <Play size={8} className="fill-white" /> Video
                      </span>
                    )}
                    <span className={cn(
                      'hidden md:inline-block text-xs font-semibold max-w-[130px] lg:max-w-[180px] truncate',
                      isActive ? 'text-white' : 'text-white/70'
                    )}>
                      {cleanTitle}
                    </span>
                  </div>

                  {/* Dynamic Progress Timer Line on Active Item */}
                  <div className="w-full h-0.5 bg-white/15 rounded-full overflow-hidden mt-1.5">
                    {isActive ? (
                      <div
                        key={`prog-${current}-${autoplayDuration}`}
                        className="h-full bg-[#F5A623] shadow-[0_0_8px_rgba(245,166,35,0.9)] motion-reduce:animate-none"
                        style={{
                          animation: `progress-bar ${autoplayDuration}ms linear`,
                        }}
                      />
                    ) : (
                      <div className="h-full w-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}


