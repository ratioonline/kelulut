import { useState, useMemo } from 'react'
import {
  Search,
  X,
  Printer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Banknote,
  QrCode,
  CreditCard,
  RotateCcw,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { formatCurrency } from '../../../lib/utils'

export interface PosTransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  price_at_time: number
  product?: {
    id: string
    name: string
    unit?: string | null
    umkm?: { name: string } | null
  } | null
}

export interface PosTransaction {
  id: string
  umkm_id: string | null
  total_amount: number
  status: string
  type: string
  customer_name: string | null
  transaction_date: string
  created_at: string
  items?: PosTransactionItem[]
  umkm?: { name: string } | null
}

interface PosHistoryTableProps {
  transactions: PosTransaction[]
  loading?: boolean
  onPrintReceipt: (trx: PosTransaction) => void
  onQuickView: (trx: PosTransaction) => void
  onVoidTransaction: (trx: PosTransaction) => void
}

type PeriodFilter = 'today' | '7days' | '30days' | 'month' | 'all'

export default function PosHistoryTable({
  transactions,
  loading,
  onPrintReceipt,
  onQuickView,
  onVoidTransaction,
}: PosHistoryTableProps) {
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<PeriodFilter>('today')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  const todayDateStr = new Date().toISOString().split('T')[0]

  // Filtered dataset
  const filtered = useMemo(() => {
    const now = new Date()
    return transactions.filter((t) => {
      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) return false

      // Period
      const tDate = new Date(t.created_at || t.transaction_date)
      const tDateStr = tDate.toISOString().split('T')[0]

      if (period === 'today' && tDateStr !== todayDateStr) return false
      if (period === '7days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24)
        if (diffDays > 7) return false
      }
      if (period === '30days') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24)
        if (diffDays > 30) return false
      }
      if (period === 'month') {
        if (tDate.getMonth() !== now.getMonth() || tDate.getFullYear() !== now.getFullYear()) {
          return false
        }
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchId = t.id.toLowerCase().includes(q)
        const matchCustomer = t.customer_name?.toLowerCase().includes(q)
        const matchItem = t.items?.some((i) => i.product?.name?.toLowerCase().includes(q))
        if (!matchId && !matchCustomer && !matchItem) return false
      }

      return true
    })
  }, [transactions, period, statusFilter, search, todayDateStr])

  // Payment Breakdown Metrics
  const summary = useMemo(() => {
    const valid = filtered.filter((t) => t.status !== 'cancelled' && t.status !== 'failed')
    const totalRev = valid.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)
    const totalTrx = valid.length
    const totalItems = valid.reduce(
      (sum, t) => sum + (t.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 1),
      0
    )

    return {
      totalRev,
      totalTrx,
      totalItems,
    }
  }, [filtered])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-3 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total Omzet Periode</span>
          <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">
            {formatCurrency(summary.totalRev)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400">Total Transaksi</span>
          <p className="text-lg font-black text-gray-900 font-mono mt-0.5">
            {summary.totalTrx} <span className="text-[11px] font-normal text-gray-400">Trx</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400">Produk Terjual</span>
          <p className="text-lg font-black text-blue-700 font-mono mt-0.5">
            {summary.totalItems} <span className="text-[11px] font-normal text-gray-400">Pcs</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3 border border-gray-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. transaksi, pembeli, produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7days', label: '7 Hari' },
            { id: '30days', label: '30 Hari' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id as PeriodFilter)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                period === p.id
                  ? 'bg-[#2D6A4F] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan / Void</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200/70 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Waktu</th>
                  <th className="py-3 px-3">Pembeli</th>
                  <th className="py-3 px-3">Rincian Item</th>
                  <th className="py-3 px-3">Total Tagihan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => {
                  const isVoid = t.status === 'cancelled' || t.status === 'failed'
                  const totalItemsCount = t.items?.reduce((s, i) => s + i.quantity, 0) || 1

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isVoid ? 'opacity-50 bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Waktu */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-mono text-gray-700 font-medium">
                          {format(new Date(t.created_at || t.transaction_date), 'd MMM yyyy, HH:mm', {
                            locale: idLocale,
                          })}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 truncate block">
                          ID: {t.id.slice(0, 8)}...
                        </span>
                      </td>

                      {/* Pembeli */}
                      <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                        {t.customer_name || 'Pembeli Offline'}
                      </td>

                      {/* Items */}
                      <td className="py-2.5 px-3">
                        <div className="max-w-[240px] truncate text-gray-700">
                          {t.items && t.items.length > 0
                            ? t.items.map((i) => `${i.product?.name || 'Produk'} (${i.quantity}x)`).join(', ')
                            : `${totalItemsCount} produk`}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isVoid ? 'line-through text-gray-400' : 'text-emerald-800'
                          }`}
                        >
                          {formatCurrency(t.total_amount || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVoid
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isVoid ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                          {isVoid ? 'Void / Batal' : 'Selesai'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onPrintReceipt(t)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            title="Cetak Struk"
                          >
                            <Printer size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onQuickView(t)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye size={13} />
                          </button>

                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => onVoidTransaction(t)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Batalkan / Void Transaksi & Kembalikan Stok"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            Belum ada data transaksi pada rentang filter ini.
          </div>
        )}
      </div>
    </div>
  )
}
