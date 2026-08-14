import { useState, useEffect, useMemo } from 'react'
import {
  Store,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfMonth, startOfYear } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { supabase } from '../../../lib/supabase'
import type { Umkm, Product, Transaction } from '../../../types/database'
import { formatCurrency } from '../../../lib/utils'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { normalizeWhatsappNumber, type UmkmWithStats } from './UmkmCardGrid'

interface UmkmDetailModalProps {
  umkm: UmkmWithStats | null
  open: boolean
  onClose: () => void
  onEdit: (umkm: UmkmWithStats) => void
  onToggleStatus: (umkm: UmkmWithStats) => void
  onAddProduct: (umkm: UmkmWithStats) => void
}

type PeriodFilter = 'all' | '7days' | '30days' | 'month' | 'year'

export default function UmkmDetailModal({
  umkm,
  open,
  onClose,
  onEdit,
  onToggleStatus,
  onAddProduct,
}: UmkmDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'sales' | 'info'>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [salesPeriod, setSalesPeriod] = useState<PeriodFilter>('30days')

  // Fetch products & transactions for this specific UMKM when opened
  useEffect(() => {
    if (open && umkm) {
      const fetchData = async () => {
        setLoadingData(true)
        try {
          const [
            { data: prodData },
            { data: trxData },
          ] = await Promise.all([
            supabase
              .from('products')
              .select('*')
              .eq('umkm_id', umkm.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('transactions')
              .select(`
                id,
                total_amount,
                status,
                transaction_date,
                customer_name,
                created_at,
                items:transaction_items(id, quantity, price_at_time, product:products(name))
              `)
              .eq('umkm_id', umkm.id)
              .order('created_at', { ascending: false }),
          ])

          setProducts((prodData || []) as Product[])
          setTransactions(trxData || [])
        } catch (err) {
          console.error('Error fetching UMKM detail data:', err)
        } finally {
          setLoadingData(false)
        }
      }
      fetchData()
    }
  }, [open, umkm])

  // Filtered Transactions by Period
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return []
    const now = new Date()

    return transactions.filter((t) => {
      if (t.status === 'cancelled' || t.status === 'failed') return false
      const tDate = new Date(t.created_at || t.transaction_date)

      switch (salesPeriod) {
        case '7days':
          return tDate >= subDays(now, 7)
        case '30days':
          return tDate >= subDays(now, 30)
        case 'month':
          return tDate >= startOfMonth(now)
        case 'year':
          return tDate >= startOfYear(now)
        case 'all':
        default:
          return true
      }
    })
  }, [transactions, salesPeriod])

  // Overview Metrics
  const overviewStats = useMemo(() => {
    const totalProd = products.length
    const activeProd = products.filter((p) => p.status === 'active' && p.is_available).length
    const totalSoldUnits = products.reduce((s, p) => s + (p.sold_count || 0), 0)
    const validTrx = transactions.filter((t) => t.status !== 'cancelled' && t.status !== 'failed')
    const totalOmzet = validTrx.reduce((s, t) => s + (Number(t.total_amount) || 0), 0)
    const avgOrder = validTrx.length > 0 ? Math.round(totalOmzet / validTrx.length) : 0

    return {
      totalProd,
      activeProd,
      totalSoldUnits,
      totalOmzet,
      avgOrder,
      trxCount: validTrx.length,
    }
  }, [products, transactions])

  // Top 5 Products Leaderboard
  const topProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5)
    const maxSold = sorted[0]?.sold_count || 1
    return sorted.map((p) => ({
      ...p,
      percentage: Math.round(((p.sold_count || 0) / maxSold) * 100),
    }))
  }, [products])

  // Chart Time Series Data
  const chartData = useMemo(() => {
    const bins: Record<string, { label: string; Pendapatan: number }> = {}
    const now = new Date()

    // Default last 7 daily bins
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i)
      const key = format(d, 'yyyy-MM-dd')
      bins[key] = { label: format(d, 'd MMM', { locale: idLocale }), Pendapatan: 0 }
    }

    filteredTransactions.forEach((t) => {
      const d = new Date(t.created_at || t.transaction_date)
      const key = format(d, 'yyyy-MM-dd')
      if (bins[key]) {
        bins[key].Pendapatan += Number(t.total_amount) || 0
      }
    })

    return Object.values(bins)
  }, [filteredTransactions])

  if (!umkm) return null

  const waNumber = normalizeWhatsappNumber(umkm.whatsapp)
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null
  const isActive = umkm.status === 'active'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Mitra UMKM"
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(umkm)}
              className="text-gray-700 hover:bg-gray-100"
            >
              {isActive ? 'Nonaktifkan UMKM' : 'Aktifkan UMKM'}
            </Button>
            {umkm.slug && (
              <a
                href={`/umkm/${umkm.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#2D6A4F] transition-colors"
              >
                <ExternalLink size={12} />
                <span>Halaman Publik</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                onClose()
                onEdit(umkm)
              }}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              <Pencil size={13} />
              <span>Edit Profil</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Identity Card */}
        <div className="rounded-2xl border border-gray-200/80 overflow-hidden bg-white">
          <div className="h-20 w-full bg-linear-to-r from-[#2D6A4F]/20 via-emerald-600/15 to-teal-600/20 relative">
            {umkm.cover_image && (
              <img src={umkm.cover_image} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2.5 right-2.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                }`}
              >
                {isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          <div className="px-4 pb-3 -mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-sm border border-gray-200/70 overflow-hidden shrink-0">
                {umkm.logo ? (
                  <img
                    src={umkm.logo}
                    alt={umkm.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white font-black text-xl">
                    {umkm.name ? umkm.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-base font-black text-gray-900">{umkm.name}</h2>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <User size={12} className="text-gray-400" />
                  <span>Pemilik: <strong>{umkm.owner_name || 'Belum diisi'}</strong></span>
                  {umkm.city && (
                    <span className="text-gray-400">• <MapPin size={11} className="inline" /> {umkm.city}</span>
                  )}
                </p>
              </div>
            </div>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors self-start sm:self-auto"
              >
                <MessageCircle size={13} className="text-emerald-600" />
                <span>WhatsApp: {umkm.whatsapp}</span>
              </a>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-gray-200 pb-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan & Tren' },
            { id: 'products', label: `Katalog Produk (${products.length})` },
            { id: 'sales', label: `Riwayat Penjualan (${transactions.length})` },
            { id: 'info', label: 'Profil & Legalitas' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5 animate-in fade-in duration-100">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Total Produk</span>
                <p className="text-lg font-black text-gray-900 font-mono mt-0.5">
                  {overviewStats.totalProd} <span className="text-[10px] text-gray-400 font-normal">item</span>
                </p>
              </div>

              <div className="p-3 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Produk Aktif</span>
                <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                  {overviewStats.activeProd} <span className="text-[10px] text-gray-400 font-normal">item</span>
                </p>
              </div>

              <div className="p-3 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Total Terjual</span>
                <p className="text-lg font-black text-blue-700 font-mono mt-0.5">
                  {overviewStats.totalSoldUnits.toLocaleString('id-ID')} <span className="text-[10px] text-gray-400 font-normal">pcs</span>
                </p>
              </div>

              <div className="p-3 rounded-xl border border-gray-200/70 bg-white">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Total Omzet</span>
                <p className="text-lg font-black text-amber-700 font-mono mt-0.5">
                  {formatCurrency(overviewStats.totalOmzet)}
                </p>
              </div>
            </div>

            {/* Mini Performance Chart + Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Mini Trend Chart (7 cols) */}
              <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border border-gray-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[#2D6A4F]" />
                    Tren Penjualan 7 Hari Terakhir
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUmkmSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}rb` : String(v))}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Pendapatan']}
                      />
                      <Area
                        type="monotone"
                        dataKey="Pendapatan"
                        stroke="#2D6A4F"
                        strokeWidth={2}
                        fill="url(#colorUmkmSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products Leaderboard (5 cols) */}
              <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border border-gray-200/80">
                <span className="text-xs font-bold text-gray-900 block mb-2">
                  🥇 Produk Terlaris UMKM
                </span>

                {topProducts.length > 0 ? (
                  <div className="space-y-2">
                    {topProducts.map((p, idx) => (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 truncate max-w-[150px]">
                            {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `${idx + 1}. `}
                            {p.name}
                          </span>
                          <span className="font-mono text-gray-500 text-[11px]">
                            {p.sold_count || 0} terjual
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${p.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-6 text-center">Belum ada produk terdaftar</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PRODUK UMKM ── */}
        {activeTab === 'products' && (
          <div className="space-y-3 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Daftar Produk ({products.length})</span>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onAddProduct(umkm)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors shadow-2xs"
              >
                <Plus size={12} />
                <span>Tambah Produk UMKM Ini</span>
              </button>
            </div>

            {products.length > 0 ? (
              <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
                {products.map((p) => (
                  <div key={p.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.category || 'Umum'} • Stok: {p.stock} {p.unit || 'pcs'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-emerald-800 font-mono text-xs">
                        {formatCurrency(p.price || 0)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.status === 'active' ? 'Aktif' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                UMKM ini belum memiliki produk terdaftar.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: PENJUALAN UMKM ── */}
        {activeTab === 'sales' && (
          <div className="space-y-3 animate-in fade-in duration-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {(['30days', 'month', 'year', 'all'] as PeriodFilter[]).map((pf) => (
                  <button
                    key={pf}
                    type="button"
                    onClick={() => setSalesPeriod(pf)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      salesPeriod === pf
                        ? 'bg-[#2D6A4F] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pf === '30days' ? '30 Hari' : pf === 'month' ? 'Bulan Ini' : pf === 'year' ? 'Tahun Ini' : 'Semua'}
                  </button>
                ))}
              </div>

              <span className="text-xs font-mono text-gray-500">
                Total: <strong>{formatCurrency(filteredTransactions.reduce((s, t) => s + (Number(t.total_amount) || 0), 0))}</strong>
              </span>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">
                        {t.customer_name || 'Pembeli Langsung'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {format(new Date(t.created_at || t.transaction_date), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                        {' • '}
                        {t.items?.length || 1} produk
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-800 font-mono">
                        {formatCurrency(t.total_amount || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                Belum ada transaksi penjualan pada rentang waktu ini.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: INFORMASI & LEGALITAS ── */}
        {activeTab === 'info' && (
          <div className="space-y-3 text-xs text-gray-700 animate-in fade-in duration-100">
            {umkm.short_description && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                <span className="font-bold text-gray-900 block mb-1">Tagline:</span>
                <p className="italic text-gray-600">"{umkm.short_description}"</p>
              </div>
            )}

            {umkm.description && (
              <div className="p-3 rounded-xl bg-white border border-gray-200/70">
                <span className="font-bold text-gray-900 block mb-1">Deskripsi Lengkap Usaha:</span>
                <p className="leading-relaxed whitespace-pre-line text-gray-600">{umkm.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white border border-gray-200/70 space-y-1.5">
                <span className="font-bold text-gray-900 block">Alamat & Lokasi</span>
                <p className="text-gray-600">{umkm.address || 'Alamat belum diatur'}</p>
                <p className="text-gray-400">{umkm.city ? `${umkm.city}, ${umkm.province || ''} ${umkm.postal_code || ''}` : '-'}</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-gray-200/70 space-y-1.5">
                <span className="font-bold text-gray-900 block">Kontak & Tautan</span>
                <p className="text-gray-600">WhatsApp: {umkm.whatsapp || '-'}</p>
                <p className="text-gray-600">Email: {umkm.email || '-'}</p>
                {umkm.website && <p className="text-emerald-700 underline truncate">{umkm.website}</p>}
                {umkm.instagram && <p className="text-pink-600">{umkm.instagram}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
