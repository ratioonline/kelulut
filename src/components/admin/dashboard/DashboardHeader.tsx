import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronDown,
  Plus,
  ShoppingBag,
  Store,
  FileText,
  CalendarCheck,
  RefreshCw,
  Sparkles,
  Check,
} from 'lucide-react'
import type { PeriodPreset, DateRange } from '../../../lib/dashboardAnalytics'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

interface DashboardHeaderProps {
  userName: string
  role: string | null
  currentRange: DateRange
  onSelectPreset: (preset: PeriodPreset, customStart?: Date, customEnd?: Date) => void
  onRefresh: () => void
  isRefreshing: boolean
}

const PRESET_OPTIONS: { id: PeriodPreset; label: string; desc?: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: '7days', label: '7 Hari Terakhir' },
  { id: '30days', label: '30 Hari Terakhir' },
  { id: 'thisWeek', label: 'Minggu Ini' },
  { id: 'lastWeek', label: 'Minggu Lalu' },
  { id: 'thisMonth', label: 'Bulan Ini' },
  { id: 'lastMonth', label: 'Bulan Lalu' },
  { id: 'thisYear', label: 'Tahun Ini' },
  { id: 'custom', label: 'Custom Range...' },
]

export default function DashboardHeader({
  userName,
  role,
  currentRange,
  onSelectPreset,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSelectPreset = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setDropdownOpen(false)
      setCustomModalOpen(true)
      return
    }
    onSelectPreset(preset)
    setDropdownOpen(false)
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customStart || !customEnd) return
    const s = new Date(customStart)
    const en = new Date(customEnd)
    if (s > en) {
      alert('Tanggal mulai tidak boleh melebihi tanggal akhir')
      return
    }
    onSelectPreset('custom', s, en)
    setCustomModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 pb-2 border-b border-gray-200/80">
      {/* Top row: Greeting & Date filter + Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              <span>Selamat datang, {userName || 'Admin'}</span>
              <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles size={11} className="text-emerald-600" />
              Command Center
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Ringkasan performa penjualan, reservasi pengunjung, dan metrik bisnis Kebun-Kelulut.
          </p>
        </div>

        {/* Action controls: Period dropdown & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period selector dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl shadow-xs hover:border-[#2D6A4F] hover:bg-gray-50/80 transition-all text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20"
            >
              <Calendar size={14} className="text-[#2D6A4F]" />
              <span>{currentRange.label}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Pilih Rentang Waktu
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {PRESET_OPTIONS.map((opt) => {
                    const isSelected = currentRange.preset === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectPreset(opt.id)}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} className="text-emerald-700" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#2D6A4F]' : ''} />
          </button>
        </div>
      </div>

      {/* Bottom row: Quick Action shortcuts */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
          Aksi Cepat:
        </span>

        <Link
          to="/admin/produk"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-gray-700 hover:text-emerald-900 transition-all shadow-2xs"
        >
          <Plus size={13} className="text-emerald-600" />
          <ShoppingBag size={13} className="text-gray-500" />
          <span>Tambah Produk</span>
        </Link>

        {(role === 'super_admin' || role === 'proktor') && (
          <Link
            to="/admin/umkm-management"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 text-gray-700 hover:text-teal-900 transition-all shadow-2xs"
          >
            <Plus size={13} className="text-teal-600" />
            <Store size={13} className="text-gray-500" />
            <span>Tambah UMKM</span>
          </Link>
        )}

        <Link
          to="/admin/artikel"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:border-amber-500 hover:bg-amber-50/50 text-gray-700 hover:text-amber-900 transition-all shadow-2xs"
        >
          <Plus size={13} className="text-amber-600" />
          <FileText size={13} className="text-gray-500" />
          <span>Tulis Artikel</span>
        </Link>

        <Link
          to="/admin/reservasi"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 text-gray-700 hover:text-blue-900 transition-all shadow-2xs"
        >
          <Plus size={13} className="text-blue-600" />
          <CalendarCheck size={13} className="text-gray-500" />
          <span>Input Kunjungan</span>
        </Link>
      </div>

      {/* Custom Date Range Modal */}
      <Modal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="Pilih Rentang Tanggal Kustom"
        size="sm"
      >
        <form onSubmit={handleApplyCustom} className="space-y-4 py-2">
          <Input
            label="Tanggal Mulai"
            type="date"
            required
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <Input
            label="Tanggal Akhir"
            type="date"
            required
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit">Terapkan Periode</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
