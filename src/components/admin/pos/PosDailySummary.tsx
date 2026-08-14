import { ShoppingBag, DollarSign, Package, UserCheck } from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'

export interface PosDailyMetrics {
  totalTrxToday: number
  totalRevenueToday: number
  totalItemsToday: number
  cashierName: string
}

interface PosDailySummaryProps {
  metrics: PosDailyMetrics
  loading?: boolean
}

export default function PosDailySummary({ metrics, loading }: PosDailySummaryProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-6 w-24 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const items = [
    {
      label: 'Transaksi Hari Ini',
      value: `${metrics.totalTrxToday} Trx`,
      sub: 'Penjualan kasir offline',
      icon: ShoppingBag,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Omzet Penjualan Hari Ini',
      value: formatCurrency(metrics.totalRevenueToday),
      sub: 'Total kas masuk hari ini',
      icon: DollarSign,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Item Produk Terjual',
      value: `${metrics.totalItemsToday} Pcs`,
      sub: 'Akumulasi unit produk',
      icon: Package,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Petugas Kasir Aktif',
      value: metrics.cashierName || 'Kasir Kebun',
      sub: 'Sesi login admin',
      icon: UserCheck,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
    },
  ]

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs">
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
  )
}
