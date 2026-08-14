import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Users, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'
import type { TrendChartPoint } from '../../../lib/dashboardAnalytics'
import { formatCurrency } from '../../../lib/utils'

type MetricKey = 'Pengunjung' | 'Pendapatan' | 'Pesanan'

interface BusinessTrendChartProps {
  data: TrendChartPoint[]
  periodLabel: string
  loading?: boolean
}

export default function BusinessTrendChart({
  data,
  periodLabel,
  loading,
}: BusinessTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('Pengunjung')

  const metricConfig: Record<
    MetricKey,
    {
      label: string
      color: string
      gradientId: string
      icon: typeof Users
      unit: string
    }
  > = {
    Pengunjung: {
      label: 'Pengunjung',
      color: '#2D6A4F',
      gradientId: 'colorPengunjung',
      icon: Users,
      unit: 'orang',
    },
    Pendapatan: {
      label: 'Pendapatan',
      color: '#F5A623',
      gradientId: 'colorPendapatan',
      icon: DollarSign,
      unit: 'Rp',
    },
    Pesanan: {
      label: 'Pesanan',
      color: '#3B82F6',
      gradientId: 'colorPesanan',
      icon: ShoppingBag,
      unit: 'order',
    },
  }

  const currentCfg = metricConfig[activeMetric]
  const nonZeroPoints = data.filter((d) => d[activeMetric] > 0).length
  const allZero = data.length === 0 || nonZeroPoints === 0

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-7 w-44 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-56 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs flex flex-col justify-between h-full">
      {/* Header & Metric Switcher (Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={16} className="text-[#2D6A4F]" />
            <h2 className="text-sm font-bold text-gray-900">
              Tren Bisnis & Aktivitas
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Rentang: <span className="font-semibold text-gray-600">{periodLabel}</span>
            {nonZeroPoints > 0 && ` • ${nonZeroPoints} titik data aktif`}
          </p>
        </div>

        {/* Metric Pill Selector */}
        <div className="flex items-center bg-gray-100/90 p-0.5 rounded-xl gap-0.5 self-start sm:self-auto border border-gray-200/60">
          {(['Pengunjung', 'Pendapatan', 'Pesanan'] as MetricKey[]).map((key) => {
            const isSelected = activeMetric === key
            const Icon = metricConfig[key].icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon
                  size={12}
                  style={{ color: isSelected ? metricConfig[key].color : undefined }}
                />
                <span>{metricConfig[key].label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Area (Tinggi dikurangi ke 240px agar compact) */}
      <div className="h-60 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPengunjung" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F5A623" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F5A623" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPesanan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

            <XAxis
              dataKey="label"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontWeight: 500 }}
              dy={4}
            />

            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B' }}
              tickFormatter={(val) => {
                if (activeMetric === 'Pendapatan') {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`
                  return String(val)
                }
                return String(val)
              }}
            />

            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as TrendChartPoint
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-gray-100 text-[11px] space-y-1 min-w-[160px]">
                      <p className="font-bold text-gray-900 pb-1 border-b border-gray-100">
                        {pt.fullDate || pt.label}
                      </p>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                          Pengunjung:
                        </span>
                        <span className="font-bold text-gray-900">
                          {pt.Pengunjung.toLocaleString('id-ID')} org
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
                          Pendapatan:
                        </span>
                        <span className="font-bold text-emerald-800">
                          {formatCurrency(pt.Pendapatan)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                          Pesanan:
                        </span>
                        <span className="font-bold text-gray-900">
                          {pt.Pesanan} trx
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke={currentCfg.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${currentCfg.gradientId})`}
              activeDot={{ r: 5, stroke: currentCfg.color, strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {allZero && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl pointer-events-none">
            <div className="text-center p-3">
              <p className="text-xs font-semibold text-gray-600">
                Belum ada data {currentCfg.label.toLowerCase()} pada rentang ini
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Grafik akan otomatis memetakan tren saat ada transaksi atau kunjungan
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
