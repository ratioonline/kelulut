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
  Camera,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface NavGroup {
  groupName: string
  items: {
    to: string
    icon: typeof LayoutDashboard
    label: string
    roles: string[]
  }[]
}

const navGroups: NavGroup[] = [
  {
    groupName: 'BUSINESS',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'proktor', 'umkm_user'] },
      { to: '/admin/transaksi', icon: ShoppingBag, label: 'Kasir (Offline)', roles: ['super_admin', 'proktor', 'umkm_user'] },
      { to: '/admin/reservasi', icon: CalendarCheck, label: 'Reservasi', roles: ['super_admin', 'proktor', 'umkm_user'] },
      { to: '/admin/produk', icon: ShoppingBag, label: 'Produk', roles: ['super_admin', 'proktor', 'umkm_user'] },
      { to: '/admin/profil', icon: Store, label: 'Profil UMKM', roles: ['umkm_user'] },
      { to: '/admin/umkm-management', icon: Store, label: 'Mitra UMKM', roles: ['super_admin', 'proktor'] },
    ],
  },
  {
    groupName: 'CONTENT',
    items: [
      { to: '/admin/artikel', icon: FileText, label: 'Artikel', roles: ['super_admin', 'proktor', 'umkm_user'] },
      { to: '/admin/galeri', icon: Images, label: 'Galeri', roles: ['super_admin', 'proktor', 'umkm_user'] },
      { to: '/admin/umkm-galeri', icon: Camera, label: 'Foto Toko', roles: ['umkm_user', 'super_admin', 'proktor'] },
      { to: '/admin/hero', icon: LayoutTemplate, label: 'Hero Slider', roles: ['super_admin', 'proktor'] },
      { to: '/admin/media', icon: Images, label: 'Media Library', roles: ['super_admin', 'proktor'] },
      { to: '/admin/program', icon: BookOpen, label: 'Program', roles: ['super_admin', 'proktor'] },
    ],
  },
  {
    groupName: 'SYSTEM',
    items: [
      { to: '/admin/profil-website', icon: Building2, label: 'Profil Website', roles: ['super_admin', 'proktor'] },
      { to: '/admin/pengguna', icon: Users, label: 'Pengguna & Akun', roles: ['super_admin', 'proktor'] },
    ],
  },
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
    <aside className="flex flex-col h-full bg-[#1B4332] text-white w-64 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
        <img
          src="/logo.png"
          alt="Trigona Reborn Logo"
          className="w-8 h-8 object-contain rounded-full ring-1 ring-[#F5A623]/40 shadow-xs"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">Kebun Kelulut</p>
          <p className="text-[11px] text-[#F5A623] font-medium">Command Center</p>
        </div>
      </div>

      {/* Nav with Groups & Dividers */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(role as string)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={group.groupName} className="space-y-1">
              <div className="px-3 pt-1 pb-1">
                <p className="text-[10px] font-bold tracking-wider text-emerald-300/60 uppercase">
                  {group.groupName}
                </p>
              </div>

              {visibleItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-white/15 text-white font-semibold shadow-2xs border border-white/10'
                        : 'text-gray-300 hover:bg-white/8 hover:text-white'
                    )
                  }
                >
                  <Icon size={16} className="shrink-0 text-emerald-300/80 group-hover:text-white" />
                  <span className="truncate">{label}</span>
                  <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
                </NavLink>
              ))}

              {groupIdx < navGroups.length - 1 && (
                <div className="pt-2 border-b border-white/5" />
              )}
            </div>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#163829]">
        <div className="mb-2">
          <p className="text-xs font-semibold text-white truncate">
            {user?.email?.split('@')[0]?.replace(/[._-]/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Administrator'}
          </p>
          <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={14} />
          <span>Keluar</span>
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
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-150">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">{Sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200/80 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-sm font-bold text-gray-900">Admin Command Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
              Role: <span className="text-emerald-700 font-bold uppercase">{role || 'Super Admin'}</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
