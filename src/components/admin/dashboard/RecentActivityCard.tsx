import { Zap, CalendarCheck, ShoppingBag, Package, FileText } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export interface ActivityItem {
  id: string
  type: 'reservation' | 'order' | 'product' | 'article'
  title: string
  subtitle: string
  timestamp: string
  badge?: string
}

interface RecentActivityCardProps {
  activities: ActivityItem[]
  loading?: boolean
}

export default function RecentActivityCard({ activities, loading }: RecentActivityCardProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'reservation':
        return <CalendarCheck size={13} className="text-blue-600" />
      case 'order':
        return <ShoppingBag size={13} className="text-emerald-600" />
      case 'product':
        return <Package size={13} className="text-orange-600" />
      case 'article':
        return <FileText size={13} className="text-amber-600" />
    }
  }

  const getIconBg = (type: ActivityItem['type']) => {
    switch (type) {
      case 'reservation':
        return 'bg-blue-50 border-blue-200/50'
      case 'order':
        return 'bg-emerald-50 border-emerald-200/50'
      case 'product':
        return 'bg-orange-50 border-orange-200/50'
      case 'article':
        return 'bg-amber-50 border-amber-200/50'
    }
  }

  const formatRelativeTime = (ts: string) => {
    try {
      return formatDistanceToNow(parseISO(ts), { addSuffix: true, locale: idLocale })
    } catch {
      return 'baru saja'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-800">
              <Zap size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Aktivitas Terbaru</h2>
              <p className="text-[10px] text-gray-400">Log pesanan & reservasi masuk</p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="mt-2.5 divide-y divide-gray-100">
          {activities.length > 0 ? (
            activities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="py-2 first:pt-0 last:pb-0 flex items-start gap-2"
              >
                <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${getIconBg(act.type)}`}>
                  {getIcon(act.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{act.title}</p>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{act.subtitle}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-7 text-center text-gray-400">
              <Zap size={20} className="mx-auto mb-1 opacity-40" />
              <p className="text-xs font-medium">Belum ada aktivitas terbaru yang tercatat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
