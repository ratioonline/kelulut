import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowUpRight, Package, Sparkles } from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'

export interface TopProductItem {
  id: string
  name: string
  image_url: string | null
  umkm_name?: string
  quantitySold: number
  revenue: number
  stock: number
  percentage: number
}

interface TopProductsCardProps {
  items: TopProductItem[]
  loading?: boolean
}

type SortBy = 'quantity' | 'revenue'

export default function TopProductsCard({ items, loading }: TopProductsCardProps) {
  const [sortBy, setSortBy] = useState<SortBy>('quantity')

  const sortedItems = [...items].sort((a, b) =>
    sortBy === 'quantity' ? b.quantitySold - a.quantitySold : b.revenue - a.revenue
  )

  const maxVal = Math.max(
    1,
    ...sortedItems.map((i) => (sortBy === 'quantity' ? i.quantitySold : i.revenue))
  )

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-5 w-24 bg-gray-100 rounded" />
        </div>
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
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-orange-100/70 text-orange-800 shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">Produk Terlaris</h2>
              <p className="text-[10px] text-gray-400 truncate">Peringkat penjualan produk</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px] font-semibold border border-gray-200/50">
              <button
                type="button"
                onClick={() => setSortBy('quantity')}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  sortBy === 'quantity'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Unit
              </button>
              <button
                type="button"
                onClick={() => setSortBy('revenue')}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  sortBy === 'revenue'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Omzet
              </button>
            </div>

            <Link
              to="/admin/produk"
              className="text-[11px] font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-0.5 hover:underline"
            >
              <span>Semua</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          {sortedItems.length > 0 ? (
            sortedItems.slice(0, 5).map((prod, idx) => {
              const currentVal = sortBy === 'quantity' ? prod.quantitySold : prod.revenue
              const progressPct = Math.round((currentVal / maxVal) * 100)

              return (
                <div key={prod.id} className="space-y-1 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-black text-gray-400 w-3.5 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Small thumbnail */}
                      <div className="w-6 h-6 rounded-md bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package size={11} className="text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate group-hover:text-[#2D6A4F] transition-colors">
                          {prod.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 font-mono">
                        {sortBy === 'quantity'
                          ? `${prod.quantitySold} pcs`
                          : formatCurrency(prod.revenue)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-[#F5A623] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, progressPct)}%` }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-7 text-center text-gray-400">
              <ShoppingBag size={20} className="mx-auto mb-1 opacity-40" />
              <p className="text-xs font-medium">Belum ada produk terjual pada periode ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
