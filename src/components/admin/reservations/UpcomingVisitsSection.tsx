import { Calendar, Clock, Users, Building, MessageCircle, Eye, CheckCircle2, AlertCircle, CheckCheck } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Reservation } from '../../../types/database'
import { normalizeWhatsappNumber } from '../umkm/UmkmCardGrid'

interface UpcomingVisitsSectionProps {
  reservations: Reservation[]
  loading?: boolean
  onQuickView: (reservation: Reservation) => void
}

export const extractDepartureTime = (res: Reservation): string => {
  // If notes contain explicit Jam pattern
  if (res.notes) {
    const match = res.notes.match(/(?:jam|pukul|waktu)[:\s]+([0-2]?[0-9]:[0-5][0-9])/i)
    if (match && match[1]) return match[1]
  }
  return '09:00'
}

export const getRelativeDateBadge = (dateStr: string) => {
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) {
      return { label: 'HARI INI', bg: 'bg-emerald-600 text-white font-black' }
    }
    if (isTomorrow(d)) {
      return { label: 'BESOK', bg: 'bg-blue-600 text-white font-bold' }
    }
    const days = differenceInCalendarDays(d, new Date())
    if (days > 1 && days <= 7) {
      return { label: `${days} HARI LAGI`, bg: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' }
    }
    return { label: format(d, 'd MMM yyyy', { locale: idLocale }), bg: 'bg-gray-100 text-gray-700 font-semibold' }
  } catch {
    return { label: 'JADWAL', bg: 'bg-gray-100 text-gray-700 font-semibold' }
  }
}

export default function UpcomingVisitsSection({
  reservations,
  loading,
  onQuickView,
}: UpcomingVisitsSectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs text-center">
        <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-xs font-bold text-gray-800">Belum ada jadwal kunjungan mendatang</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Semua jadwal yang terdaftar sudah selesai atau belum ada pemesanan baru.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100/80 text-emerald-800">
            <Calendar size={15} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">📅 Kunjungan Terdekat</h2>
            <p className="text-[10px] text-gray-400">Jadwal rombongan yang akan segera tiba</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          {reservations.length} Jadwal Mendatang
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {reservations.slice(0, 5).map((r) => {
          const badge = getRelativeDateBadge(r.visit_date)
          const timeStr = extractDepartureTime(r)
          const waNum = normalizeWhatsappNumber(r.phone)
          const waLink = waNum ? `https://wa.me/${waNum}` : null

          return (
            <div
              key={r.id}
              className="p-3 rounded-xl border border-gray-200/80 hover:border-emerald-500/40 bg-gray-50/40 hover:bg-white transition-all space-y-2.5 flex flex-col justify-between group"
            >
              <div>
                {/* Badge + Time */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded tracking-wide ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-700 flex items-center gap-1">
                    <Clock size={11} className="text-gray-400" />
                    {timeStr} WITA
                  </span>
                </div>

                {/* Institution & Coordinator */}
                <div className="mt-2">
                  <h3 className="font-bold text-gray-900 text-xs truncate group-hover:text-[#2D6A4F] transition-colors">
                    {r.institution || r.name}
                  </h3>
                  {r.institution && (
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      PIC: {r.name}
                    </p>
                  )}
                </div>

                {/* Count & Status */}
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100">
                  <span className="font-mono font-bold text-gray-800 flex items-center gap-1 text-[11px]">
                    <Users size={12} className="text-emerald-700" />
                    {r.num_visitors} Orang
                  </span>

                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      r.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.status === 'done'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : r.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {r.status === 'confirmed' && <CheckCircle2 size={9} />}
                    {r.status === 'done' && <CheckCheck size={9} />}
                    {r.status === 'pending' && <AlertCircle size={9} />}
                    {r.status === 'confirmed'
                      ? 'Dikonfirmasi'
                      : r.status === 'done'
                      ? 'Selesai'
                      : r.status === 'cancelled'
                      ? 'Batal'
                      : 'Menunggu'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Hubungi Koordinator via WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onQuickView(r)}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#2D6A4F] transition-colors"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
