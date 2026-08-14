import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Users, PieChart as PieIcon } from 'lucide-react'

export interface VisitorTypeStat {
  name: string
  count: number
  percentage: number
}

interface VisitorDemographicsCardProps {
  data: VisitorTypeStat[]
  totalVisitors: number
  loading?: boolean
}

const PALETTE = ['#2D6A4F', '#F5A623', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B']

export default function VisitorDemographicsCard({
  data,
  totalVisitors,
  loading,
}: VisitorDemographicsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-44 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  const chartData = data.filter((d) => d.count > 0)

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <PieIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Kategori Pengunjung</h2>
              <p className="text-[11px] text-gray-400">Komposisi segmen reservasi</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
            {totalVisitors.toLocaleString('id-ID')} Total
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Donut Chart */}
            <div className="sm:col-span-5 h-36 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PALETTE[index % PALETTE.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString('id-ID')} orang (${Math.round((value / (totalVisitors || 1)) * 100)}%)`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: '10px',
                      fontSize: '11px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-gray-400">Segmen</span>
                <span className="text-xs font-black text-gray-800">{chartData.length}</span>
              </div>
            </div>

            {/* Breakdown legend */}
            <div className="sm:col-span-7 space-y-2">
              {chartData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                    />
                    <span className="text-gray-700 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900 font-mono">{item.count} org</span>
                    <span className="text-[10px] text-gray-400 ml-1 font-semibold">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            <Users size={24} className="mx-auto mb-1 opacity-40" />
            <p className="text-xs font-medium">Belum ada data demografi pengunjung</p>
          </div>
        )}
      </div>
    </div>
  )
}
