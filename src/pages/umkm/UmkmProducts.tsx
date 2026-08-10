import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Pencil, Trash2, Eye, MoreVertical,
  CheckCircle, XCircle, Package, Filter, ImagePlus, Download
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency } from '../../lib/utils'
import { exportToCSV } from '../../lib/exportUtils'
import toast from 'react-hot-toast'

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft'
type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

export default function UmkmProducts() {
  const { user, myUmkm } = useAuthStore()
  const { products, loading, fetchProducts, deleteProduct, toggleProductStatus } = useUmkmStore()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  )
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (myUmkm?.id) fetchProducts(myUmkm.id)
  }, [myUmkm?.id, fetchProducts])

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return ['all', ...Array.from(cats)] as string[]
  }, [products])

  const filtered = useMemo(() => {
    let result = [...products]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    // Stock filter
    if (stockFilter === 'out-of-stock') {
      result = result.filter(p => p.stock === 0)
    } else if (stockFilter === 'low-stock') {
      result = result.filter(p => p.stock > 0 && p.stock <= (p.minimum_stock ?? 5))
    } else if (stockFilter === 'in-stock') {
      result = result.filter(p => p.stock > (p.minimum_stock ?? 5))
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'price-high':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case 'price-low':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case 'stock-high':
        result.sort((a, b) => b.stock - a.stock)
        break
      case 'stock-low':
        result.sort((a, b) => a.stock - b.stock)
        break
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [products, search, statusFilter, stockFilter, categoryFilter, sortBy])

  const handleExport = () => {
    const data = filtered.map(p => ({
      'ID': p.id,
      'SKU': p.sku ?? '-',
      'Nama Produk': p.name,
      'Kategori': p.category ?? '-',
      'Harga': p.price,
      'Harga Diskon': p.discount_price ?? '',
      'Stok': p.stock,
      'Satuan': p.unit,
      'Status': p.status,
      'Terjual': p.sold_count ?? 0,
      'Tanggal Dibuat': new Date(p.created_at).toLocaleString('id-ID')
    }))
    exportToCSV(`Produk_UMKM_${new Date().getTime()}.csv`, data)
    toast.success('Data produk berhasil diexport')
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user || !myUmkm) return
    setDeleting(true)
    const { error } = await deleteProduct(deleteTarget, user.id, myUmkm.id)
    if (error) toast.error('Gagal menghapus: ' + error)
    else toast.success('Produk berhasil dihapus')
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!user || !myUmkm) return
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const { error } = await toggleProductStatus(id, newStatus, user.id, myUmkm.id)
    if (error) toast.error('Gagal mengubah status')
    else toast.success(`Produk berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`)
  }

  const handleBulkAction = async (action: string) => {
    if (!user || !myUmkm || selectedIds.length === 0) return
    for (const id of selectedIds) {
      if (action === 'activate') await toggleProductStatus(id, 'active', user.id, myUmkm.id)
      else if (action === 'deactivate') await toggleProductStatus(id, 'inactive', user.id, myUmkm.id)
      else if (action === 'delete') await deleteProduct(id, user.id, myUmkm.id)
    }
    setSelectedIds([])
    toast.success(`${selectedIds.length} produk berhasil ${action === 'delete' ? 'dihapus' : 'diperbarui'}`)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([])
    else setSelectedIds(filtered.map(p => p.id))
  }

  const getStockBadge = (product: typeof products[0]) => {
    if (product.stock === 0) return <Badge variant="red">Habis</Badge>
    if (product.stock <= (product.minimum_stock ?? 5)) return <Badge variant="yellow">Menipis</Badge>
    return <Badge variant="green">Tersedia</Badge>
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola produk UMKM Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download size={16} /> Export CSV</Button>
          <Link to="/umkm/products/create">
            <Button size="sm"><Plus size={16} /> Tambah Produk</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="draft">Draft</option>
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        >
          <option value="all">Semua Stok</option>
          <option value="in-stock">Tersedia</option>
          <option value="low-stock">Menipis</option>
          <option value="out-of-stock">Habis</option>
        </select>

        {categories.length > 2 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
          >
            <option value="all">Semua Kategori</option>
            {categories.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="price-high">Harga Tertinggi</option>
          <option value="price-low">Harga Terendah</option>
          <option value="stock-high">Stok Terbanyak</option>
          <option value="stock-low">Stok Paling Sedikit</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-sm text-blue-800 font-medium">{selectedIds.length} dipilih</span>
          <button onClick={() => handleBulkAction('activate')} className="text-xs font-semibold text-green-600 hover:underline">Aktifkan</button>
          <button onClick={() => handleBulkAction('deactivate')} className="text-xs font-semibold text-yellow-600 hover:underline">Nonaktifkan</button>
          <button onClick={() => handleBulkAction('delete')} className="text-xs font-semibold text-red-600 hover:underline">Hapus</button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-semibold text-gray-500 hover:underline ml-auto">Batal</button>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">Belum ada produk.</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Mulai tambahkan produk UMKM Anda.</p>
              <Link to="/umkm/products/create">
                <Button size="sm"><Plus size={16} /> Tambah Produk</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded accent-[#2D6A4F]"
                      />
                    </th>
                    {['Produk', 'Harga', 'Stok', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="w-4 h-4 rounded accent-[#2D6A4F]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/umkm/products/${p.id}`} className="flex items-center gap-3 group">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImagePlus size={14} className="text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-[#2D6A4F] transition-colors">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.category ?? 'Tanpa Kategori'}{p.sku ? ` · ${p.sku}` : ''}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#F5A623] whitespace-nowrap">{formatCurrency(p.price ?? 0)}</p>
                        {p.discount_price && (
                          <p className="text-xs text-red-500">{formatCurrency(p.discount_price)}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-700">{p.stock} {p.unit}</p>
                        {getStockBadge(p)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === 'active' ? 'green' : p.status === 'draft' ? 'gray' : 'red'}>
                          {p.status === 'active' ? 'Aktif' : p.status === 'draft' ? 'Draft' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link to={`/umkm/products/${p.id}`} className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/umkm/products/${p.id}/edit`} className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                            title={p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {p.status === 'active' ? <XCircle size={15} /> : <CheckCircle size={15} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Hapus produk ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleting}
      />
    </div>
  )
}
