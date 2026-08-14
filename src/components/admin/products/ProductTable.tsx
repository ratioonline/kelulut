import {
  Eye,
  Pencil,
  Copy,
  Trash2,
  Package,
  Store,
  Tag,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Layers,
  Plus,
} from 'lucide-react'
import type { Product, Umkm } from '../../../types/database'
import { formatCurrency } from '../../../lib/utils'

export type ProductWithUmkm = Product & { umkm?: Umkm | null }

interface ProductTableProps {
  products: ProductWithUmkm[]
  loading?: boolean
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onQuickView: (product: ProductWithUmkm) => void
  onEdit: (product: ProductWithUmkm) => void
  onDuplicate: (product: ProductWithUmkm) => void
  onQuickStock: (product: ProductWithUmkm) => void
  onDelete: (product: ProductWithUmkm) => void
  onOpenCreate: () => void
}

export default function ProductTable({
  products,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onQuickView,
  onEdit,
  onDuplicate,
  onQuickStock,
  onDelete,
  onOpenCreate,
}: ProductTableProps) {
  const allSelected = products.length > 0 && selectedIds.length === products.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const getStatusBadge = (product: Product) => {
    if (product.stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={10} />
          STOK HABIS
        </span>
      )
    }

    if (product.stock <= (product.minimum_stock || 5)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={10} />
          STOK RENDAH
        </span>
      )
    }

    switch (product.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={10} />
            Aktif
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
            Draft
          </span>
        )
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Nonaktif
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-3 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center shadow-2xs">
        <Package size={40} className="mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-bold text-gray-900">Belum ada produk</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Tidak ada produk yang cocok dengan kriteria filter atau katalog masih kosong. Tambahkan produk pertama Anda sekarang.
        </p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors shadow-2xs"
        >
          <Plus size={14} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
      {/* ── DESKTOP TABLE VIEW (md and up) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 border-b border-gray-200/70 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={onToggleSelectAll}
                  className="w-3.5 h-3.5 rounded accent-[#2D6A4F] cursor-pointer"
                  aria-label="Pilih semua produk"
                />
              </th>
              <th className="py-3 px-3">Produk</th>
              <th className="py-3 px-3">UMKM / Asal</th>
              <th className="py-3 px-3">Harga</th>
              <th className="py-3 px-3">Stok</th>
              <th className="py-3 px-3 text-center">Terjual</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id)
              const hasDiscount = Boolean(p.discount_price && p.discount_price > 0 && p.discount_price < (p.price || 0))

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50/70 transition-colors group ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p.id)}
                      className="w-3.5 h-3.5 rounded accent-[#2D6A4F] cursor-pointer"
                      aria-label={`Pilih produk ${p.name}`}
                    />
                  </td>

                  {/* Foto + Nama + SKU */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                        {p.image_url || p.images?.[0] ? (
                          <img
                            src={p.image_url || p.images?.[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package size={16} className="text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onQuickView(p)}
                          className="font-bold text-gray-900 hover:text-[#2D6A4F] text-xs truncate text-left block transition-colors"
                        >
                          {p.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                          {p.category && (
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                              {p.category}
                            </span>
                          )}
                          {p.sku && (
                            <span className="font-mono text-gray-400 truncate">
                              SKU: {p.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* UMKM */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {p.umkm ? (
                      <div className="flex items-center gap-1 text-gray-700">
                        <Store size={12} className="text-teal-600 shrink-0" />
                        <span className="font-semibold">{p.umkm.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                        Official
                      </span>
                    )}
                  </td>

                  {/* Harga */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {hasDiscount ? (
                      <div>
                        <span className="font-bold text-emerald-700 font-mono">
                          {formatCurrency(p.discount_price!)}
                        </span>
                        <p className="text-[10px] text-gray-400 line-through font-mono">
                          {formatCurrency(p.price || 0)}
                        </p>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-900 font-mono">
                        {formatCurrency(p.price || 0)}
                      </span>
                    )}
                  </td>

                  {/* Stok + Quick Edit */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono font-bold ${
                          p.stock === 0
                            ? 'text-rose-600'
                            : p.stock <= (p.minimum_stock || 5)
                            ? 'text-amber-600'
                            : 'text-gray-800'
                        }`}
                      >
                        {p.stock} {p.unit || 'pcs'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickStock(p)}
                        className="p-1 text-gray-400 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded transition-colors"
                        title="Update stok cepat"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  </td>

                  {/* Terjual */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-gray-600">
                    {p.sold_count || 0}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {getStatusBadge(p)}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickView(p)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Quick View"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Produk"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicate(p)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Duplikasi Produk"
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD VIEW (below md) ── */}
      <div className="md:hidden divide-y divide-gray-100 p-2 space-y-2">
        {products.map((p) => {
          const isSelected = selectedIds.includes(p.id)
          const hasDiscount = Boolean(p.discount_price && p.discount_price > 0 && p.discount_price < (p.price || 0))

          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border border-gray-200/70 bg-white space-y-2.5 transition-all ${
                isSelected ? 'ring-1 ring-[#2D6A4F] bg-emerald-50/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(p.id)}
                  className="mt-1 w-4 h-4 rounded accent-[#2D6A4F] cursor-pointer shrink-0"
                />

                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                  {p.image_url || p.images?.[0] ? (
                    <img
                      src={p.image_url || p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package size={18} className="text-gray-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-gray-900 text-xs truncate">{p.name}</p>
                    {getStatusBadge(p)}
                  </div>

                  <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                    <Store size={10} className="text-teal-600" />
                    <span>{p.umkm?.name || 'Official Kebun Kelulut'}</span>
                  </p>

                  <div className="flex items-center justify-between mt-1.5">
                    <div>
                      {hasDiscount ? (
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(p.discount_price!)}
                          </span>
                          <span className="text-[9px] text-gray-400 line-through">
                            {formatCurrency(p.price || 0)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900 font-mono text-xs">
                          {formatCurrency(p.price || 0)}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono font-semibold text-gray-700">
                      Stok: {p.stock} {p.unit || 'pcs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Actions Toolbar */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onQuickView(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onQuickStock(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60"
                >
                  Stok
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  className="p-1 text-gray-400 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
