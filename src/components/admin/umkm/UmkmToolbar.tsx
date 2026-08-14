import { Search, X, RotateCcw } from 'lucide-react'

export interface UmkmFilterState {
  search: string
  status: string
  performance: string
  sortBy: string
}

interface UmkmToolbarProps {
  filters: UmkmFilterState
  onChangeFilters: (filters: Partial<UmkmFilterState>) => void
  onResetFilters: () => void
}

export default function UmkmToolbar({
  filters,
  onChangeFilters,
  onResetFilters,
}: UmkmToolbarProps) {
  const isFilterActive =
    Boolean(filters.search) ||
    filters.status !== 'all' ||
    filters.performance !== 'all' ||
    filters.sortBy !== 'sales_desc'

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-2xs space-y-2.5">
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama UMKM, pemilik, atau kota..."
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
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onChangeFilters({ status: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          {/* Performance Filter */}
          <select
            value={filters.performance}
            onChange={(e) => onChangeFilters({ performance: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="all">Semua Performa</option>
            <option value="top_sales">Omzet Tertinggi</option>
            <option value="most_products">Produk Terbanyak</option>
            <option value="no_sales">Belum Ada Penjualan</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={filters.sortBy}
            onChange={(e) => onChangeFilters({ sortBy: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="sales_desc">Penjualan Tertinggi</option>
            <option value="products_desc">Produk Terbanyak</option>
            <option value="name_asc">Nama A-Z</option>
            <option value="name_desc">Nama Z-A</option>
            <option value="created_at_desc">Terbaru</option>
          </select>

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
    </div>
  )
}
