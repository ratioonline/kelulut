import { Store, User, MapPin, Phone, Eye, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, Package, DollarSign, ShoppingCart, MessageCircle } from 'lucide-react'
import type { Umkm } from '../../../types/database'
import { formatCurrency } from '../../../lib/utils'

export interface UmkmWithStats extends Umkm {
  product_count: number
  total_sales: number
  transactions_count: number
}

interface UmkmCardGridProps {
  umkms: UmkmWithStats[]
  loading?: boolean
  onQuickView: (umkm: UmkmWithStats) => void
  onEdit: (umkm: UmkmWithStats) => void
  onToggleStatus: (umkm: UmkmWithStats) => void
  onDelete: (umkm: UmkmWithStats) => void
  onOpenCreate: () => void
}

export const normalizeWhatsappNumber = (rawPhone?: string | null): string => {
  if (!rawPhone) return ''
  let cleaned = rawPhone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

export default function UmkmCardGrid({
  umkms,
  loading,
  onQuickView,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpenCreate,
}: UmkmCardGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-14 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (umkms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center shadow-2xs">
        <Store size={44} className="mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-bold text-gray-900">Belum ada mitra UMKM</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Tidak ada mitra UMKM yang sesuai dengan filter atau database masih kosong. Daftarkan mitra UMKM baru sekarang.
        </p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors shadow-2xs"
        >
          <Plus size={14} />
          <span>Tambah Mitra UMKM</span>
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
      {umkms.map((u) => {
        const waNumber = normalizeWhatsappNumber(u.whatsapp)
        const waLink = waNumber ? `https://wa.me/${waNumber}` : null
        const isActive = u.status === 'active'

        return (
          <div
            key={u.id}
            className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:border-emerald-500/40 hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Header Cover Banner (if any) or Subtle Top Strip */}
              <div className="h-16 w-full bg-linear-to-r from-[#2D6A4F]/15 via-emerald-600/10 to-teal-600/20 relative overflow-hidden">
                {u.cover_image && (
                  <img
                    src={u.cover_image}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                {/* Status Badge on Cover */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs backdrop-blur-xs ${
                      isActive
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-700/80 text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {/* Identity Section */}
              <div className="px-4 pt-0 pb-3 -mt-6">
                <div className="flex items-end justify-between gap-2">
                  {/* Logo Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-xs border border-gray-200/70 overflow-hidden shrink-0">
                    {u.logo ? (
                      <img
                        src={u.logo}
                        alt={u.name}
                        className="w-full h-full object-cover rounded-[14px]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2D6A4F] rounded-[14px] flex items-center justify-center text-white font-black text-base">
                        {u.name ? u.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Quick Icon */}
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition-colors"
                      title="Hubungi via WhatsApp"
                    >
                      <MessageCircle size={11} className="text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                <div className="mt-2.5">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#2D6A4F] transition-colors truncate">
                    {u.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1 truncate">
                      <User size={11} className="text-gray-400 shrink-0" />
                      {u.owner_name || 'Pemilik Belum Diset'}
                    </span>
                    {u.city && (
                      <span className="flex items-center gap-1 text-gray-400 truncate">
                        • <MapPin size={11} className="shrink-0" />
                        {u.city}
                      </span>
                    )}
                  </div>

                  {u.short_description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {u.short_description}
                    </p>
                  )}
                </div>

                {/* Metrics 3-box strip */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Produk</span>
                    <span className="text-xs font-black text-gray-900 font-mono">
                      {u.product_count || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Penjualan</span>
                    <span className="text-xs font-black text-emerald-800 font-mono">
                      {formatCurrency(u.total_sales || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Transaksi</span>
                    <span className="text-xs font-black text-gray-700 font-mono">
                      {u.transactions_count || 0} trx
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions Footer */}
            <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => onQuickView(u)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#2D6A4F] transition-colors shadow-2xs flex items-center gap-1"
              >
                <Eye size={12} />
                <span>Detail</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(u)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  title="Edit Profil UMKM"
                >
                  <Pencil size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus(u)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                  title={isActive ? 'Nonaktifkan UMKM' : 'Aktifkan UMKM'}
                >
                  {isActive ? <ToggleRight size={15} className="text-emerald-600" /> : <ToggleLeft size={15} />}
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(u)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Hapus / Arsip UMKM"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
