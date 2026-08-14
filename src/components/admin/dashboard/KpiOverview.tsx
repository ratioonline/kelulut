import {
  DollarSign,
  Users,
  ShoppingBag,
  Package,
  Store,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Hero skeleton */}
        <div className="sm:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs animate-pulse space-y-3">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-8 w-44 bg-gray-300 rounded" />
          <div className="h-4 w-36 bg-gray-100 rounded" />
        </div>
        {/* 3 smaller skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs animate-pulse space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-7 w-24 bg-gray-300 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
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
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
            isHero
              ? 'bg-white/15 text-white/90 border border-white/20'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Minus size={11} />
          <span>Periode sebelumnya nihil</span>
        </span>
      )
    }

    if (g.isNeutral) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
            isHero ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Minus size={11} />
          <span>0.0% vs periode lalu</span>
        </span>
      )
    }

    if (g.isPositive) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
            isHero
              ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-400/30'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          }`}
        >
          <TrendingUp size={11} />
          <span>+{g.percentage}% vs periode lalu</span>
        </span>
      )
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
          isHero
            ? 'bg-rose-400/25 text-rose-200 border border-rose-400/30'
            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
        }`}
      >
        <TrendingDown size={11} />
        <span>-{g.percentage}% vs periode lalu</span>
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
      {/* ── HERO KPI: TOTAL PENDAPATAN (Takes 4 cols on large screens) ── */}
      <div className="sm:col-span-2 lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white p-5 sm:p-6 shadow-md border border-[#2D6A4F]/50 flex flex-col justify-between group transition-all duration-200 hover:shadow-lg">
        {/* Background decorative glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#F5A623]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
          <DollarSign size={96} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
              Total Pendapatan
            </span>
            <span className="p-2 rounded-xl bg-white/10 text-[#F5A623] backdrop-blur-xs">
              <DollarSign size={18} />
            </span>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {formatCurrency(data.revenue)}
            </h2>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          {renderTrendBadge(growth.revenue, true)}
          <span className="text-[11px] text-emerald-200/70 hidden sm:inline">
            Kasir & Transaksi
          </span>
        </div>
      </div>

      {/* ── KPI 2: TOTAL PENGUNJUNG (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:border-emerald-500/40 hover:shadow-xs transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pengunjung
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {data.visitors.toLocaleString('id-ID')}
            <span className="text-xs font-medium text-gray-400 ml-1">orang</span>
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          {renderTrendBadge(growth.visitors)}
        </div>
      </div>

      {/* ── KPI 3: TOTAL PESANAN (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:border-emerald-500/40 hover:shadow-xs transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pesanan
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {data.orders.toLocaleString('id-ID')}
            <span className="text-xs font-medium text-gray-400 ml-1">order</span>
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          {renderTrendBadge(growth.orders)}
        </div>
      </div>

      {/* ── KPI 4: PRODUK TERJUAL (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:border-emerald-500/40 hover:shadow-xs transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Produk Terjual
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {data.itemsSold.toLocaleString('id-ID')}
            <span className="text-xs font-medium text-gray-400 ml-1">pcs</span>
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          {renderTrendBadge(growth.itemsSold)}
        </div>
      </div>

      {/* ── KPI 5: UMKM AKTIF / PRODUK AKTIF (2 cols) ── */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:border-emerald-500/40 hover:shadow-xs transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {role === 'umkm_user' ? 'Produk Saya' : 'UMKM Aktif'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Store size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2 font-mono">
            {role === 'umkm_user' ? data.productsCount : data.umkmCount}
            <span className="text-xs font-medium text-gray-400 ml-1">
              {role === 'umkm_user' ? 'item' : 'mitra'}
            </span>
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-[11px] text-gray-500 font-medium">
            Terdaftar & Terverifikasi
          </span>
        </div>
      </div>
    </div>
  )
}
