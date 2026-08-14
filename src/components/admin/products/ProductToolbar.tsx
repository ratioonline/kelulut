import { Search, X, RotateCcw, ArrowUpDown, Filter, CheckSquare, Trash2, Power, PowerOff } from 'lucide-react'
import type { Umkm } from '../../../types/database'

export interface ProductFilterState {
  search: string
  umkmId: string
  category: string
  status: string
  stockFilter: string
  sortBy: string
}

interface ProductToolbarProps {
  filters: ProductFilterState
  onChangeFilters: (filters: Partial<ProductFilterState>) => void
  onResetFilters: () => void
  umkmList: Umkm[]
  categories: string[]
  role: string | null
  selectedCount: number
  onBulkActivate?: () => void
  onBulkDeactivate?: () => void
  onBulkDelete?: () => void
}

export default function ProductToolbar({
  filters,
  onChangeFilters,
  onResetFilters,
  umkmList,
  categories,
  role,
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
}: ProductToolbarProps) {
  const isFilterActive =
    Boolean(filters.search) ||
    filters.umkmId !== 'all' ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.stockFilter !== 'all' ||
    filters.sortBy !== 'created_at_desc'

  return (
    <div className="space-y-2.5">
      {/* Main Search and Quick Filters Bar */}
      <div className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama produk, SKU, atau kategori..."
              value={filters.search}
              onChange={(e) => onChangeFilters({ search: e.target.value })}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onChangeFilters({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                title="Hapus pencarian"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* UMKM Filter (Only for super_admin & proktor) */}
            {role !== 'umkm_user' && (
              <select
                value={filters.umkmId}
                onChange={(e) => onChangeFilters({ umkmId: e.target.value })}
                className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
              >
                <option value="all">Semua UMKM</option>
                <option value="official">Official Kebun Kelulut</option>
                {umkmList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => onChangeFilters({ category: e.target.value })}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => onChangeFilters({ status: e.target.value })}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="inactive">Nonaktif</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={filters.sortBy}
                onChange={(e) => onChangeFilters({ sortBy: e.target.value })}
                className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
              >
                <option value="created_at_desc">Terbaru</option>
                <option value="sold_desc">Terlaris (Penjualan)</option>
                <option value="name_asc">Nama A-Z</option>
                <option value="name_desc">Nama Z-A</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
                <option value="stock_asc">Sisa Stok Terendah</option>
              </select>
            </div>

            {/* Reset Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={onResetFilters}
                className="p-1.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                title="Reset semua filter"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Ribbon (Appears when items are selected) */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/60">
                <CheckSquare size={13} className="text-emerald-600" />
                <span>{selectedCount} produk terpilih</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onBulkActivate && (
                <button
                  type="button"
                  onClick={onBulkActivate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  <Power size={11} />
                  <span>Aktifkan</span>
                </button>
              )}

              {onBulkDeactivate && (
                <button
                  type="button"
                  onClick={onBulkDeactivate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <PowerOff size={11} />
                  <span>Nonaktifkan</span>
                </button>
              )}

              {onBulkDelete && (
                <button
                  type="button"
                  onClick={onBulkDelete}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={11} />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
