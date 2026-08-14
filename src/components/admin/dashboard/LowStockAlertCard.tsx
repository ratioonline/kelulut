import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Package, CheckCircle2 } from 'lucide-react'
import type { Product } from '../../../types/database'

interface LowStockAlertCardProps {
  products: Product[]
  loading?: boolean
}

export default function LowStockAlertCard({ products, loading }: LowStockAlertCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="space-y-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl" />
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
            <div className="p-1.5 rounded-lg bg-rose-100/70 text-rose-800">
              <AlertTriangle size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Stok Perlu Diperhatikan</h2>
              <p className="text-[10px] text-gray-400">Inventaris realtime menipis</p>
            </div>
          </div>
          <Link
            to="/admin/produk"
            className="text-[11px] font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-0.5 hover:underline"
          >
            <span>Kelola Stok</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="mt-2.5 divide-y divide-gray-100">
          {products.length > 0 ? (
            products.slice(0, 4).map((p) => {
              const minStock = p.minimum_stock || 10
              const isCritical = p.stock <= 3
              const stockPercentage = Math.min(100, Math.round((p.stock / Math.max(1, minStock * 1.5)) * 100))

              return (
                <div
                  key={p.id}
                  className="py-2 first:pt-0 last:pb-0 flex flex-col gap-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package size={11} className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#2D6A4F] transition-colors">
                        {p.name}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">
                        Batas min: {minStock}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {p.stock} {p.unit || 'pcs'}
                      </span>
                    </div>
                  </div>

                  {/* Stock progress indicator */}
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(6, stockPercentage)}%` }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-7 text-center text-gray-400">
              <CheckCircle2 size={22} className="mx-auto mb-1 text-emerald-500 opacity-80" />
              <p className="text-xs font-medium text-gray-600">Semua stok produk aman</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Tidak ada item di bawah batas minimum</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
