import {
  DollarSign,
  Users,
  ShoppingBag,
  Package,
  Store,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'
import type { calculateGrowth } from '../../../lib/dashboardAnalytics'

export interface KpiData {
  revenue: number
  previousRevenue: number
  visitors: number
  previousVisitors: number
  orders: number
  previousOrders: number
  itemsSold: number
  previousItemsSold: number
  umkmCount: number
  productsCount: number
}

interface KpiOverviewProps {
  data: KpiData
  growth: {
    revenue: ReturnType<typeof calculateGrowth>
    visitors: ReturnType<typeof calculateGrowth>
    orders: ReturnType<typeof calculateGrowth>
    itemsSold: ReturnType<typeof calculateGrowth>
  }
  role: string | null
  loading?: boolean
}

export default function KpiOverview({ data, growth, role, loading }: KpiOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
        <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs animate-pulse space-y-2.5">
          <div className="h-3.5 w-24 bg-gray-200 rounded" />
          <div className="h-7 w-40 bg-gray-300 rounded" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="lg:col-span-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs animate-pulse space-y-2.5">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-300 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const renderTrendBadge = (
    g: ReturnType<typeof calculateGrowth>,
    isHero = false
  ) => {
    if (!g.hasData) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
            isHero
              ? 'bg-white/10 text-white/80 border border-white/15'
              : 'bg-gray-50 text-gray-400 border border-gray-100'
          }`}
        >
          <Minus size={10} />
          <span>Belum ada data pembanding</span>
        </span>
      )
    }

    if (g.isNeutral) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
            isHero ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Minus size={10} />
          <span>0.0% vs periode lalu</span>
        </span>
      )
    }

    if (g.isPositive) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
            isHero
              ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
          }`}
        >
          <TrendingUp size={10} />
          <span>+{g.percentage}% vs periode lalu</span>
        </span>
      )
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
          isHero
            ? 'bg-rose-400/20 text-rose-200 border border-rose-400/30'
            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
        }`}
      >
        <TrendingDown size={10} />
        <span>-{g.percentage}% vs periode lalu</span>
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
      {/* ── HERO KPI: TOTAL PENDAPATAN (Takes 4 cols) ── */}
      <div className="sm:col-span-2 lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white p-4.5 shadow-sm border border-[#2D6A4F]/60 flex flex-col justify-between group transition-all">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-[#F5A623]/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-3 bottom-3 opacity-10 pointer-events-none">
          <DollarSign size={80} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
              Total Pendapatan
            </span>
            <span className="p-1.5 rounded-lg bg-white/10 text-[#F5A623]">
              <DollarSign size={16} />
            </span>
          </div>

          <div className="mt-2.5">
            <h2 className="text-2xl sm:text-2xl font-black tracking-tight text-white font-mono">
              {formatCurrency(data.revenue)}
            </h2>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          {renderTrendBadge(growth.revenue, true)}
          <span className="text-[10px] text-emerald-200/60 hidden sm:inline font-medium">
            Kasir & Transaksi
          </span>
        </div>
      </div>

      {/* ── KPI 2: TOTAL PENGUNJUNG (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Pengunjung
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-1.5 font-mono">
            {data.visitors.toLocaleString('id-ID')}
            <span className="text-[10px] font-medium text-gray-400 ml-1">orang</span>
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-gray-100">
          {renderTrendBadge(growth.visitors)}
        </div>
      </div>

      {/* ── KPI 3: TOTAL PESANAN (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Pesanan
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShoppingBag size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-1.5 font-mono">
            {data.orders.toLocaleString('id-ID')}
            <span className="text-[10px] font-medium text-gray-400 ml-1">order</span>
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-gray-100">
          {renderTrendBadge(growth.orders)}
        </div>
      </div>

      {/* ── KPI 4: PRODUK TERJUAL (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Produk Terjual
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-1.5 font-mono">
            {data.itemsSold.toLocaleString('id-ID')}
            <span className="text-[10px] font-medium text-gray-400 ml-1">pcs</span>
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-gray-100">
          {renderTrendBadge(growth.itemsSold)}
        </div>
      </div>

      {/* ── KPI 5: UMKM AKTIF / PRODUK SAYA (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {role === 'umkm_user' ? 'Produk Saya' : 'UMKM Aktif'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Store size={14} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-1.5 font-mono">
            {role === 'umkm_user' ? data.productsCount : data.umkmCount}
            <span className="text-[10px] font-medium text-gray-400 ml-1">
              {role === 'umkm_user' ? 'item' : 'mitra'}
            </span>
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span className="text-[10px] text-gray-500 font-medium truncate">
            {role === 'umkm_user' ? 'Katalog Aktif' : 'Terverifikasi'}
          </span>
        </div>
      </div>
    </div>
  )
}
