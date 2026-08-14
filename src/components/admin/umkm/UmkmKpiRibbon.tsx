import { Store, CheckCircle2, Package, DollarSign } from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'

export interface UmkmKpiStats {
  totalUmkm: number
  activeUmkm: number
  totalProducts: number
  totalSales: number
}

interface UmkmKpiRibbonProps {
  stats: UmkmKpiStats
  loading?: boolean
  selectedFilter?: string
  onSelectFilter?: (filter: string) => void
}

export default function UmkmKpiRibbon({
  stats,
  loading,
  selectedFilter,
  onSelectFilter,
}: UmkmKpiRibbonProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs animate-pulse space-y-2"
          >
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      id: 'all',
      label: 'Total Mitra UMKM',
      value: `${stats.totalUmkm} Mitra`,
      sub: 'Terdaftar di sistem',
      icon: Store,
      color: 'text-[#2D6A4F]',
      bgColor: 'bg-emerald-50/70',
      activeBorder: selectedFilter === 'all' ? 'ring-2 ring-[#2D6A4F] border-transparent' : '',
    },
    {
      id: 'active',
      label: 'UMKM Aktif',
      value: `${stats.activeUmkm} Mitra`,
      sub: 'Beroperasi & jualan',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/70',
      activeBorder: selectedFilter === 'active' ? 'ring-2 ring-emerald-600 border-transparent' : '',
    },
    {
      id: 'products',
      label: 'Katalog Produk',
      value: `${stats.totalProducts} Item`,
      sub: 'Semua produk mitra',
      icon: Package,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50/70',
      activeBorder: selectedFilter === 'products' ? 'ring-2 ring-blue-600 border-transparent' : '',
    },
    {
      id: 'sales',
      label: 'Total Penjualan',
      value: formatCurrency(stats.totalSales),
      sub: 'Akumulasi omzet mitra',
      icon: DollarSign,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/70',
      activeBorder: selectedFilter === 'sales' ? 'ring-2 ring-amber-500 border-transparent' : '',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(card.id)}
            className={`text-left bg-white rounded-xl p-3 sm:p-3.5 border border-gray-200/80 shadow-2xs transition-all hover:border-emerald-500/40 ${card.activeBorder} cursor-pointer group`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.color} shrink-0`}>
                <Icon size={14} />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1 font-mono truncate">
              {card.value}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
          </button>
        )
      })}
    </div>
  )
}
