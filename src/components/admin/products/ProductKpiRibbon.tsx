import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export interface ProductKpiStats {
  total: number
  active: number
  lowStock: number
  outOfStock: number
}

interface ProductKpiRibbonProps {
  stats: ProductKpiStats
  loading?: boolean
  selectedStockFilter?: string
  onSelectStockFilter?: (filter: string) => void
}

export default function ProductKpiRibbon({
  stats,
  loading,
  selectedStockFilter,
  onSelectStockFilter,
}: ProductKpiRibbonProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs animate-pulse space-y-2"
          >
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-12 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      id: 'all',
      label: 'Total Produk',
      value: stats.total,
      icon: Package,
      color: 'text-[#2D6A4F]',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'hover:border-emerald-500/40',
      activeBorder: selectedStockFilter === 'all' ? 'ring-2 ring-[#2D6A4F] border-transparent' : '',
    },
    {
      id: 'active',
      label: 'Produk Aktif',
      value: stats.active,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'hover:border-emerald-500/40',
      activeBorder: selectedStockFilter === 'active' ? 'ring-2 ring-emerald-600 border-transparent' : '',
    },
    {
      id: 'low_stock',
      label: 'Stok Rendah',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/70',
      borderColor: 'hover:border-amber-500/40',
      activeBorder: selectedStockFilter === 'low_stock' ? 'ring-2 ring-amber-500 border-transparent' : '',
    },
    {
      id: 'out_of_stock',
      label: 'Stok Habis',
      value: stats.outOfStock,
      icon: XCircle,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50/70',
      borderColor: 'hover:border-rose-500/40',
      activeBorder: selectedStockFilter === 'out_of_stock' ? 'ring-2 ring-rose-500 border-transparent' : '',
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
            onClick={() => onSelectStockFilter && onSelectStockFilter(card.id)}
            className={`text-left bg-white rounded-xl p-3 sm:p-3.5 border border-gray-200/80 shadow-2xs transition-all ${card.borderColor} ${card.activeBorder} group cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.color} shrink-0`}>
                <Icon size={14} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 mt-1 font-mono">
              {card.value.toLocaleString('id-ID')}
              <span className="text-[10px] font-medium text-gray-400 ml-1">item</span>
            </p>
          </button>
        )
      })}
    </div>
  )
}
