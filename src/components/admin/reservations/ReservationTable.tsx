import {
  Calendar,
  Clock,
  User,
  Users,
  Building,
  Phone,
  MessageCircle,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  XCircle,
  Plus,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Reservation } from '../../../types/database'
import { normalizeWhatsappNumber } from '../umkm/UmkmCardGrid'
import { extractDepartureTime, getRelativeDateBadge } from './UpcomingVisitsSection'

interface ReservationTableProps {
  reservations: Reservation[]
  loading?: boolean
  onQuickView: (reservation: Reservation) => void
  onEdit: (reservation: Reservation) => void
  onUpdateStatus: (reservation: Reservation, newStatus: Reservation['status']) => void
  onDelete: (reservation: Reservation) => void
  onOpenCreate: () => void
}

export const getStatusBadge = (status: Reservation['status']) => {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} />
          Dikonfirmasi
        </span>
      )
    case 'done':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCheck size={10} />
          Selesai
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={10} />
          Dibatalkan
        </span>
      )
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle size={10} />
          Menunggu
        </span>
      )
  }
}

export const inferVisitorType = (res: Reservation): string => {
  const text = `${res.name || ''} ${res.institution || ''} ${res.notes || ''}`.toLowerCase()
  if (text.includes('sd') || text.includes('tk') || text.includes('smp') || text.includes('sma') || text.includes('smk') || text.includes('universitas') || text.includes('kampus') || text.includes('sekolah') || text.includes('paud')) {
    return 'Sekolah'
  }
  if (text.includes('dinas') || text.includes('kementerian') || text.includes('kantor') || text.includes('kelurahan') || text.includes('kecamatan') || text.includes('desa') || text.includes('balai')) {
    return 'Instansi'
  }
  if (text.includes('pt') || text.includes('cv') || text.includes('corp') || text.includes('perusahaan') || text.includes('tbk') || text.includes('ltd')) {
    return 'Perusahaan'
  }
  if (text.includes('komunitas') || text.includes('klub') || text.includes('paguyuban') || text.includes('organisasi') || text.includes('rombongan')) {
    return 'Komunitas'
  }
  return 'Umum'
}

export default function ReservationTable({
  reservations,
  loading,
  onQuickView,
  onEdit,
  onUpdateStatus,
  onDelete,
  onOpenCreate,
}: ReservationTableProps) {
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

  if (reservations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center shadow-2xs">
        <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
        <h3 className="text-sm font-bold text-gray-900">Tidak ada data reservasi</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Tidak ada kunjungan yang cocok dengan kriteria filter saat ini.
        </p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors shadow-2xs"
        >
          <Plus size={14} />
          <span>Tambah Reservasi Manual</span>
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
              <th className="py-3 px-3.5">Tanggal & Jam</th>
              <th className="py-3 px-3">Koordinator</th>
              <th className="py-3 px-3">Instansi / Rombongan</th>
              <th className="py-3 px-3">Jenis</th>
              <th className="py-3 px-3 text-center">Jumlah</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {reservations.map((r) => {
              const badge = getRelativeDateBadge(r.visit_date)
              const timeStr = extractDepartureTime(r)
              const visitorType = inferVisitorType(r)
              const waNum = normalizeWhatsappNumber(r.phone)
              const waLink = waNum ? `https://wa.me/${waNum}` : null

              return (
                <tr key={r.id} className="hover:bg-gray-50/70 transition-colors group">
                  {/* Tanggal & Jam */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded tracking-wide font-bold ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono text-gray-700 font-bold flex items-center gap-1 text-[11px]">
                        <Clock size={11} className="text-gray-400" />
                        {timeStr}
                      </span>
                    </div>
                  </td>

                  {/* Koordinator */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div>
                      <button
                        type="button"
                        onClick={() => onQuickView(r)}
                        className="font-bold text-gray-900 hover:text-[#2D6A4F] text-xs text-left block transition-colors"
                      >
                        {r.name}
                      </button>
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone size={10} className="text-gray-300" />
                        {r.phone}
                      </span>
                    </div>
                  </td>

                  {/* Instansi */}
                  <td className="py-2.5 px-3">
                    <div className="max-w-[200px] truncate">
                      <span className="font-semibold text-gray-800 text-xs">
                        {r.institution || '-'}
                      </span>
                    </div>
                  </td>

                  {/* Jenis Pengunjung */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-700">
                      {visitorType}
                    </span>
                  </td>

                  {/* Jumlah Pengunjung */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {r.num_visitors} org
                    </span>
                  </td>

                  {/* Status Dropdown / Badge */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <select
                      value={r.status}
                      onChange={(e) => onUpdateStatus(r, e.target.value as Reservation['status'])}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                        r.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : r.status === 'done'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : r.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <option value="pending">Menunggu</option>
                      <option value="confirmed">Dikonfirmasi</option>
                      <option value="done">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onQuickView(r)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Reservasi"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Reservasi"
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
        {reservations.map((r) => {
          const badge = getRelativeDateBadge(r.visit_date)
          const timeStr = extractDepartureTime(r)
          const visitorType = inferVisitorType(r)
          const waNum = normalizeWhatsappNumber(r.phone)
          const waLink = waNum ? `https://wa.me/${waNum}` : null

          return (
            <div
              key={r.id}
              className="p-3 rounded-xl border border-gray-200/70 bg-white space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-gray-700 flex items-center gap-1">
                      <Clock size={10} className="text-gray-400" />
                      {timeStr}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs mt-1">
                    {r.institution || r.name}
                  </h3>
                  {r.institution && (
                    <p className="text-[10px] text-gray-500">PIC: {r.name}</p>
                  )}
                </div>

                <div className="text-right">
                  {getStatusBadge(r.status)}
                  <p className="text-xs font-black text-emerald-800 font-mono mt-1">
                    {r.num_visitors} Orang
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">
                  {visitorType}
                </span>

                <div className="flex items-center gap-1.5">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                    >
                      <MessageCircle size={12} />
                      <span>WA</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onQuickView(r)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="p-1 text-gray-400 hover:text-emerald-700"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    className="p-1 text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
