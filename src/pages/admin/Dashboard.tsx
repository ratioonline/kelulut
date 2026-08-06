import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ShoppingBag, FileText, Images, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { StatusBadge } from '../../components/ui/Badge'
import { Card, CardBody } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import type { Reservation } from '../../types/database'

interface Stats {
  reservations: number
  pending: number
  products: number
  articles: number
  gallery: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [
        { count: reservations },
        { count: pending },
        { count: products },
        { count: articles },
        { count: gallery },
        { data: recent },
      ] = await Promise.all([
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('*', { count: 'exact', head: true }),
        supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        reservations: reservations ?? 0,
        pending: pending ?? 0,
        products: products ?? 0,
        articles: articles ?? 0,
        gallery: gallery ?? 0,
      })
      setRecentReservations(recent ?? [])
      setLoading(false)
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Reservasi',
      value: stats?.reservations ?? 0,
      icon: CalendarCheck,
      color: 'bg-blue-500',
      link: '/admin/reservasi',
      sub: `${stats?.pending} menunggu`,
    },
    {
      label: 'Total Produk',
      value: stats?.products ?? 0,
      icon: ShoppingBag,
      color: 'bg-[#F5A623]',
      link: '/admin/produk',
      sub: 'produk aktif',
    },
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
    <div className="space-y-8">
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
      {(stats?.pending ?? 0) > 0 && (
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

      {/* Recent reservations */}
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
    </div>
  )
}
