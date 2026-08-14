import { useState, useEffect } from 'react'
import type { Product } from '../../../types/database'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

interface QuickStockModalProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onSave: (product: Product, newStock: number, reason: string) => Promise<void>
}

const REASON_PRESETS = [
  'Restock produk masuk',
  'Koreksi stok fisik / opname',
  'Barang rusak / kedaluwarsa',
  'Penjualan offline / event',
  'Retur dari pembeli',
]

export default function QuickStockModal({
  product,
  open,
  onClose,
  onSave,
}: QuickStockModalProps) {
  const [newStock, setNewStock] = useState<number>(0)
  const [reason, setReason] = useState<string>('Restock produk masuk')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (product) {
      setNewStock(product.stock || 0)
      setReason('Restock produk masuk')
    }
  }, [product, open])

  if (!product) return null

  const difference = newStock - (product.stock || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(product, newStock, reason)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Stok Cepat"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            form="quick-stock-form"
            type="submit"
            loading={isSubmitting}
            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
          >
            Simpan Stok
          </Button>
        </div>
      }
    >
      <form id="quick-stock-form" onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 text-xs">
          <p className="font-bold text-gray-900">{product.name}</p>
          <div className="flex items-center justify-between text-gray-500 mt-1">
            <span>Stok saat ini:</span>
            <span className="font-bold text-gray-900 font-mono">
              {product.stock} {product.unit || 'pcs'}
            </span>
          </div>
        </div>

        <Input
          label="Jumlah Stok Baru *"
          type="number"
          min={0}
          required
          value={newStock}
          onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
        />

        {difference !== 0 && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-gray-500">Perubahan stok:</span>
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                difference > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {difference > 0 ? `+${difference}` : difference} {product.unit || 'pcs'}
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Alasan Perubahan Stok
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Restock barang masuk"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] text-xs font-medium"
          />
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {REASON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  reason === preset
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
