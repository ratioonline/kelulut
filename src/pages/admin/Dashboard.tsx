import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import {
  getDateRangeFromPreset,
  getPreviousPeriod,
  calculateGrowth,
  buildTrendData,
  generateBusinessInsights,
  type PeriodPreset,
  type DateRange,
} from '../../lib/dashboardAnalytics'
import type { Reservation, Product } from '../../types/database'

// Dashboard Modular Components
import DashboardHeader from '../../components/admin/dashboard/DashboardHeader'
import TodaySummaryStrip from '../../components/admin/dashboard/TodaySummaryStrip'
import KpiOverview, { type KpiData } from '../../components/admin/dashboard/KpiOverview'
import BusinessTrendChart from '../../components/admin/dashboard/BusinessTrendChart'
import BusinessInsights from '../../components/admin/dashboard/BusinessInsights'
import UpcomingVisitsCard from '../../components/admin/dashboard/UpcomingVisitsCard'
import TopUmkmCard, { type TopUmkmItem } from '../../components/admin/dashboard/TopUmkmCard'
import TopProductsCard, { type TopProductItem } from '../../components/admin/dashboard/TopProductsCard'
import VisitorDemographicsCard, { type VisitorTypeStat } from '../../components/admin/dashboard/VisitorDemographicsCard'
import RecentActivityCard, { type ActivityItem } from '../../components/admin/dashboard/RecentActivityCard'
import LowStockAlertCard from '../../components/admin/dashboard/LowStockAlertCard'

export default function Dashboard() {
  const { role, myUmkm, user } = useAuthStore()

  // State: Date Filtering
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('30days')
  const [customRangeDates, setCustomRangeDates] = useState<{ start?: Date; end?: Date }>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Raw fetched datasets
  const [currentReservations, setCurrentReservations] = useState<any[]>([])
  const [previousReservations, setPreviousReservations] = useState<any[]>([])
  const [currentTransactions, setCurrentTransactions] = useState<any[]>([])
  const [previousTransactions, setPreviousTransactions] = useState<any[]>([])
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([])
  const [todayReservations, setTodayReservations] = useState<any[]>([])
  const [todayTransactions, setTodayTransactions] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [umkmCount, setUmkmCount] = useState<number>(0)
  const [umkmList, setUmkmList] = useState<{ id: string; name: string }[]>([])
  const [profileName, setProfileName] = useState<string>('')

  // Computed Date Ranges
  const currentRange: DateRange = useMemo(() => {
    return getDateRangeFromPreset(selectedPreset, customRangeDates.start, customRangeDates.end)
  }, [selectedPreset, customRangeDates])

  const previousRange = useMemo(() => {
    return getPreviousPeriod(currentRange)
  }, [currentRange])

  // Data Fetching Function (Targeted & Parallelized)
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setIsRefreshing(true)

    try {
      const todayDateStr = new Date().toISOString().split('T')[0]
      const todayStartIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      const todayEndIso = new Date(new Date().setHours(23, 59, 59, 999)).toISOString()

      const startDateStr = currentRange.start.toISOString()
      const endDateStr = currentRange.end.toISOString()
      const startVisitDate = currentRange.start.toISOString().split('T')[0]
      const endVisitDate = currentRange.end.toISOString().split('T')[0]

      const prevStartDateStr = previousRange.start.toISOString()
      const prevEndDateStr = previousRange.end.toISOString()
      const prevStartVisitDate = previousRange.start.toISOString().split('T')[0]
      const prevEndVisitDate = previousRange.end.toISOString().split('T')[0]

      // 1. Current Period Reservations
      let resQuery = supabase
        .from('reservations')
        .select('id, name, email, phone, institution, visit_date, num_visitors, status, created_at')
        .gte('visit_date', startVisitDate)
        .lte('visit_date', endVisitDate)

      // 2. Previous Period Reservations
      let prevResQuery = supabase
        .from('reservations')
        .select('id, num_visitors, status, visit_date')
        .gte('visit_date', prevStartVisitDate)
        .lte('visit_date', prevEndVisitDate)

      // 3. Current Period Transactions
      let trxQuery = supabase
        .from('transactions')
        .select(`
          id,
          umkm_id,
          total_amount,
          status,
          transaction_date,
          customer_name,
          created_at,
          umkm:umkms(id, name),
          items:transaction_items(
            id,
            quantity,
            price_at_time,
            product_id,
            product:products(id, name, image_url, stock, category)
          )
        `)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)

      // 4. Previous Period Transactions
      let prevTrxQuery = supabase
        .from('transactions')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          items:transaction_items(quantity)
        `)
        .gte('created_at', prevStartDateStr)
        .lte('created_at', prevEndDateStr)

      // 5. Today's Reservations (for Today Summary)
      let todayResQuery = supabase
        .from('reservations')
        .select('id, num_visitors, status')
        .eq('visit_date', todayDateStr)
        .neq('status', 'cancelled')

      // 6. Today's Transactions (for Today Summary)
      let todayTrxQuery = supabase
        .from('transactions')
        .select('id, total_amount, status')
        .gte('created_at', todayStartIso)
        .lte('created_at', todayEndIso)
        .neq('status', 'cancelled')

      // 7. Products (for stock alert, top products catalog)
      let prodQuery = supabase
        .from('products')
        .select('id, name, slug, price, stock, sold_count, image_url, minimum_stock, unit, status, umkm_id, umkm:umkms(name)')
        .eq('status', 'active')

      // Filter by UMKM if role is umkm_user
      if (role === 'umkm_user' && myUmkm) {
        trxQuery = trxQuery.eq('umkm_id', myUmkm.id)
        prevTrxQuery = prevTrxQuery.eq('umkm_id', myUmkm.id)
        todayTrxQuery = todayTrxQuery.eq('umkm_id', myUmkm.id)
        prodQuery = prodQuery.eq('umkm_id', myUmkm.id)
      }

      // 8. Active UMKM list (for super_admin/proktor)
      const umkmQuery = supabase
        .from('umkms')
        .select('id, name')
        .eq('status', 'active')

      // 9. Upcoming Reservations (from today onwards, max 5)
      const upcomingQuery = supabase
        .from('reservations')
        .select('id, name, email, phone, institution, visit_date, num_visitors, status, notes, created_at, program_id')
        .gte('visit_date', todayDateStr)
        .neq('status', 'cancelled')
        .order('visit_date', { ascending: true })
        .limit(5)

      // 10. User Profile Name
      const profileQuery = user?.id
        ? supabase.from('user_profiles').select('full_name').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null })

      // Run all queries in parallel
      const [
        { data: resData },
        { data: prevResData },
        { data: trxData },
        { data: prevTrxData },
        { data: todayResData },
        { data: todayTrxData },
        { data: prodData },
        { data: umkmsData, count: umkmsCount },
        { data: upcomingData },
        { data: profileData },
      ] = await Promise.all([
        resQuery,
        prevResQuery,
        trxQuery,
        prevTrxQuery,
        todayResQuery,
        todayTrxQuery,
        prodQuery,
        umkmQuery,
        upcomingQuery,
        profileQuery,
      ])

      setCurrentReservations(resData || [])
      setPreviousReservations(prevResData || [])
      setCurrentTransactions(trxData || [])
      setPreviousTransactions(prevTrxData || [])
      setTodayReservations(todayResData || [])
      setTodayTransactions(todayTrxData || [])
      setAllProducts((prodData || []) as Product[])
      setUmkmList((umkmsData || []) as { id: string; name: string }[])
      setUmkmCount(umkmsCount || (umkmsData?.length || 0))
      setUpcomingReservations((upcomingData || []) as Reservation[])
      if (profileData?.full_name) {
        setProfileName(profileData.full_name)
      }
    } catch (err) {
      console.error('Error loading dashboard analytics:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentRange, previousRange, role, myUmkm, user?.id])

  useEffect(() => {
    fetchDashboardData(true)
  }, [fetchDashboardData])

  // Handle Preset Changes from Header
  const handleSelectPreset = (preset: PeriodPreset, customStart?: Date, customEnd?: Date) => {
    if (preset === 'custom' && customStart && customEnd) {
      setCustomRangeDates({ start: customStart, end: customEnd })
    }
    setSelectedPreset(preset)
  }

  // ── AGGREGATION & DERIVED ANALYTICS ──

  // 1. KPI Stats
  const kpiData: KpiData = useMemo(() => {
    const validCurrentTrx = currentTransactions.filter((t) => t.status !== 'cancelled' && t.status !== 'failed')
    const validPrevTrx = previousTransactions.filter((t) => t.status !== 'cancelled' && t.status !== 'failed')

    const revenue = validCurrentTrx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)
    const previousRevenue = validPrevTrx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)

    const validCurrentRes = currentReservations.filter((r) => r.status !== 'cancelled')
    const validPrevRes = previousReservations.filter((r) => r.status !== 'cancelled')

    const visitors = validCurrentRes.reduce((sum, r) => sum + (Number(r.num_visitors) || 0), 0)
    const previousVisitors = validPrevRes.reduce((sum, r) => sum + (Number(r.num_visitors) || 0), 0)

    const orders = validCurrentTrx.length
    const previousOrders = validPrevTrx.length

    const itemsSold = validCurrentTrx.reduce((sum, t) => {
      const itemsCount = t.items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) || 0
      return sum + itemsCount
    }, 0)

    const previousItemsSold = validPrevTrx.reduce((sum, t) => {
      const itemsCount = t.items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) || 0
      return sum + itemsCount
    }, 0)

    return {
      revenue,
      previousRevenue,
      visitors,
      previousVisitors,
      orders,
      previousOrders,
      itemsSold,
      previousItemsSold,
      umkmCount,
      productsCount: allProducts.length,
    }
  }, [
    currentTransactions,
    previousTransactions,
    currentReservations,
    previousReservations,
    umkmCount,
    allProducts.length,
  ])

  // 2. Growth Rates vs Previous Period
  const kpiGrowth = useMemo(() => {
    return {
      revenue: calculateGrowth(kpiData.revenue, kpiData.previousRevenue),
      visitors: calculateGrowth(kpiData.visitors, kpiData.previousVisitors),
      orders: calculateGrowth(kpiData.orders, kpiData.previousOrders),
      itemsSold: calculateGrowth(kpiData.itemsSold, kpiData.previousItemsSold),
    }
  }, [kpiData])

  // 3. Trend Chart Time-Series Data
  const trendData = useMemo(() => {
    return buildTrendData(currentRange, currentReservations, currentTransactions)
  }, [currentRange, currentReservations, currentTransactions])

  // 4. Top UMKM Ranking
  const topUmkmItems: TopUmkmItem[] = useMemo(() => {
    const umkmMap: Record<string, { id: string; name: string; revenue: number; ordersCount: number }> = {}

    umkmList.forEach((u) => {
      umkmMap[u.id] = { id: u.id, name: u.name, revenue: 0, ordersCount: 0 }
    })

    currentTransactions.forEach((t) => {
      if (t.status === 'cancelled' || t.status === 'failed') return
      const uId = t.umkm_id || t.umkm?.id
      const uName = t.umkm?.name || 'Kebun Kelulut Pusat'
      if (uId) {
        if (!umkmMap[uId]) {
          umkmMap[uId] = { id: uId, name: uName, revenue: 0, ordersCount: 0 }
        }
        umkmMap[uId].revenue += Number(t.total_amount) || 0
        umkmMap[uId].ordersCount += 1
      }
    })

    const totalRev = kpiData.revenue || 1
    return Object.values(umkmMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        name: u.name,
        revenue: u.revenue,
        ordersCount: u.ordersCount,
        percentage: Math.round((u.revenue / totalRev) * 100),
      }))
  }, [umkmList, currentTransactions, kpiData.revenue])

  // 5. Top Products Ranking
  const topProductItems: TopProductItem[] = useMemo(() => {
    const prodMap: Record<
      string,
      { id: string; name: string; image_url: string | null; umkm_name?: string; quantitySold: number; revenue: number; stock: number }
    > = {}

    allProducts.forEach((p) => {
      prodMap[p.id] = {
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        umkm_name: (p as any).umkm?.name,
        quantitySold: 0,
        revenue: 0,
        stock: p.stock,
      }
    })

    currentTransactions.forEach((t) => {
      if (t.status === 'cancelled' || t.status === 'failed') return
      t.items?.forEach((item: any) => {
        const pId = item.product_id || item.product?.id
        if (pId && prodMap[pId]) {
          const qty = Number(item.quantity) || 0
          const price = Number(item.price_at_time) || 0
          prodMap[pId].quantitySold += qty
          prodMap[pId].revenue += qty * price
        }
      })
    })

    const hasPeriodSales = Object.values(prodMap).some((p) => p.quantitySold > 0)
    if (!hasPeriodSales) {
      allProducts.forEach((p) => {
        if (prodMap[p.id]) {
          prodMap[p.id].quantitySold = p.sold_count || 0
          prodMap[p.id].revenue = (p.sold_count || 0) * (p.price || 0)
        }
      })
    }

    const totalSold = Object.values(prodMap).reduce((sum, p) => sum + p.quantitySold, 0) || 1
    return Object.values(prodMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        percentage: Math.round((p.quantitySold / totalSold) * 100),
      }))
  }, [allProducts, currentTransactions])

  // 6. Visitor Demographics
  const visitorDemographics: VisitorTypeStat[] = useMemo(() => {
    const counts: Record<string, number> = {
      Sekolah: 0,
      Instansi: 0,
      Perusahaan: 0,
      Komunitas: 0,
      Umum: 0,
    }

    currentReservations.forEach((r) => {
      if (r.status === 'cancelled') return
      const text = `${r.name || ''} ${r.institution || ''}`.toLowerCase()
      const visitors = Number(r.num_visitors) || 0

      if (text.includes('sd') || text.includes('tk') || text.includes('smp') || text.includes('sma') || text.includes('smk') || text.includes('universitas') || text.includes('kampus') || text.includes('sekolah') || text.includes('paud')) {
        counts['Sekolah'] += visitors
      } else if (text.includes('dinas') || text.includes('kementerian') || text.includes('kantor') || text.includes('kelurahan') || text.includes('kecamatan') || text.includes('desa') || text.includes('balai')) {
        counts['Instansi'] += visitors
      } else if (text.includes('pt') || text.includes('cv') || text.includes('corp') || text.includes('perusahaan') || text.includes('tbk') || text.includes('ltd')) {
        counts['Perusahaan'] += visitors
      } else if (text.includes('komunitas') || text.includes('klub') || text.includes('paguyuban') || text.includes('organisasi') || text.includes('rombongan')) {
        counts['Komunitas'] += visitors
      } else {
        counts['Umum'] += visitors
      }
    })

    const total = Object.values(counts).reduce((s, c) => s + c, 0) || 1
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
  }, [currentReservations])

  // 7. Low Stock Products
  const lowStockProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.stock <= (p.minimum_stock || 10))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
  }, [allProducts])

  // 8. Today Summary Metrics
  const todaySummary = useMemo(() => {
    const visits = todayReservations.length
    const visitors = todayReservations.reduce((sum, r) => sum + (Number(r.num_visitors) || 0), 0)
    const orders = todayTransactions.length
    const lowStock = lowStockProducts.length

    return {
      todayVisitsCount: visits,
      todayVisitorsCount: visitors,
      todayOrdersCount: orders,
      lowStockCount: lowStock,
    }
  }, [todayReservations, todayTransactions, lowStockProducts.length])

  // 9. Recent Activities Feed (Chronological top 6)
  const recentActivities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = []

    currentTransactions.slice(0, 4).forEach((t) => {
      list.push({
        id: `trx-${t.id}`,
        type: 'order',
        title: `Pesanan: ${t.customer_name || 'Pembeli Offline'}`,
        subtitle: `Rp ${(t.total_amount || 0).toLocaleString('id-ID')} (${t.items?.length || 1} produk)`,
        timestamp: t.created_at || t.transaction_date,
      })
    })

    upcomingReservations.slice(0, 4).forEach((r) => {
      list.push({
        id: `res-${r.id}`,
        type: 'reservation',
        title: `Reservasi: ${r.institution || r.name}`,
        subtitle: `${r.num_visitors} orang • Status: ${r.status}`,
        timestamp: r.created_at || r.visit_date,
      })
    })

    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  }, [currentTransactions, upcomingReservations])

  // 10. Business Insights Engine
  const businessInsights = useMemo(() => {
    const topProd = topProductItems[0]
      ? { name: topProductItems[0].name, quantity: topProductItems[0].quantitySold }
      : undefined
    const topU = topUmkmItems[0]
      ? { name: topUmkmItems[0].name, revenue: topUmkmItems[0].revenue }
      : undefined

    return generateBusinessInsights({
      currentRevenue: kpiData.revenue,
      previousRevenue: kpiData.previousRevenue,
      currentVisitors: kpiData.visitors,
      previousVisitors: kpiData.previousVisitors,
      currentOrders: kpiData.orders,
      topProduct: topProd,
      topUmkm: topU,
      lowStockCount: lowStockProducts.length,
      visitorTypes: visitorDemographics,
      periodLabel: currentRange.label,
    })
  }, [kpiData, topProductItems, topUmkmItems, lowStockProducts.length, visitorDemographics, currentRange.label])

  // Clean user display name
  const formattedDisplayName = useMemo(() => {
    if (profileName) return profileName
    if (myUmkm?.name) return myUmkm.name
    if (user?.email) {
      const namePart = user.email.split('@')[0]
      return namePart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return 'Admin'
  }, [profileName, myUmkm?.name, user?.email])

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-12">
      {/* ── ROW 1: HEADER & PERIOD FILTER ── */}
      <DashboardHeader
        userName={formattedDisplayName}
        role={role}
        currentRange={currentRange}
        onSelectPreset={handleSelectPreset}
        onRefresh={() => fetchDashboardData(false)}
        isRefreshing={isRefreshing}
      />

      {/* ── ROW 2: TODAY SUMMARY STRIP (NEW) ── */}
      <TodaySummaryStrip
        todayVisitsCount={todaySummary.todayVisitsCount}
        todayVisitorsCount={todaySummary.todayVisitorsCount}
        todayOrdersCount={todaySummary.todayOrdersCount}
        lowStockCount={todaySummary.lowStockCount}
        loading={loading}
      />

      {/* ── ROW 3: LEVEL 1 HERO KPI & BUSINESS OVERVIEW ── */}
      <KpiOverview
        data={kpiData}
        growth={kpiGrowth}
        role={role}
        loading={loading}
      />

      {/* ── ROW 4: TREN BISNIS (8 cols) & KUNJUNGAN TERDEKAT 2.0 (4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        <div className="lg:col-span-8">
          <BusinessTrendChart
            data={trendData}
            periodLabel={currentRange.label}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-4">
          <UpcomingVisitsCard
            reservations={upcomingReservations}
            loading={loading}
          />
        </div>
      </div>

      {/* ── ROW 5: BUSINESS INSIGHTS (6 cols) & LOW STOCK ALERT (6 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        <div className="lg:col-span-6">
          <BusinessInsights
            insights={businessInsights}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-6">
          <LowStockAlertCard
            products={lowStockProducts}
            loading={loading}
          />
        </div>
      </div>

      {/* ── ROW 6: TOP UMKM (6 cols) & TOP PRODUCTS (6 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        {role !== 'umkm_user' ? (
          <div className="lg:col-span-6">
            <TopUmkmCard
              items={topUmkmItems}
              loading={loading}
            />
          </div>
        ) : (
          <div className="lg:col-span-6">
            <RecentActivityCard
              activities={recentActivities}
              loading={loading}
            />
          </div>
        )}

        <div className="lg:col-span-6">
          <TopProductsCard
            items={topProductItems}
            loading={loading}
          />
        </div>
      </div>

      {/* ── ROW 7: VISITOR ANALYTICS (6 cols) & RECENT ACTIVITIES (6 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        <div className="lg:col-span-6">
          <VisitorDemographicsCard
            data={visitorDemographics}
            totalVisitors={kpiData.visitors}
            loading={loading}
          />
        </div>

        {role !== 'umkm_user' && (
          <div className="lg:col-span-6">
            <RecentActivityCard
              activities={recentActivities}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
