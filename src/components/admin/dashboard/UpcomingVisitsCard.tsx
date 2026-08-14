import { Link } from 'react-router-dom'
import { CalendarCheck, Clock, Users, ArrowUpRight, CheckCircle2, AlertCircle, CheckCheck } from 'lucide-react'
import type { Reservation } from '../../../types/database'
import { formatDate } from '../../../lib/utils'

interface UpcomingVisitsCardProps {
  reservations: Reservation[]
  loading?: boolean
}

export default function UpcomingVisitsCard({ reservations, loading }: UpcomingVisitsCardProps) {
  const getStatusBadge = (status: Reservation['status']) => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <CalendarCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Kunjungan Terdekat</h2>
              <p className="text-[11px] text-gray-400">Jadwal reservasi mendatang</p>
            </div>
          </div>
          <Link
            to="/admin/reservasi"
            className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-0.5 hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="mt-3 divide-y divide-gray-100">
          {reservations.length > 0 ? (
            reservations.map((r) => (
              <div
                key={r.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={11} className="text-gray-400" />
                    <span>{formatDate(r.visit_date)}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate mt-0.5 group-hover:text-[#2D6A4F] transition-colors">
                    {r.institution ? `${r.institution} (${r.name})` : r.name}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700">
                    <Users size={12} className="text-gray-400" />
                    {r.num_visitors} org
                  </span>
                  {getStatusBadge(r.status)}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400">
              <p className="text-xs font-medium">Tidak ada jadwal kunjungan terdekat</p>
              <Link
                to="/admin/reservasi"
                className="inline-block mt-2 text-[11px] font-semibold text-[#2D6A4F] hover:underline"
              >
                + Tambah Kunjungan Manual
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
