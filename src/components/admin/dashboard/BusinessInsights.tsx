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
        return <TrendingUp size={14} className="text-emerald-600" />
      case 'TrendingDown':
        return <TrendingDown size={14} className="text-rose-600" />
      case 'Users':
        return <Users size={14} className="text-blue-600" />
      case 'Award':
        return <Award size={14} className="text-amber-600" />
      case 'AlertTriangle':
        return <AlertTriangle size={14} className="text-amber-600" />
      case 'DollarSign':
        return <DollarSign size={14} className="text-emerald-600" />
      case 'Sparkles':
        return <Sparkles size={14} className="text-purple-600" />
      default:
        return <Info size={14} className="text-gray-500" />
    }
  }

  const getStyleByType = (type: BusinessInsightItem['type']) => {
    switch (type) {
      case 'positive':
        return {
          cardBg: 'bg-emerald-50/40 border-emerald-200/60',
          iconBg: 'bg-emerald-100/70',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300/50',
        }
      case 'warning':
        return {
          cardBg: 'bg-amber-50/40 border-amber-200/60',
          iconBg: 'bg-amber-100/70',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300/50',
        }
      case 'highlight':
        return {
          cardBg: 'bg-purple-50/30 border-purple-200/60',
          iconBg: 'bg-purple-100/70',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300/50',
        }
      case 'info':
      default:
        return {
          cardBg: 'bg-gray-50/60 border-gray-200/60',
          iconBg: 'bg-gray-100',
          badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
        }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs space-y-3 animate-pulse h-full">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="space-y-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-200/80 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-purple-100/70 text-purple-800">
              <Sparkles size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Business Insights</h2>
              <p className="text-[10px] text-gray-400">Analisis cerdas pola data aktual</p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md">
            Live Insights
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          {insights.map((item) => {
            const style = getStyleByType(item.type)
            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border ${style.cardBg} transition-all flex items-start gap-2.5`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${style.iconBg}`}>
                  {getIcon(item.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">
                        {item.category}
                      </span>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.title}
                      </p>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${style.badgeBg}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
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
