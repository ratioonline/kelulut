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
        return <span className="text-base" title="Peringkat 1">🥇</span>
      case 1:
        return <span className="text-base" title="Peringkat 2">🥈</span>
      case 2:
        return <span className="text-base" title="Peringkat 3">🥉</span>
      default:
        return (
          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px] flex items-center justify-center">
            {index + 1}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl" />
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
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Trophy size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Top UMKM Mitra</h2>
              <p className="text-[11px] text-gray-400">Peringkat penjualan periode ini</p>
            </div>
          </div>
          <Link
            to="/admin/umkm-management"
            className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-0.5 hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="mt-3.5 space-y-3">
          {items.length > 0 ? (
            items.map((umkm, idx) => (
              <div key={umkm.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{getRankBadge(idx)}</span>
                    <span className="font-bold text-gray-800 truncate">{umkm.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900 font-mono">
                      {formatCurrency(umkm.revenue)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1.5">
                      ({umkm.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-[#2D6A4F] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, umkm.percentage)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400">
              <Store size={24} className="mx-auto mb-1 opacity-40" />
              <p className="text-xs font-medium">Belum ada transaksi UMKM pada periode ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
