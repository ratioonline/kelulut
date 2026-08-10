import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Leaf, ShoppingCart } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import { useCartStore } from '../../stores/cartStore'

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/program', label: 'Program' },
  { to: '/produk', label: 'Produk' },
  { to: '/artikel', label: 'Artikel' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/umkm-directory', label: 'UMKM' },
  { to: '/kontak', label: 'Kontak' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Halaman yang pakai hero gelap — navbar pakai mode transparan putih
  const isHeroPage = location.pathname === '/'

  useEffect(() => {
    setOpen(false)
  }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isDark = isHeroPage && !scrolled
  const { toggleCart, totalItems } = useCartStore()
  const cartCount = totalItems()

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : isHeroPage
            ? 'bg-transparent'
            : 'bg-white shadow-sm'
      )}
    >
      {/* Gradient overlay hanya saat transparan di hero — supaya nav terbaca */}
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 80%, transparent 100%)',
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Trigona Reborn Logo"
              className="w-10 h-10 object-contain rounded-full shadow-sm ring-1 ring-amber-500/30 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="leading-tight">
              <p
                className={cn(
                  'text-sm font-bold transition-colors duration-300',
                  isDark ? 'text-white' : 'text-[#1B4332]'
                )}
              >
                Kebun Kelulut
              </p>
              <p
                className={cn(
                  'text-xs transition-colors duration-300',
                  isDark ? 'text-white/75' : 'text-[#2D6A4F]'
                )}
              >
                Sangatta
              </p>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isDark
                      ? isActive
                        ? 'text-white bg-white/20'
                        : 'text-white/90 hover:text-white hover:bg-white/15'
                      : isActive
                        ? 'text-[#2D6A4F] bg-[#2D6A4F]/10'
                        : 'text-gray-700 hover:text-[#2D6A4F] hover:bg-[#2D6A4F]/8'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── CTA + Cart ── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cart button */}
            <button
              onClick={toggleCart}
              className={cn(
                'relative p-2 rounded-xl transition-colors',
                isDark ? 'text-white hover:bg-white/15' : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-label="Keranjang belanja"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#F5A623] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {isDark ? (
              <Link
                to="/reservasi"
                className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e09520] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-black/20"
              >
                Reservasi Sekarang
              </Link>
            ) : (
              <Button as={Link} to="/reservasi" size="sm">
                Reservasi Sekarang
              </Button>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <div className="flex items-center gap-1 md:hidden">
            {/* Mobile cart */}
            <button
              onClick={toggleCart}
              className={cn('relative p-2 rounded-lg transition-colors', isDark ? 'text-white' : 'text-gray-700')}
              aria-label="Keranjang"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-[#F5A623] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {cartCount}
                </span>
              )}
            </button>
            <button
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              isDark
                ? 'text-white hover:bg-white/20'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[#2D6A4F] bg-[#2D6A4F]/10'
                      : 'text-gray-700 hover:text-[#2D6A4F] hover:bg-gray-50'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/reservasi"
              className="mt-2 w-full text-center bg-[#2D6A4F] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1B4332] transition-colors"
            >
              Reservasi Sekarang
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
