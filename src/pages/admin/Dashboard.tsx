import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ShoppingBag, FileText, Images, TrendingUp, Clock, AlertTriangle, Users, Store, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency, formatDate } from '../../lib/utils'
import { StatusBadge } from '../../components/ui/Badge'
import { Card, CardBody } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import type { Reservation, Product } from '../../types/database'

const COLORS = ['#2D6A4F', '#F5A623', '#4A90E2', '#E74C3C', '#9B59B6', '#34495E']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [visitTypes, setVisitTypes] = useState<any[]>([])
  const { role, myUmkm } = useAuthStore()

  useEffect(() => {
    const fetchAll = async () => {
      // Basic metrics
      let umkmQuery = supabase.from('umkms').select('*', { count: 'exact', head: true }).eq('status', 'active')
      let resQuery = supabase.from('reservations').select('*')
      let trxQuery = supabase.from('transactions').select('*, items:transaction_items(*, product:products(name))')
      let prodQuery = supabase.from('products').select('*').order('sold_count', { ascending: false }).limit(10)

      if (role === 'umkm_user' && myUmkm) {
        trxQuery = trxQuery.eq('umkm_id', myUmkm.id)
        prodQuery = prodQuery.eq('umkm_id', myUmkm.id)
      }

      const [
        { count: umkmCount },
        { data: reservations },
        { data: transactions },
        { data: topProds }
      ] = await Promise.all([
        umkmQuery,
        resQuery,
        trxQuery,
        prodQuery
      ])

      // Aggregations
      const totalVisits = reservations?.reduce((sum, r) => sum + (r.num_visitors || 0), 0) || 0
      const totalRevenue = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0
      const totalOrders = transactions?.length || 0
      const totalItemsSold = transactions?.reduce((sum, t) => {
        return sum + (t.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0)
      }, 0) || 0

      // Pie chart for visitor types (using 'type' if exists, else mock from names)
      const vTypes: Record<string, number> = { 'Sekolah': 0, 'Instansi': 0, 'Umum': 0 }
      reservations?.forEach(r => {
        if (r.name.toLowerCase().includes('sd') || r.name.toLowerCase().includes('tk') || r.name.toLowerCase().includes('smp')) vTypes['Sekolah'] += r.num_visitors || 0
        else if (r.name.toLowerCase().includes('pt') || r.name.toLowerCase().includes('dinas')) vTypes['Instansi'] += r.num_visitors || 0
        else vTypes['Umum'] += r.num_visitors || 0
      })
      const visitData = Object.entries(vTypes).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)

      // Dummy line chart data for demo
      const mockSalesData = [
        { name: '01', kunjungan: 400, pendapatan: 2400 },
        { name: '05', kunjungan: 300, pendapatan: 1398 },
        { name: '10', kunjungan: 200, pendapatan: 9800 },
        { name: '15', kunjungan: 278, pendapatan: 3908 },
        { name: '20', kunjungan: 189, pendapatan: 4800 },
        { name: '25', kunjungan: 239, pendapatan: 3800 },
        { name: '30', kunjungan: 349, pendapatan: 4300 },
      ]

      setStats({ totalVisits, totalRevenue, totalOrders, totalItemsSold, umkmCount })
      setRecentReservations((reservations || []).slice(0, 5))
      setTopProducts((topProds || []) as Product[])
      setVisitTypes(visitData)
      setSalesData(mockSalesData)
      setLoading(false)
    }
    fetchAll()
  }, [role, myUmkm])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistik Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan kunjungan dan penjualan</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card hover><CardBody className="flex flex-col gap-2"><div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"><Users size={20} className="text-white" /></div><div><p className="text-gray-500 text-xs font-semibold uppercase">Total Kunjungan</p><p className="text-2xl font-bold">{stats?.totalVisits}</p></div></CardBody></Card>
        <Card hover><CardBody className="flex flex-col gap-2"><div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center"><DollarSign size={20} className="text-white" /></div><div><p className="text-gray-500 text-xs font-semibold uppercase">Total Pendapatan</p><p className="text-xl font-bold text-[#F5A623]">{formatCurrency(stats?.totalRevenue)}</p></div></CardBody></Card>
        <Card hover><CardBody className="flex flex-col gap-2"><div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center"><ShoppingBag size={20} className="text-white" /></div><div><p className="text-gray-500 text-xs font-semibold uppercase">Total Pesanan</p><p className="text-2xl font-bold">{stats?.totalOrders}</p></div></CardBody></Card>
        <Card hover><CardBody className="flex flex-col gap-2"><div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white" /></div><div><p className="text-gray-500 text-xs font-semibold uppercase">Total Produk Terjual</p><p className="text-2xl font-bold">{stats?.totalItemsSold}</p></div></CardBody></Card>
        {(role === 'super_admin' || role === 'proktor') && (
          <Card hover><CardBody className="flex flex-col gap-2"><div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center"><Store size={20} className="text-white" /></div><div><p className="text-gray-500 text-xs font-semibold uppercase">UMKM Aktif</p><p className="text-2xl font-bold">{stats?.umkmCount}</p></div></CardBody></Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="text-sm font-bold text-gray-900 mb-6">Tren Kunjungan & Pendapatan</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="kunjungan" stroke="#2D6A4F" strokeWidth={3} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pendapatan" stroke="#4A90E2" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <h2 className="text-sm font-bold text-gray-900 mb-6">Kunjungan Berdasarkan Jenis</h2>
            <div className="h-64 w-full flex flex-col items-center justify-center">
              {visitTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={visitTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {visitTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm">Belum ada data kunjungan</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h2 className="text-sm font-bold text-gray-900 mb-6">10 Produk Terlaris</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-2 px-3">Produk</th>
                    <th className="py-2 px-3">Terjual</th>
                    <th className="py-2 px-3">Sisa Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-medium">{p.name}</td>
                      <td className="py-2 px-3 font-bold text-green-600">{p.sold_count || 0}</td>
                      <td className="py-2 px-3 text-gray-500">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-sm font-bold text-gray-900 mb-6">Jadwal Kunjungan Terdekat</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-2 px-3">Tanggal</th>
                    <th className="py-2 px-3">Nama/Rombongan</th>
                    <th className="py-2 px-3">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentReservations.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 text-gray-600">{formatDate(r.visit_date)}</td>
                      <td className="py-2 px-3 font-medium">{r.name}</td>
                      <td className="py-2 px-3 text-gray-500">{r.num_visitors} orang</td>
                    </tr>
                  ))}
                  {recentReservations.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400">Tidak ada jadwal</td></tr>}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
