import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ShoppingBag, FileText, Images, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { StatusBadge } from '../../components/ui/Badge'
import { Card, CardBody } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import type { Reservation, Product } from '../../types/database'

interface Stats {
  reservations: number
  pending: number
  products: number
  articles: number
  gallery: number
  outOfStock: number
  lowStock: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { role, myUmkm } = useAuthStore()

  useEffect(() => {
    const fetchAll = async () => {
      let productsQuery = supabase.from('products').select('*', { count: 'exact', head: true })
      let outOfStockQuery = supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0)
      let lowStockQuery = supabase.from('products').select('*', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 5) // Asumsi minimum stock 5
      let articlesQuery = supabase.from('articles').select('*', { count: 'exact', head: true })
      let galleryQuery = supabase.from('gallery').select('*', { count: 'exact', head: true })
      let recentProductsQuery = supabase.from('products').select('*').order('created_at', { ascending: false }).limit(5)

      if (role === 'umkm_user') {
        const umkmId = myUmkm ? myUmkm.id : '00000000-0000-0000-0000-000000000000'
        productsQuery = productsQuery.eq('umkm_id', umkmId)
        outOfStockQuery = outOfStockQuery.eq('umkm_id', umkmId)
        lowStockQuery = lowStockQuery.eq('umkm_id', umkmId)
        articlesQuery = articlesQuery.eq('umkm_id', umkmId)
        galleryQuery = galleryQuery.eq('umkm_id', umkmId)
        recentProductsQuery = recentProductsQuery.eq('umkm_id', umkmId)
      }

      const [
        { count: reservations },
        { count: pending },
        { count: products },
        { count: articles },
        { count: gallery },
        { count: outOfStock },
        { count: lowStock },
        { data: recentRes },
        { data: recentProd },
      ] = await Promise.all([
        role === 'super_admin' ? supabase.from('reservations').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
        role === 'super_admin' ? supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
        productsQuery,
        articlesQuery,
        galleryQuery,
        outOfStockQuery,
        lowStockQuery,
        role === 'super_admin' 
          ? supabase.from('reservations').select('*').order('visit_date', { ascending: false }).limit(5)
          : Promise.resolve({ data: [] }),
        role === 'umkm_user'
          ? recentProductsQuery
          : Promise.resolve({ data: [] })
      ])

      setStats({
        reservations: reservations ?? 0,
        pending: pending ?? 0,
        products: products ?? 0,
        articles: articles ?? 0,
        gallery: gallery ?? 0,
        outOfStock: outOfStock ?? 0,
        lowStock: lowStock ?? 0,
      })
      setRecentReservations(recentRes ?? [])
      setRecentProducts((recentProd ?? []) as Product[])
      setLoading(false)
    }

    fetchAll()
  }, [role, myUmkm])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    ...(role === 'super_admin' ? [{
      label: 'Total Reservasi',
      value: stats?.reservations ?? 0,
      icon: CalendarCheck,
      color: 'bg-blue-500',
      link: '/admin/reservasi',
      sub: `${stats?.pending} menunggu`,
    }] : []),
    {
      label: 'Total Produk',
      value: stats?.products ?? 0,
      icon: ShoppingBag,
      color: 'bg-[#F5A623]',
      link: '/admin/produk',
      sub: 'produk terdaftar',
    },
    ...(role === 'umkm_user' ? [
      {
        label: 'Stok Habis',
        value: stats?.outOfStock ?? 0,
        icon: AlertTriangle,
        color: 'bg-red-500',
        link: '/admin/produk',
        sub: 'perlu restock',
      },
      {
        label: 'Stok Menipis',
        value: stats?.lowStock ?? 0,
        icon: TrendingUp,
        color: 'bg-yellow-500',
        link: '/admin/produk',
        sub: 'stok <= 5',
      }
    ] : []),
    {
      label: 'Total Artikel',
      value: stats?.articles ?? 0,
      icon: FileText,
      color: 'bg-[#2D6A4F]',
      link: '/admin/artikel',
      sub: 'artikel',
    },
    {
      label: 'Total Galeri',
      value: stats?.gallery ?? 0,
      icon: Images,
      color: 'bg-purple-500',
      link: '/admin/galeri',
      sub: 'foto',
    },
  ]

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang kembali di panel admin.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link, sub }) => (
          <Link key={label} to={link}>
            <Card hover className="h-full">
              <CardBody className="flex flex-col gap-3">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending alert */}
      {role === 'super_admin' && (stats?.pending ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <TrendingUp size={18} className="text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            Ada <strong>{stats?.pending}</strong> reservasi yang menunggu konfirmasi.{' '}
            <Link to="/admin/reservasi" className="underline font-semibold">
              Lihat sekarang
            </Link>
          </p>
        </div>
      )}

      {/* Recent reservations for super admin */}
      {role === 'super_admin' && (
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-[#2D6A4F]" />
              Reservasi Terbaru
            </h2>
            <Link
              to="/admin/reservasi"
              className="text-xs text-[#2D6A4F] font-semibold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {recentReservations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada reservasi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Nama
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tanggal
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Pengunjung
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{formatDate(r.visit_date)}</td>
                      <td className="py-3 px-3 text-gray-600">{r.num_visitors} orang</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      )}

      {/* Recent products for umkm_user */}
      {role === 'umkm_user' && (
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#F5A623]" />
              Produk Terbaru
            </h2>
            <Link
              to="/admin/produk"
              className="text-xs text-[#2D6A4F] font-semibold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada produk yang ditambahkan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Produk
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Harga
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Stok
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ShoppingBag size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-900 font-medium">{formatCurrency(p.price || 0)}</td>
                      <td className="py-3 px-3">
                        <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock && p.stock <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={p.status || (p.is_available ? 'active' : 'inactive')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      )}
    </div>
  )
}
