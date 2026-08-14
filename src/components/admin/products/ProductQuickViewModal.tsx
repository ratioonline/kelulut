import { useState, useEffect } from 'react'
import {
  Package,
  Store,
  Tag,
  DollarSign,
  Layers,
  History,
  Pencil,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { supabase } from '../../../lib/supabase'
import type { Product, Umkm, StockMovement } from '../../../types/database'
import { formatCurrency } from '../../../lib/utils'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'

interface ProductQuickViewModalProps {
  product: (Product & { umkm?: Umkm | null }) | null
  open: boolean
  onClose: () => void
  onEdit: (product: Product & { umkm?: Umkm | null }) => void
  onDuplicate: (product: Product & { umkm?: Umkm | null }) => void
  onToggleStatus: (product: Product & { umkm?: Umkm | null }) => void
  onDelete: (product: Product & { umkm?: Umkm | null }) => void
}

export default function ProductQuickViewModal({
  product,
  open,
  onClose,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: ProductQuickViewModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const allImages = [
    product?.image_url,
    ...(product?.images || []),
  ].filter(Boolean) as string[]

  useEffect(() => {
    if (product) {
      setSelectedImage(allImages[0] || null)
      setActiveTab('details')
    }
  }, [product])

  // Lazy-load stock movements history when user clicks History tab
  useEffect(() => {
    if (open && product && activeTab === 'history') {
      const fetchHistory = async () => {
        setLoadingHistory(true)
        const { data } = await supabase
          .from('stock_movements')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setStockHistory((data || []) as StockMovement[])
        setLoadingHistory(false)
      }
      fetchHistory()
    }
  }, [open, product, activeTab])

  if (!product) return null

  const hasDiscount = Boolean(product.discount_price && product.discount_price > 0 && product.discount_price < (product.price || 0))
  const discountPercent = hasDiscount
    ? Math.round((((product.price || 0) - product.discount_price!) / (product.price || 1)) * 100)
    : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick View Produk"
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(product)}
              className="text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              <Copy size={13} />
              <span>Duplikasi</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(product)}
              className="text-gray-700 hover:bg-gray-100"
            >
              {product.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(product)}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 size={13} />
              <span>Hapus</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                onClose()
                onEdit(product)
              }}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              <Pencil size={13} />
              <span>Edit Produk</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Product Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left: Images Carousel/Thumbnails (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            <div className="w-full aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-200/80 flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={48} className="text-gray-300" />
              )}
            </div>

            {/* Thumbnail selector */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                      selectedImage === img
                        ? 'ring-2 ring-[#2D6A4F] border-transparent scale-105'
                        : 'opacity-70 hover:opacity-100 border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Key Info & Stats (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {product.category || 'Umum'}
                </span>
                {product.sku && (
                  <span className="text-[10px] font-mono text-gray-400">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-gray-900 mt-1">{product.name}</h2>

              {/* UMKM Info */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                <Store size={13} className="text-teal-600" />
                <span className="font-semibold">{product.umkm?.name || 'Official Kebun Kelulut'}</span>
                {product.umkm?.owner_name && (
                  <span className="text-gray-400">• Pemilik: {product.umkm.owner_name}</span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Harga Jual</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-emerald-800 font-mono">
                    {formatCurrency(hasDiscount ? product.discount_price! : product.price || 0)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through font-mono">
                      {formatCurrency(product.price || 0)}
                    </span>
                  )}
                </div>
              </div>

              {hasDiscount && (
                <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs">
                  Hemat {discountPercent}%
                </span>
              )}
            </div>

            {/* Stock & Sales Metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Sisa Stok</span>
                <p className="text-base font-black text-gray-900 font-mono mt-0.5">
                  {product.stock} <span className="text-[10px] font-normal">{product.unit || 'pcs'}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Terjual</span>
                <p className="text-base font-black text-emerald-700 font-mono mt-0.5">
                  {product.sold_count || 0} <span className="text-[10px] font-normal">{product.unit || 'pcs'}</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Status</span>
                <p className="text-xs font-bold text-gray-800 capitalize mt-1">
                  {product.status === 'active' ? 'Aktif' : product.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab View: Details vs Stock History */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'details'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Deskripsi & Spesifikasi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <History size={12} />
              <span>Riwayat Stok</span>
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-2.5 text-xs text-gray-700 pt-1">
              {product.short_description && (
                <p className="italic text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  "{product.short_description}"
                </p>
              )}

              {product.description ? (
                <div
                  className="prose prose-sm max-w-none text-gray-800 pt-1 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-gray-400 italic py-2">Belum ada deskripsi lengkap.</p>
              )}

              {product.details && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50">
                  <p className="font-bold text-gray-900 mb-1">Detail Tambahan / Komposisi:</p>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{product.details}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="pt-1">
              {loadingHistory ? (
                <div className="py-6 text-center text-gray-400 text-xs animate-pulse">
                  Memuat riwayat stok...
                </div>
              ) : stockHistory.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {stockHistory.map((h) => (
                    <div key={h.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold font-mono px-1.5 py-0.2 rounded text-[10px] ${
                              h.quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {h.reason || (h.movement_type === 'add' ? 'Restock' : 'Penjualan/Penyesuaian')}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {format(new Date(h.created_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-gray-500 font-mono">
                          Stok: {h.previous_stock} → <strong>{h.new_stock}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-400 text-xs">
                  Belum ada catatan mutasi riwayat stok pada produk ini.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
