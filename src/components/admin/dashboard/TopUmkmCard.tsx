import { Link } from 'react-router-dom'
import { Store, ArrowUpRight, Trophy } from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'

export interface TopUmkmItem {
  id: string
  name: string
  revenue: number
  ordersCount: number
  percentage: number
}

interface TopUmkmCardProps {
  items: TopUmkmItem[]
  loading?: boolean
}

export default function TopUmkmCard({ items, loading }: TopUmkmCardProps) {
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-sm" title="Peringkat 1">🥇</span>
      case 1:
        return <span className="text-sm" title="Peringkat 2">🥈</span>
      case 2:
        return <span className="text-sm" title="Peringkat 3">🥉</span>
      default:
        return (
          <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-600 font-bold text-[9px] flex items-center justify-center font-mono">
            {index + 1}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="space-y-2.5 pt-1">
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
            <div className="p-1.5 rounded-lg bg-teal-100/70 text-teal-800">
              <Trophy size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Top UMKM Mitra</h2>
              <p className="text-[10px] text-gray-400">Peringkat penjualan periode ini</p>
            </div>
          </div>
          <Link
            to="/admin/umkm-management"
            className="text-[11px] font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-0.5 hover:underline"
          >
            <span>Semua</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="mt-3 space-y-2.5">
          {items.length > 0 ? (
            items.slice(0, 5).map((umkm, idx) => (
              <div key={umkm.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{getRankBadge(idx)}</span>
                    <span className="font-bold text-gray-800 truncate">{umkm.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900 font-mono">
                      {formatCurrency(umkm.revenue)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">
                      ({umkm.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-[#2D6A4F] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, umkm.percentage)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-7 text-center text-gray-400">
              <Store size={20} className="mx-auto mb-1 opacity-40" />
              <p className="text-xs font-medium">Belum ada data penjualan UMKM periode ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
