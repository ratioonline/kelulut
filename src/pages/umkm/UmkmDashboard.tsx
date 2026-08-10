import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Button from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function UmkmDashboard() {
  const { user, myUmkm } = useAuthStore()
  const { stats, products, auditLogs, loading, fetchProducts, fetchAuditLogs, computeStats } = useUmkmStore()

  useEffect(() => {
    if (myUmkm?.id) {
      fetchProducts(myUmkm.id)
      fetchAuditLogs(myUmkm.id)
    }
  }, [myUmkm?.id, fetchProducts, fetchAuditLogs])

  useEffect(() => {
    computeStats()
  }, [products, computeStats])

  if (!myUmkm) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingBag size={32} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada UMKM</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">
          Akun Anda belum terhubung dengan UMKM. Hubungi admin untuk mendaftarkan UMKM Anda.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Produk',
      value: stats.totalProducts,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      link: '/umkm/products',
    },
    {
      label: 'Produk Aktif',
      value: stats.activeProducts,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/umkm/products?status=active',
    },
    {
      label: 'Stok Menipis',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      link: '/umkm/stock',
    },
    {
      label: 'Stok Habis',
      value: stats.outOfStock,
      icon: XCircle,
      color: 'bg-red-500',
      link: '/umkm/stock',
    },
  ]

  const recentProducts = products.slice(0, 5)
  const lowStockProducts = products
    .filter(p => p.stock > 0 && p.stock <= (p.minimum_stock ?? 5))
    .slice(0, 5)
  const outOfStockProducts = products.filter(p => p.stock === 0).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Selamat datang, <span className="font-medium text-gray-700">{myUmkm.owner_name || myUmkm.name}</span>
          </p>
        </div>
        <Link to="/umkm/products/create">
          <Button size="sm">
            <Plus size={16} /> Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link}>
            <Card hover className="h-full">
              <CardBody className="flex flex-col gap-3">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alert: low stock */}
      {stats.lowStock > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            Ada <strong>{stats.lowStock}</strong> produk dengan stok menipis.{' '}
            <Link to="/umkm/stock" className="underline font-semibold">Kelola stok</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-[#2D6A4F]" />
                Produk Terbaru
              </h2>
              <Link to="/umkm/products" className="text-xs text-[#2D6A4F] font-semibold hover:underline">
                Lihat Semua
              </Link>
            </div>
            {recentProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada produk.</p>
            ) : (
              <div className="space-y-3">
                {recentProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/umkm/products/${p.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag size={14} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(p.price ?? 0)}</p>
                    </div>
                    <Badge variant={p.status === 'active' ? 'green' : p.status === 'draft' ? 'gray' : 'red'}>
                      {p.status === 'active' ? 'Aktif' : p.status === 'draft' ? 'Draft' : 'Nonaktif'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Stock Alerts */}
        <Card>
          <CardBody>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Package size={16} className="text-yellow-500" />
              Stok Perlu Diperhatikan
            </h2>
            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Semua stok dalam kondisi baik. 👍</p>
            ) : (
              <div className="space-y-3">
                {outOfStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/umkm/products/${p.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-sm text-gray-900 flex-1 truncate">{p.name}</p>
                    <Badge variant="red">Habis</Badge>
                  </Link>
                ))}
                {lowStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/umkm/products/${p.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                    <p className="text-sm text-gray-900 flex-1 truncate">{p.name}</p>
                    <span className="text-xs text-yellow-600 font-medium">Stok: {p.stock}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardBody>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#2D6A4F]" />
            Aktivitas Terbaru
          </h2>
          {auditLogs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.slice(0, 10).map((log) => {
                const details = log.details as Record<string, unknown> | null
                const actionLabels: Record<string, string> = {
                  create: 'membuat',
                  update: 'memperbarui',
                  delete: 'menghapus',
                  update_stock: 'mengubah stok',
                  update_status: 'mengubah status',
                  reply_review: 'menanggapi ulasan',
                  update_profile: 'memperbarui profil',
                }
                return (
                  <div key={log.id} className="flex items-start gap-3 py-2">
                    <div className="w-8 h-8 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={14} className="text-[#2D6A4F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{actionLabels[log.action] || log.action}</span>{' '}
                        {log.entity_type}{' '}
                        {details?.name && (
                          <span className="font-medium">"{String(details.name)}"</span>
                        )}
                        {log.action === 'update_stock' && details && (
                          <span className="text-gray-500">
                            {' '}dari {String(details.previous_stock)} → {String(details.new_stock)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
