import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { CalendarCheck, Users, ShoppingBag, AlertTriangle, Sparkles } from 'lucide-react'

interface TodaySummaryStripProps {
  todayVisitsCount: number
  todayVisitorsCount: number
  todayOrdersCount: number
  lowStockCount: number
  loading?: boolean
}

export default function TodaySummaryStrip({
  todayVisitsCount,
  todayVisitorsCount,
  todayOrdersCount,
  lowStockCount,
  loading,
}: TodaySummaryStripProps) {
  const todayFormatted = format(new Date(), 'd MMMM yyyy', { locale: idLocale })

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-3 border border-gray-200/70 shadow-2xs animate-pulse flex items-center gap-4">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
    )
  }

  const hasAnyActivity =
    todayVisitsCount > 0 ||
    todayVisitorsCount > 0 ||
    todayOrdersCount > 0 ||
    lowStockCount > 0

  return (
    <div className="bg-gradient-to-r from-emerald-950/[0.03] via-white to-amber-950/[0.02] border border-emerald-900/10 rounded-xl px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Today Date Tag */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="bg-[#1B4332] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
          <Sparkles size={10} className="text-[#F5A623]" />
          TODAY
        </span>
        <span className="font-bold text-gray-800">{todayFormatted}</span>
      </div>

      {/* Right: Metrics Strip */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
        {hasAnyActivity ? (
          <>
            {/* Kunjungan Hari Ini */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50/70 border border-blue-200/50 text-blue-900 font-medium">
              <CalendarCheck size={13} className="text-blue-600 shrink-0" />
              <span>
                <strong className="font-bold font-mono">{todayVisitsCount}</strong> Kunjungan
              </span>
            </div>

            {/* Pengunjung Hari Ini */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/70 border border-emerald-200/50 text-emerald-900 font-medium">
              <Users size={13} className="text-emerald-600 shrink-0" />
              <span>
                <strong className="font-bold font-mono">{todayVisitorsCount}</strong> Pengunjung
              </span>
            </div>

            {/* Pesanan Hari Ini */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50/70 border border-orange-200/50 text-orange-900 font-medium">
              <ShoppingBag size={13} className="text-orange-600 shrink-0" />
              <span>
                <strong className="font-bold font-mono">{todayOrdersCount}</strong> Pesanan
              </span>
            </div>

            {/* Stok Rendah */}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50/70 border border-amber-200/50 text-amber-900 font-medium">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                <span>
                  <strong className="font-bold font-mono">{lowStockCount}</strong> Stok Rendah
                </span>
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-400 font-medium text-[11px]">
            Tidak ada aktivitas kunjungan & transaksi baru hari ini.
          </span>
        )}
      </div>
    </div>
  )
}
