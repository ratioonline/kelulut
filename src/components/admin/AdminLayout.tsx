import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  FileText,
  Images,
  BookOpen,
  LogOut,
  Menu,
  ChevronRight,
  LayoutTemplate,
  Store,
  Users,
  Building2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'proktor', 'umkm_user'] },
  { to: '/admin/transaksi', icon: ShoppingBag,     label: 'Kasir (Offline)', roles: ['super_admin', 'proktor', 'umkm_user'] },
  { to: '/admin/profil',    icon: Store,           label: 'Profil UMKM', roles: ['umkm_user'] },
  { to: '/admin/media',     icon: Images,          label: 'Media Library', roles: ['super_admin', 'proktor'] },
  { to: '/admin/hero',      icon: LayoutTemplate,  label: 'Hero Slider',     roles: ['super_admin', 'proktor'] },
  { to: '/admin/profil-website', icon: Building2,  label: 'Profil Website',  roles: ['super_admin', 'proktor'] },
  { to: '/admin/reservasi', icon: CalendarCheck,   label: 'Reservasi', roles: ['super_admin', 'proktor', 'umkm_user'] },
  { to: '/admin/produk',    icon: ShoppingBag,     label: 'Produk', roles: ['super_admin', 'proktor', 'umkm_user'] },
  { to: '/admin/artikel',   icon: FileText,        label: 'Artikel', roles: ['super_admin', 'proktor', 'umkm_user'] },
  { to: '/admin/galeri',    icon: Images,          label: 'Galeri', roles: ['super_admin', 'proktor', 'umkm_user'] },
  { to: '/admin/program',   icon: BookOpen,        label: 'Program', roles: ['super_admin', 'proktor'] },
  { to: '/admin/umkm-management', icon: Store,     label: 'UMKM', roles: ['super_admin', 'proktor'] },
  { to: '/admin/pengguna',  icon: Users,           label: 'Pengguna', roles: ['super_admin', 'proktor'] },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut, user, role } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/admin/login')
  }

  const Sidebar = (
    <aside className="flex flex-col h-full bg-[#1B4332] text-white w-64">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
        <img
          src="/logo.png"
          alt="Trigona Reborn Logo"
          className="w-9 h-9 object-contain rounded-full ring-1 ring-[#F5A623]/40 shadow-sm"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold">Kebun Kelulut</p>
          <p className="text-xs text-[#F5A623]">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter(i => i.roles.includes(role as string)).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
            {label}
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
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
          <h1 className="text-lg font-semibold text-gray-900 flex-1">Admin Panel</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
