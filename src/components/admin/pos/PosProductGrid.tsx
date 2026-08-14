import { useState } from 'react'
import { Search, X, Package, Plus, Check, Store, AlertTriangle } from 'lucide-react'
import type { Product, Umkm } from '../../../types/database'
import { formatCurrency } from '../../../lib/utils'

export type ProductWithUmkm = Product & { umkm?: Umkm | null }

interface PosProductGridProps {
  products: ProductWithUmkm[]
  categories: string[]
  search: string
  onSearchChange: (val: string) => void
  selectedCategory: string
  onCategoryChange: (cat: string) => void
  cartMap: Record<string, number>
  onAddToCart: (product: ProductWithUmkm) => void
  loading?: boolean
}

export default function PosProductGrid({
  products,
  categories,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  cartMap,
  onAddToCart,
  loading,
}: PosProductGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-3 border border-gray-200 space-y-2 animate-pulse">
              <div className="aspect-square bg-gray-100 rounded-xl" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search and Category Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-2xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk kasir (nama, SKU, UMKM)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#2D6A4F] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua Produk
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2D6A4F] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {products.map((p) => {
            const inCartQty = cartMap[p.id] || 0
            const isOutOfStock = (p.stock || 0) <= 0
            const isLowStock = (p.stock || 0) > 0 && (p.stock || 0) <= (p.minimum_stock || 5)
            const hasDiscount = Boolean(p.discount_price && p.discount_price > 0 && p.discount_price < (p.price || 0))
            const effectivePrice = hasDiscount ? p.discount_price! : p.price || 0

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border border-gray-200/80 p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between transition-all group ${
                  isOutOfStock
                    ? 'opacity-60 bg-gray-50/70 border-dashed cursor-not-allowed'
                    : inCartQty > 0
                    ? 'ring-2 ring-[#2D6A4F] border-transparent shadow-xs'
                    : 'hover:border-emerald-500/50 hover:shadow-xs cursor-pointer'
                }`}
                onClick={() => !isOutOfStock && onAddToCart(p)}
              >
                <div>
                  {/* Thumbnail + Badges */}
                  <div className="aspect-square w-full rounded-xl bg-gray-100 overflow-hidden relative border border-gray-100 flex items-center justify-center">
                    {p.image_url || p.images?.[0] ? (
                      <img
                        src={p.image_url || p.images?.[0]}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <Package size={28} className="text-gray-300" />
                    )}

                    {/* In-cart Quantity Badge */}
                    {inCartQty > 0 && (
                      <div className="absolute top-1.5 right-1.5 bg-[#2D6A4F] text-white font-mono font-black text-[11px] w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                        {inCartQty}
                      </div>
                    )}

                    {/* Stock Overlay Badge */}
                    <div className="absolute bottom-1.5 left-1.5">
                      {isOutOfStock ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] shadow-xs">
                          STOK HABIS
                        </span>
                      ) : isLowStock ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] shadow-xs">
                          Sisa {p.stock}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white font-medium text-[9px]">
                          Stok: {p.stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                      <Store size={10} className="text-teal-600 shrink-0" />
                      <span>{p.umkm?.name || 'Official Kebun'}</span>
                    </p>
                    <h3 className="font-bold text-gray-900 text-xs truncate mt-0.5 group-hover:text-[#2D6A4F] transition-colors">
                      {p.name}
                    </h3>
                  </div>
                </div>

                {/* Price & Add Button */}
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                  <div>
                    <span className="font-mono font-black text-emerald-800 text-xs">
                      {formatCurrency(effectivePrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[9px] text-gray-400 line-through font-mono block">
                        {formatCurrency(p.price || 0)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isOutOfStock) onAddToCart(p)
                    }}
                    className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                      isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : inCartQty > 0
                        ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#2D6A4F] hover:text-white'
                    }`}
                    title={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 border border-gray-200/80 text-center text-gray-400 text-xs shadow-2xs">
          <Package size={36} className="mx-auto text-gray-300 mb-2" />
          <span>Tidak ada produk yang cocok dengan kata kunci atau kategori terpilih.</span>
        </div>
      )}
    </div>
  )
}
