import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  format,
  differenceInDays,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export type PeriodPreset =
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom'

export interface DateRange {
  start: Date
  end: Date
  label: string
  preset: PeriodPreset
}

export interface PreviousDateRange {
  start: Date
  end: Date
}

/**
 * Returns the DateRange (start & end) for a given preset
 */
export function getDateRangeFromPreset(
  preset: PeriodPreset,
  customStart?: Date,
  customEnd?: Date
): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Hari Ini',
        preset,
      }
    case 'yesterday': {
      const y = subDays(now, 1)
      return {
        start: startOfDay(y),
        end: endOfDay(y),
        label: 'Kemarin',
        preset,
      }
    }
    case '7days':
      return {
        start: startOfDay(subDays(now, 6)),
        end: endOfDay(now),
        label: '7 Hari Terakhir',
        preset,
      }
    case '30days':
      return {
        start: startOfDay(subDays(now, 29)),
        end: endOfDay(now),
        label: '30 Hari Terakhir',
        preset,
      }
    case 'thisWeek':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        label: 'Minggu Ini',
        preset,
      }
    case 'lastWeek': {
      const prevWeek = subWeeks(now, 1)
      return {
        start: startOfWeek(prevWeek, { weekStartsOn: 1 }),
        end: endOfWeek(prevWeek, { weekStartsOn: 1 }),
        label: 'Minggu Lalu',
        preset,
      }
    }
    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'Bulan Ini',
        preset,
      }
    case 'lastMonth': {
      const prevMonth = subMonths(now, 1)
      return {
        start: startOfMonth(prevMonth),
        end: endOfMonth(prevMonth),
        label: 'Bulan Lalu',
        preset,
      }
    }
    case 'thisYear':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: 'Tahun Ini',
        preset,
      }
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : startOfDay(subDays(now, 29)),
        end: customEnd ? endOfDay(customEnd) : endOfDay(now),
        label: customStart && customEnd
          ? `${format(customStart, 'd MMM yyyy', { locale: idLocale })} - ${format(customEnd, 'd MMM yyyy', { locale: idLocale })}`
          : 'Custom Range',
        preset: 'custom',
      }
    default:
      return {
        start: startOfDay(subDays(now, 29)),
        end: endOfDay(now),
        label: '30 Hari Terakhir',
        preset: '30days',
      }
  }
}

/**
 * Calculates the exact equivalent previous period for comparison
 */
export function getPreviousPeriod(currentRange: DateRange): PreviousDateRange {
  const { start, end, preset } = currentRange

  switch (preset) {
    case 'today':
    case 'yesterday': {
      const prev = subDays(start, 1)
      return { start: startOfDay(prev), end: endOfDay(prev) }
    }
    case '7days': {
      const duration = 7
      return {
        start: startOfDay(subDays(start, duration)),
        end: endOfDay(subDays(end, duration)),
      }
    }
    case '30days': {
      const duration = 30
      return {
        start: startOfDay(subDays(start, duration)),
        end: endOfDay(subDays(end, duration)),
      }
    }
    case 'thisWeek':
    case 'lastWeek': {
      const prevWeek = subWeeks(start, 1)
      return {
        start: startOfWeek(prevWeek, { weekStartsOn: 1 }),
        end: endOfWeek(prevWeek, { weekStartsOn: 1 }),
      }
    }
    case 'thisMonth':
    case 'lastMonth': {
      const prevMonth = subMonths(start, 1)
      return {
        start: startOfMonth(prevMonth),
        end: endOfMonth(prevMonth),
      }
    }
    case 'thisYear': {
      const prevYear = subYears(start, 1)
      return {
        start: startOfYear(prevYear),
        end: endOfYear(prevYear),
      }
    }
    case 'custom':
    default: {
      const diffDays = Math.max(1, differenceInDays(end, start) + 1)
      return {
        start: startOfDay(subDays(start, diffDays)),
        end: endOfDay(subDays(end, diffDays)),
      }
    }
  }
}

/**
 * Calculates percentage growth / decline between current and previous period.
 * Returns hasData = false if previous value is 0 (to prevent fake/exaggerated alerts).
 */
export function calculateGrowth(
  current: number,
  previous: number
): { percentage: number; isPositive: boolean; isNeutral: boolean; hasData: boolean } {
  if (previous === 0 && current === 0) {
    return { percentage: 0, isPositive: true, isNeutral: true, hasData: false }
  }
  if (previous === 0) {
    return { percentage: 100, isPositive: true, isNeutral: false, hasData: false }
  }

  const change = ((current - previous) / previous) * 100
  const rounded = Math.round(change * 10) / 10

  return {
    percentage: Math.abs(rounded),
    isPositive: change > 0,
    isNeutral: change === 0,
    hasData: true,
  }
}

export interface TrendChartPoint {
  key: string
  label: string
  fullDate: string
  Pengunjung: number
  Pendapatan: number
  Pesanan: number
}

/**
 * Aggregates transactions and reservations into time-series chart data points
 */
export function buildTrendData(
  range: DateRange,
  reservations: any[],
  transactions: any[]
): TrendChartPoint[] {
  const diffDays = differenceInDays(range.end, range.start)

  // 1. Single day (Today / Yesterday): Group by 3-hour blocks
  if (diffDays <= 1) {
    const points: TrendChartPoint[] = []
    for (let hour = 6; hour <= 21; hour += 3) {
      const hourStr = `${String(hour).padStart(2, '0')}:00`
      const nextHourStr = `${String(hour + 3).padStart(2, '0')}:00`
      points.push({
        key: hourStr,
        label: `${hourStr}`,
        fullDate: `${format(range.start, 'd MMMM yyyy', { locale: idLocale })} (${hourStr} - ${nextHourStr})`,
        Pengunjung: 0,
        Pendapatan: 0,
        Pesanan: 0,
      })
    }

    reservations.forEach((r) => {
      const d = parseISO(r.visit_date || r.created_at)
      const h = d.getHours()
      const bucketIdx = Math.min(points.length - 1, Math.max(0, Math.floor((h - 6) / 3)))
      if (points[bucketIdx]) {
        points[bucketIdx].Pengunjung += r.num_visitors || 0
      }
    })

    transactions.forEach((t) => {
      const d = parseISO(t.transaction_date || t.created_at)
      const h = d.getHours()
      const bucketIdx = Math.min(points.length - 1, Math.max(0, Math.floor((h - 6) / 3)))
      if (points[bucketIdx]) {
        points[bucketIdx].Pendapatan += t.total_amount || 0
        points[bucketIdx].Pesanan += 1
      }
    })

    return points
  }

  // 2. Year range (>90 days): Group by month
  if (diffDays > 90) {
    const monthMap: Record<string, TrendChartPoint> = {}
    let curr = startOfMonth(range.start)
    const last = endOfMonth(range.end)

    while (curr <= last) {
      const key = format(curr, 'yyyy-MM')
      const label = format(curr, 'MMM yyyy', { locale: idLocale })
      monthMap[key] = {
        key,
        label,
        fullDate: format(curr, 'MMMM yyyy', { locale: idLocale }),
        Pengunjung: 0,
        Pendapatan: 0,
        Pesanan: 0,
      }
      curr = startOfMonth(new Date(curr.getFullYear(), curr.getMonth() + 1, 1))
    }

    reservations.forEach((r) => {
      const d = parseISO(r.visit_date || r.created_at)
      const key = format(d, 'yyyy-MM')
      if (monthMap[key]) {
        monthMap[key].Pengunjung += r.num_visitors || 0
      }
    })

    transactions.forEach((t) => {
      const d = parseISO(t.transaction_date || t.created_at)
      const key = format(d, 'yyyy-MM')
      if (monthMap[key]) {
        monthMap[key].Pendapatan += t.total_amount || 0
        monthMap[key].Pesanan += 1
      }
    })

    return Object.values(monthMap)
  }

  // 3. 7 to 30 days: Group by daily points
  const dayMap: Record<string, TrendChartPoint> = {}
  let curr = startOfDay(range.start)
  const last = startOfDay(range.end)

  while (curr <= last) {
    const key = format(curr, 'yyyy-MM-dd')
    const label = format(curr, diffDays <= 7 ? 'EEE, d' : 'd MMM', { locale: idLocale })
    dayMap[key] = {
      key,
      label,
      fullDate: format(curr, 'EEEE, d MMMM yyyy', { locale: idLocale }),
      Pengunjung: 0,
      Pendapatan: 0,
      Pesanan: 0,
    }
    curr = startOfDay(new Date(curr.getTime() + 86400000))
  }

  reservations.forEach((r) => {
    const d = parseISO(r.visit_date || r.created_at)
    const key = format(d, 'yyyy-MM-dd')
    if (dayMap[key]) {
      dayMap[key].Pengunjung += r.num_visitors || 0
    }
  })

  transactions.forEach((t) => {
    const d = parseISO(t.transaction_date || t.created_at)
    const key = format(d, 'yyyy-MM-dd')
    if (dayMap[key]) {
      dayMap[key].Pendapatan += t.total_amount || 0
      dayMap[key].Pesanan += 1
    }
  })

  return Object.values(dayMap)
}

export interface BusinessInsightItem {
  id: string
  category: 'Performance' | 'Best Seller' | 'Visitor' | 'Stock' | 'Trend'
  type: 'positive' | 'warning' | 'info' | 'highlight'
  icon: string
  title: string
  description: string
  badge?: string
}

/**
 * Dynamically generates statistical and data-aware insights with threshold safeguards
 */
export function generateBusinessInsights(params: {
  currentRevenue: number
  previousRevenue: number
  currentVisitors: number
  previousVisitors: number
  currentOrders: number
  topProduct?: { name: string; quantity: number }
  topUmkm?: { name: string; revenue: number }
  lowStockCount: number
  visitorTypes: { name: string; count: number; percentage: number }[]
  periodLabel: string
}): BusinessInsightItem[] {
  const insights: BusinessInsightItem[] = []

  const revGrowth = calculateGrowth(params.currentRevenue, params.previousRevenue)
  const visGrowth = calculateGrowth(params.currentVisitors, params.previousVisitors)

  // 1. REVENUE INSIGHT (Category: Performance)
  if (params.currentRevenue > 0) {
    if (revGrowth.hasData) {
      if (revGrowth.isPositive && revGrowth.percentage > 0) {
        insights.push({
          id: 'rev-growth',
          category: 'Performance',
          type: 'positive',
          icon: 'TrendingUp',
          title: 'Pertumbuhan Pendapatan Positif',
          description: `Pendapatan naik ${revGrowth.percentage}% dibanding periode sebelumnya pada rentang ${params.periodLabel}.`,
          badge: `+${revGrowth.percentage}%`,
        })
      } else if (!revGrowth.isPositive && revGrowth.percentage > 0) {
        insights.push({
          id: 'rev-drop',
          category: 'Performance',
          type: 'warning',
          icon: 'TrendingDown',
          title: 'Penurunan Omzet',
          description: `Pendapatan tercatat melambat ${revGrowth.percentage}% dibanding periode lalu.`,
          badge: `-${revGrowth.percentage}%`,
        })
      }
    } else {
      insights.push({
        id: 'rev-active',
        category: 'Performance',
        type: 'info',
        icon: 'DollarSign',
        title: 'Aktivitas Penjualan',
        description: `Tercatat ${params.currentOrders} transaksi penjualan dalam periode ${params.periodLabel}.`,
      })
    }
  } else {
    insights.push({
      id: 'rev-none',
      category: 'Performance',
      type: 'info',
      icon: 'Info',
      title: 'Aktivitas Penjualan',
      description: `Belum ada catatan transaksi pada periode ${params.periodLabel}.`,
    })
  }

  // 2. BEST SELLER PRODUCT INSIGHT (Category: Best Seller)
  if (params.topProduct && params.topProduct.quantity > 0) {
    insights.push({
      id: 'top-prod',
      category: 'Best Seller',
      type: 'highlight',
      icon: 'Sparkles',
      title: 'Produk Terlaris',
      description: `${params.topProduct.name} menjadi produk paling diminati (${params.topProduct.quantity} unit).`,
      badge: 'Top Item',
    })
  }

  // 3. VISITOR INSIGHT WITH THRESHOLD CHECK (Category: Visitor)
  if (params.currentVisitors >= 10) {
    // Only claim segment dominance if dataset has at least 10 visitors
    const dominantType = params.visitorTypes.sort((a, b) => b.count - a.count)[0]
    if (dominantType && dominantType.percentage >= 40 && dominantType.count > 0) {
      insights.push({
        id: 'vis-segment',
        category: 'Visitor',
        type: 'highlight',
        icon: 'Users',
        title: `Segmen Dominan: ${dominantType.name}`,
        description: `Kategori ${dominantType.name} menyumbang ${dominantType.percentage}% dari total ${params.currentVisitors} pengunjung.`,
        badge: `${dominantType.percentage}%`,
      })
    } else if (visGrowth.hasData && visGrowth.isPositive && visGrowth.percentage > 0) {
      insights.push({
        id: 'vis-growth',
        category: 'Visitor',
        type: 'positive',
        icon: 'TrendingUp',
        title: 'Kunjungan Meningkat',
        description: `Pengunjung reservasi bertumbuh ${visGrowth.percentage}% dibanding periode sebelumnya.`,
        badge: `+${visGrowth.percentage}%`,
      })
    }
  } else if (params.currentVisitors > 0) {
    insights.push({
      id: 'vis-limited',
      category: 'Visitor',
      type: 'info',
      icon: 'Users',
      title: 'Data Pengunjung Awal',
      description: `Tercatat ${params.currentVisitors} pengunjung pada periode ini. Data masih dalam tahap awal akumulasi.`,
    })
  }

  // 4. LOW STOCK ALERT INSIGHT (Category: Stock)
  if (params.lowStockCount > 0) {
    insights.push({
      id: 'low-stock',
      category: 'Stock',
      type: 'warning',
      icon: 'AlertTriangle',
      title: 'Perhatian Stok Menipis',
      description: `Terdapat ${params.lowStockCount} produk yang stoknya berada di bawah batas minimum.`,
      badge: `${params.lowStockCount} Produk`,
    })
  }

  return insights.slice(0, 4)
}
