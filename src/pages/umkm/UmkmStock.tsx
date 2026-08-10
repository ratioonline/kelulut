import { useEffect, useState } from 'react'
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUmkmStore } from '../../stores/umkmStore'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function UmkmStock() {
  const { user, myUmkm } = useAuthStore()
  const { products, loading, fetchProducts, updateStock } = useUmkmStore()

  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [stockQty, setStockQty] = useState(0)
  const [stockType, setStockType] = useState<'add' | 'subtract' | 'set'>('add')
  const [stockReason, setStockReason] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (myUmkm?.id) fetchProducts(myUmkm.id)
  }, [myUmkm?.id, fetchProducts])

  const openStockModal = (productId: string) => {
    setSelectedProductId(productId)
    setStockQty(0)
    setStockType('add')
    setStockReason('')
    setStockModalOpen(true)
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)

  const handleStockUpdate = async () => {
    if (!selectedProductId || !user || !myUmkm) return
    setUpdating(true)
    const { error } = await updateStock(selectedProductId, stockQty, stockType, stockReason, user.id, myUmkm.id)
    if (error) toast.error('Gagal memperbarui stok')
    else toast.success('Stok berhasil diperbarui')
    setUpdating(false)
    setStockModalOpen(false)
  }

  const outOfStock = products.filter(p => p.stock === 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.minimum_stock ?? 5))
  const normalStock = products.filter(p => p.stock > (p.minimum_stock ?? 5))

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola stok produk UMKM Anda.</p>
      </div>

      {/* Alerts */}
      {outOfStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700"><strong>{outOfStock.length}</strong> produk stok habis</p>
        </div>
      )}

      {/* Out of Stock */}
      {outOfStock.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-4">
              <Package size={16} /> Stok Habis ({outOfStock.length})
            </h3>
            <div className="space-y-2">
              {outOfStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <Badge variant="red">0 {p.unit}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openStockModal(p.id)}>
                    <Plus size={14} /> Tambah
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-semibold text-yellow-600 flex items-center gap-2 mb-4">
              <AlertTriangle size={16} /> Stok Menipis ({lowStock.length})
            </h3>
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category} · Min: {p.minimum_stock}</p>
                  </div>
                  <Badge variant="yellow">{p.stock} {p.unit}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openStockModal(p.id)}>
                    <Plus size={14} /> Tambah
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Normal Stock */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Package size={16} className="text-green-500" /> Stok Normal ({normalStock.length})
          </h3>
          {normalStock.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Tidak ada produk dengan stok normal.</p>
          ) : (
            <div className="space-y-2">
              {normalStock.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <Badge variant="green">{p.stock} {p.unit}</Badge>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedProductId(p.id); setStockType('add'); setStockQty(1); handleQuickStock(p.id, 1, 'add') }} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Tambah 1">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => { handleQuickStock(p.id, 1, 'subtract') }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Kurangi 1">
                      <Minus size={14} />
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => openStockModal(p.id)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stock Update Modal */}
      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`Update Stok — ${selectedProduct?.name ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setStockModalOpen(false)}>Batal</Button>
            <Button onClick={handleStockUpdate} loading={updating}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Stok saat ini: <strong>{selectedProduct?.stock ?? 0} {selectedProduct?.unit}</strong></p>
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
          <Input label="Alasan" placeholder="Opsional: restock, penjualan offline, koreksi..." value={stockReason} onChange={(e) => setStockReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  )

  async function handleQuickStock(productId: string, qty: number, type: 'add' | 'subtract') {
    if (!user || !myUmkm) return
    const { error } = await updateStock(productId, qty, type, 'Quick update', user.id, myUmkm.id)
    if (error) toast.error('Gagal')
    else toast.success('Stok diperbarui')
  }
}
