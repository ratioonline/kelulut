import { CalendarCheck, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export interface ReservationTodayMetrics {
  todayVisitsCount: number
  todayVisitorsCount: number
  nextVisitTime: string | null
  nextVisitName: string | null
  confirmedCount: number
  pendingCount: number
}

interface ReservationTodayStripProps {
  metrics: ReservationTodayMetrics
  loading?: boolean
  onFilterPending?: () => void
}

export default function ReservationTodayStrip({
  metrics,
  loading,
  onFilterPending,
}: ReservationTodayStripProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-6 w-28 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const items = [
    {
      label: 'Kunjungan Hari Ini',
      value: `${metrics.todayVisitsCount} Kunjungan`,
      sub: metrics.todayVisitsCount > 0 ? 'Terjadwal untuk hari ini' : 'Tidak ada kunjungan hari ini',
      icon: CalendarCheck,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Total Pengunjung Hari Ini',
      value: `${metrics.todayVisitorsCount} Orang`,
      sub: 'Estimasi jumlah pengunjung',
      icon: Users,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Kunjungan Berikutnya',
      value: metrics.nextVisitTime ? `${metrics.nextVisitTime} WITA` : '-',
      sub: metrics.nextVisitName ? metrics.nextVisitName : 'Belum ada jadwal terdekat',
      icon: Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Reservasi Dikonfirmasi',
      value: `${metrics.confirmedCount} Sesi`,
      sub: `${metrics.pendingCount} menunggu konfirmasi`,
      icon: CheckCircle2,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
    },
  ]

  return (
    <div className="space-y-2">
      {/* Alert if there are pending reservations */}
      {metrics.pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>
              Terdapat <strong>{metrics.pendingCount} reservasi baru</strong> yang menunggu konfirmasi admin.
            </span>
          </div>
          {onFilterPending && (
            <button
              type="button"
              onClick={onFilterPending}
              className="text-amber-900 font-bold hover:underline shrink-0 text-[11px]"
            >
              Lihat Menunggu →
            </button>
          )}
        </div>
      )}

      {/* Main Today Metric 4-Box Grid */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-700">
            HARI INI • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {items.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`flex items-start gap-2.5 ${
                  idx > 0 ? 'pt-2.5 sm:pt-0 sm:pl-3.5' : ''
                }`}
              >
                <div className={`p-2 rounded-xl ${item.bgColor} ${item.color} shrink-0`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block truncate">
                    {item.label}
                  </span>
                  <p className="text-base sm:text-lg font-black text-gray-900 font-mono truncate mt-0.5">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
