import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  Info,
  DollarSign,
} from 'lucide-react'
import type { BusinessInsightItem } from '../../../lib/dashboardAnalytics'

interface BusinessInsightsProps {
  insights: BusinessInsightItem[]
  loading?: boolean
}

export default function BusinessInsights({ insights, loading }: BusinessInsightsProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp size={16} className="text-emerald-600" />
      case 'TrendingDown':
        return <TrendingDown size={16} className="text-rose-600" />
      case 'Users':
        return <Users size={16} className="text-blue-600" />
      case 'Award':
        return <Award size={16} className="text-amber-600" />
      case 'AlertTriangle':
        return <AlertTriangle size={16} className="text-amber-600" />
      case 'DollarSign':
        return <DollarSign size={16} className="text-emerald-600" />
      case 'Sparkles':
        return <Sparkles size={16} className="text-purple-600" />
      default:
        return <Info size={16} className="text-gray-500" />
    }
  }

  const getStyleByType = (type: BusinessInsightItem['type']) => {
    switch (type) {
      case 'positive':
        return {
          cardBg: 'bg-emerald-50/50 border-emerald-200/70',
          iconBg: 'bg-emerald-100/80',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300/60',
        }
      case 'warning':
        return {
          cardBg: 'bg-amber-50/50 border-amber-200/70',
          iconBg: 'bg-amber-100/80',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300/60',
        }
      case 'highlight':
        return {
          cardBg: 'bg-purple-50/40 border-purple-200/70',
          iconBg: 'bg-purple-100/80',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300/60',
        }
      case 'info':
      default:
        return {
          cardBg: 'bg-blue-50/30 border-blue-100',
          iconBg: 'bg-blue-100/70',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Business Insights</h2>
              <p className="text-[11px] text-gray-400">Analisis otomatis dari data terkini</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">
            Live Pattern
          </span>
        </div>

        <div className="mt-3.5 space-y-2.5">
          {insights.map((item) => {
            const style = getStyleByType(item.type)
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border ${style.cardBg} transition-all duration-150 hover:shadow-2xs flex items-start gap-3`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${style.iconBg}`}>
                  {getIcon(item.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {item.title}
                    </p>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${style.badgeBg}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
