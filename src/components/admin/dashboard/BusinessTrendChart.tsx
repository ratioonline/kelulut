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
      formatVal: (val: number) => string
    }
  > = {
    Pengunjung: {
      label: 'Pengunjung',
      color: '#2D6A4F',
      gradientId: 'colorPengunjung',
      icon: Users,
      unit: 'orang',
      formatVal: (val) => `${val.toLocaleString('id-ID')} orang`,
    },
    Pendapatan: {
      label: 'Pendapatan',
      color: '#F5A623',
      gradientId: 'colorPendapatan',
      icon: DollarSign,
      unit: 'Rp',
      formatVal: (val) => formatCurrency(val),
    },
    Pesanan: {
      label: 'Pesanan',
      color: '#3B82F6',
      gradientId: 'colorPesanan',
      icon: ShoppingBag,
      unit: 'order',
      formatVal: (val) => `${val.toLocaleString('id-ID')} order`,
    },
  }

  const currentCfg = metricConfig[activeMetric]
  const allZero = data.length === 0 || data.every((d) => d[activeMetric] === 0)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <TrendingUp size={18} className="text-[#2D6A4F]" />
              <span>Tren Bisnis & Aktivitas</span>
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Menampilkan histori pergerakan pada rentang: <span className="font-semibold text-gray-600">{periodLabel}</span>
          </p>
        </div>

        {/* Metric Pill Selector */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 self-start sm:self-auto border border-gray-200/60">
          {(['Pengunjung', 'Pendapatan', 'Pesanan'] as MetricKey[]).map((key) => {
            const isSelected = activeMetric === key
            const Icon = metricConfig[key].icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <Icon
                  size={13}
                  className={isSelected ? `text-[${metricConfig[key].color}]` : 'text-gray-400'}
                  style={{ color: isSelected ? metricConfig[key].color : undefined }}
                />
                <span>{metricConfig[key].label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPengunjung" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F5A623" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F5A623" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorPesanan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />

            <XAxis
              dataKey="label"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontWeight: 500 }}
              dy={6}
            />

            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B' }}
              tickFormatter={(val) => {
                if (activeMetric === 'Pendapatan') {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
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
                    <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-100 text-xs space-y-1.5 min-w-[170px]">
                      <p className="font-bold text-gray-900 pb-1 border-b border-gray-100">
                        {pt.fullDate || pt.label}
                      </p>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                          Pengunjung:
                        </span>
                        <span className="font-bold text-gray-900">
                          {pt.Pengunjung.toLocaleString('id-ID')} org
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                          Pendapatan:
                        </span>
                        <span className="font-bold text-emerald-800">
                          {formatCurrency(pt.Pendapatan)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
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
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${currentCfg.gradientId})`}
              activeDot={{ r: 6, stroke: currentCfg.color, strokeWidth: 2, fill: '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {allZero && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl pointer-events-none">
            <div className="text-center p-4">
              <p className="text-xs font-semibold text-gray-600">
                Belum ada pergerakan {currentCfg.label.toLowerCase()} pada periode {periodLabel}.
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Data akan otomatis terpetakan ketika ada aktivitas baru.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
