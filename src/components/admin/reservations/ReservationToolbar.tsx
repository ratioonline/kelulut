import { Search, X, RotateCcw, Download, Calendar, List, CalendarDays } from 'lucide-react'

export interface ReservationFilterState {
  search: string
  datePreset: string
  visitorType: string
  status: string
  groupSize: string
  activeTab: 'upcoming' | 'history' | 'calendar'
}

interface ReservationToolbarProps {
  filters: ReservationFilterState
  onChangeFilters: (filters: Partial<ReservationFilterState>) => void
  onResetFilters: () => void
  onExportCsv: () => void
  totalCount: number
}

export default function ReservationToolbar({
  filters,
  onChangeFilters,
  onResetFilters,
  onExportCsv,
  totalCount,
}: ReservationToolbarProps) {
  const isFilterActive =
    Boolean(filters.search) ||
    filters.datePreset !== 'all' ||
    filters.visitorType !== 'all' ||
    filters.status !== 'all' ||
    filters.groupSize !== 'all'

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-2xs space-y-2.5">
      {/* Top Bar: Tabs Switcher & Export */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
          <button
            type="button"
            onClick={() => onChangeFilters({ activeTab: 'upcoming' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filters.activeTab === 'upcoming'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calendar size={13} className="text-[#2D6A4F]" />
            <span>Jadwal Mendatang</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeFilters({ activeTab: 'history' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filters.activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <List size={13} className="text-blue-600" />
            <span>Riwayat Kunjungan</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeFilters({ activeTab: 'calendar' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filters.activeTab === 'calendar'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <CalendarDays size={13} className="text-amber-600" />
            <span>Kalender</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
            Total: <strong>{totalCount}</strong> data
          </span>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs"
            title="Export CSV data reservasi"
          >
            <Download size={13} className="text-gray-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Search & Dropdown Filters Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari koordinator, instansi, nomor HP, alamat..."
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
          {/* Date Filter */}
          <select
            value={filters.datePreset}
            onChange={(e) => onChangeFilters({ datePreset: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="all">Semua Tanggal</option>
            <option value="today">Hari Ini</option>
            <option value="tomorrow">Besok</option>
            <option value="7days">7 Hari Ke Depan</option>
            <option value="30days">30 Hari</option>
          </select>

          {/* Visitor Type Filter */}
          <select
            value={filters.visitorType}
            onChange={(e) => onChangeFilters({ visitorType: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="all">Semua Jenis Pengunjung</option>
            <option value="Sekolah">Sekolah / Kampus</option>
            <option value="Instansi">Instansi Pemerintah</option>
            <option value="Perusahaan">Perusahaan / Swasta</option>
            <option value="Komunitas">Komunitas / Paguyuban</option>
            <option value="Umum">Umum / Lainnya</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onChangeFilters({ status: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="done">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* Group Size Filter */}
          <select
            value={filters.groupSize}
            onChange={(e) => onChangeFilters({ groupSize: e.target.value })}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          >
            <option value="all">Semua Jumlah</option>
            <option value="small">1 - 10 Orang</option>
            <option value="medium">11 - 25 Orang</option>
            <option value="large">&gt; 25 Orang (Rombongan)</option>
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
