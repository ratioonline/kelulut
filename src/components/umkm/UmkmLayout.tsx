import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  Package,
  Star,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Image,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  children?: { to: string; label: string }[]
}

const navItems: NavItem[] = [
  { to: '/umkm/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/umkm/profile', icon: User, label: 'Profil UMKM' },
  {
    to: '/umkm/products',
    icon: ShoppingBag,
    label: 'Produk',
    children: [
      { to: '/umkm/products', label: 'Semua Produk' },
      { to: '/umkm/products/create', label: 'Tambah Produk' },
    ],
  },
  { to: '/umkm/stock', icon: Package, label: 'Stok' },
  { to: '/umkm/reviews', icon: Star, label: 'Ulasan' },
  { to: '/umkm/media', icon: Image, label: 'Media' },
  { to: '/umkm/settings', icon: Settings, label: 'Pengaturan' },
]

export default function UmkmLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const { signOut, user, myUmkm } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/umkm/login')
  }

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(prev => (prev === label ? null : label))
  }

  const Sidebar = (
    <aside className="flex flex-col h-full bg-[#1B4332] text-white w-64">
      {/* Logo / UMKM Identity */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        {myUmkm?.logo ? (
          <img
            src={myUmkm.logo}
            alt={myUmkm.name}
            className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#F5A623]/40 shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-lg font-bold text-[#F5A623]">
            {myUmkm?.name?.[0] ?? 'U'}
          </div>
        )}
        <div className="leading-tight min-w-0">
          <p className="text-sm font-bold truncate">{myUmkm?.name ?? 'UMKM'}</p>
          <p className="text-xs text-[#F5A623]">Dashboard UMKM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedMenu === item.label

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform', isExpanded && 'rotate-180')}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.children!.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block px-4 py-2 rounded-lg text-xs font-medium transition-all',
                            isActive
                              ? 'bg-white/15 text-white'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/umkm/products'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {item.label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-gray-400 mb-3 truncate px-1">{user?.email}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">{Sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">{Sidebar}</div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-white"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 lg:px-8">
          <button
            className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <BarChart3 size={18} className="text-[#2D6A4F]" />
            <h1 className="text-lg font-semibold text-gray-900">Dashboard UMKM</h1>
          </div>
          {myUmkm?.slug && (
            <a
              href={`/umkm/${myUmkm.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#2D6A4F] hover:underline"
            >
              Lihat Halaman Publik →
            </a>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
