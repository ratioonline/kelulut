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

const PALETTE: Record<string, string> = {
  Sekolah: '#2D6A4F',
  Instansi: '#3B82F6',
  Perusahaan: '#8B5CF6',
  Komunitas: '#F5A623',
  Umum: '#64748B',
}

export default function VisitorDemographicsCard({
  data,
  totalVisitors,
  loading,
}: VisitorDemographicsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => b.count - a.count)
  const hasVisitors = totalVisitors > 0

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-800">
              <Users size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Jenis Pengunjung</h2>
              <p className="text-[10px] text-gray-400">Komposisi segmen reservasi</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
            {totalVisitors.toLocaleString('id-ID')} Total
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          {hasVisitors ? (
            sortedData.map((item) => {
              const barColor = PALETTE[item.name] || '#2D6A4F'
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-gray-900 font-mono">{item.count} org</span>
                      <span className="text-[10px] text-gray-400 ml-1 font-semibold">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: barColor,
                        width: `${Math.max(4, item.percentage)}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-7 text-center text-gray-400">
              <Users size={20} className="mx-auto mb-1 opacity-40" />
              <p className="text-xs font-medium">Belum ada data demografi pengunjung periode ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
