import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Eye, Package, Plus, Minus, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/Modal'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Product, StockMovement } from '../../types/database'
import toast from 'react-hot-toast'

export default function UmkmProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, myUmkm } = useAuthStore()
  const { deleteProduct, toggleProductStatus, updateStock } = useUmkmStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockQty, setStockQty] = useState(0)
  const [stockType, setStockType] = useState<'add' | 'subtract' | 'set'>('add')
  const [stockReason, setStockReason] = useState('')
  const [stockUpdating, setStockUpdating] = useState(false)

  useEffect(() => {
    if (!id || !myUmkm) return
    setLoading(true)

    Promise.all([
      supabase.from('products').select('*').eq('id', id).eq('umkm_id', myUmkm.id).single(),
      supabase.from('stock_movements').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(20),
    ]).then(([{ data: prod }, { data: moves }]) => {
      if (!prod) {
        toast.error('Produk tidak ditemukan atau bukan milik Anda')
        navigate('/umkm/products')
        return
      }
      setProduct(prod as Product)
      setMovements((moves ?? []) as StockMovement[])
      setLoading(false)
    })
  }, [id, myUmkm, navigate])

  const handleDelete = async () => {
    if (!id || !user || !myUmkm) return
    setDeleting(true)
    const { error } = await deleteProduct(id, user.id, myUmkm.id)
    if (error) toast.error('Gagal menghapus produk')
    else { toast.success('Produk berhasil dihapus'); navigate('/umkm/products') }
    setDeleting(false)
  }

  const handleToggleStatus = async () => {
    if (!product || !user || !myUmkm) return
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    const { error } = await toggleProductStatus(product.id, newStatus, user.id, myUmkm.id)
    if (error) toast.error('Gagal mengubah status')
    else {
      toast.success(`Produk berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`)
      setProduct({ ...product, status: newStatus as Product['status'], is_available: newStatus === 'active' })
    }
  }

  const handleStockUpdate = async () => {
    if (!product || !user || !myUmkm) return
    setStockUpdating(true)
    const { error } = await updateStock(product.id, stockQty, stockType, stockReason, user.id, myUmkm.id)
    if (error) toast.error('Gagal memperbarui stok')
    else {
      toast.success('Stok berhasil diperbarui')
      // Refresh
      const { data: updated } = await supabase.from('products').select('*').eq('id', product.id).single()
      if (updated) setProduct(updated as Product)
      const { data: moves } = await supabase.from('stock_movements').select('*').eq('product_id', product.id).order('created_at', { ascending: false }).limit(20)
      setMovements((moves ?? []) as StockMovement[])
    }
    setStockUpdating(false)
    setStockModalOpen(false)
    setStockQty(0)
    setStockReason('')
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!product) return null

  const images = [...(product.images?.filter(Boolean) ?? []), ...(product.image_url ? [product.image_url] : [])]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/umkm/products')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.category}{product.sku ? ` · ${product.sku}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/produk/${product.slug}`} target="_blank">
            <Button variant="ghost" size="sm"><Eye size={15} /> Lihat Publik</Button>
          </Link>
          <Link to={`/umkm/products/${product.id}/edit`}>
            <Button variant="outline" size="sm"><Pencil size={15} /> Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {images.length > 0 && (
            <Card>
              <CardBody>
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-xl" />
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-800 mb-3">Deskripsi</h3>
              {product.short_description && (
                <p className="text-sm text-gray-600 mb-3 italic">{product.short_description}</p>
              )}
              <div className="prose text-sm text-gray-700 whitespace-pre-line">
                {product.description || 'Tidak ada deskripsi.'}
              </div>
              {product.details && (
                <>
                  <h4 className="font-semibold text-gray-800 mt-4 mb-2">Detail Tambahan</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{product.details}</p>
                </>
              )}
            </CardBody>
          </Card>

          {/* Stock History */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={16} className="text-[#2D6A4F]" /> Riwayat Stok
                </h3>
                <Button variant="outline" size="sm" onClick={() => setStockModalOpen(true)}>
                  <Package size={14} /> Update Stok
                </Button>
              </div>
              {movements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Belum ada perubahan stok.</p>
              ) : (
                <div className="space-y-2">
                  {movements.map(m => (
                    <div key={m.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.movement_type === 'add' ? 'bg-green-50 text-green-600' : m.movement_type === 'subtract' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {m.movement_type === 'add' ? <Plus size={14} /> : m.movement_type === 'subtract' ? <Minus size={14} /> : <Package size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700">
                          {m.previous_stock} → <strong>{m.new_stock}</strong>
                          <span className="text-gray-400 ml-2">({m.movement_type === 'add' ? '+' : m.movement_type === 'subtract' ? '-' : '='}{m.quantity})</span>
                        </p>
                        {m.reason && <p className="text-xs text-gray-400">{m.reason}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={product.status === 'active' ? 'green' : product.status === 'draft' ? 'gray' : 'red'}>
                  {product.status === 'active' ? 'Aktif' : product.status === 'draft' ? 'Draft' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Harga</span>
                <span className="font-bold text-[#F5A623]">{formatCurrency(product.price ?? 0)}</span>
              </div>
              {product.discount_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Harga Diskon</span>
                  <span className="font-bold text-red-500">{formatCurrency(product.discount_price)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Stok</span>
                <span className={`font-bold ${product.stock === 0 ? 'text-red-500' : product.stock <= (product.minimum_stock ?? 5) ? 'text-yellow-600' : 'text-green-600'}`}>
                  {product.stock} {product.unit}
                </span>
              </div>
              {product.weight_gram && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Berat</span>
                  <span className="text-gray-700">{product.weight_gram}g</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Terjual</span>
                <span className="text-gray-700">{product.sold_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Dibuat</span>
                <span className="text-xs text-gray-400">{formatDate(product.created_at)}</span>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card>
            <CardBody className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setStockModalOpen(true)}>
                <Package size={15} /> Update Stok
              </Button>
              <Button
                variant={product.status === 'active' ? 'ghost' : 'primary'}
                size="sm"
                className="w-full"
                onClick={handleToggleStatus}
              >
                {product.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'} Produk
              </Button>
              <Button variant="danger" size="sm" className="w-full" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={15} /> Hapus Produk
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Stock Update Modal */}
      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title="Update Stok"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStockModalOpen(false)}>Batal</Button>
            <Button onClick={handleStockUpdate} loading={stockUpdating}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Stok saat ini: <strong>{product.stock} {product.unit}</strong></p>
          <div className="flex gap-2">
            {(['add', 'subtract', 'set'] as const).map(t => (
              <button
                key={t}
                onClick={() => setStockType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${stockType === t ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {t === 'add' ? '+ Tambah' : t === 'subtract' ? '- Kurangi' : '= Set'}
              </button>
            ))}
          </div>
          <Input label="Jumlah" type="number" min={0} value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} />
          <Input label="Alasan" placeholder="Opsional: alasan perubahan stok" value={stockReason} onChange={(e) => setStockReason(e.target.value)} />
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        message={`Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
      />
    </div>
  )
}
