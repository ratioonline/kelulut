import { useEffect, useState, useMemo, useCallback } from 'react'
import { Store, ShoppingCart, List, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import type { Product, Umkm } from '../../types/database'
import { formatCurrency } from '../../lib/utils'
import { ConfirmModal } from '../../components/ui/Modal'

// POS Modular Components
import PosDailySummary, { type PosDailyMetrics } from '../../components/admin/pos/PosDailySummary'
import PosProductGrid, { type ProductWithUmkm } from '../../components/admin/pos/PosProductGrid'
import PosCart, { type CartItem } from '../../components/admin/pos/PosCart'
import PosPaymentModal, { type PaymentMethod } from '../../components/admin/pos/PosPaymentModal'
import PosReceiptModal, { type ReceiptData } from '../../components/admin/pos/PosReceiptModal'
import PosHistoryTable, { type PosTransaction } from '../../components/admin/pos/PosHistoryTable'

export default function AdminTransaksi() {
  const { role, myUmkm, user } = useAuthStore()

  // State: Tab Switcher (pos | history)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos')

  // State: Products & Transactions
  const [products, setProducts] = useState<ProductWithUmkm[]>([])
  const [transactions, setTransactions] = useState<PosTransaction[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // State: POS Search & Filters
  const [productSearch, setProductSearch] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // State: Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // State: Checkout & Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  // State: Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)

  // State: Void / Cancel Modal
  const [voidTarget, setVoidTarget] = useState<PosTransaction | null>(null)
  const [voiding, setVoiding] = useState(false)

  // Debounce product search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  // Fetch Products Catalog & Categories
  const fetchProductsData = useCallback(async () => {
    try {
      let query = supabase
        .from('products')
        .select('*, umkm:umkms(name)')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (role === 'umkm_user' && myUmkm?.id) {
        query = query.eq('umkm_id', myUmkm.id)
      }

      const { data, error } = await query
      if (error) throw error

      if (data) {
        const prodList = data as ProductWithUmkm[]
        setProducts(prodList)

        // Unique Categories
        const cats = Array.from(
          new Set(prodList.map((p) => p.category).filter(Boolean) as string[])
        ).sort()
        setCategories(cats)
      }
    } catch (err) {
      console.error('Error fetching POS products:', err)
      toast.error('Gagal memuat katalog produk kasir')
    }
  }, [role, myUmkm?.id])

  // Fetch Offline / All Transactions History
  const fetchTransactionsData = useCallback(async () => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          umkm:umkms(name),
          items:transaction_items(*, product:products(id, name, unit, umkm:umkms(name)))
        `)
        .order('created_at', { ascending: false })

      if (role === 'umkm_user' && myUmkm?.id) {
        query = query.eq('umkm_id', myUmkm.id)
      }

      const { data, error } = await query
      if (error) throw error

      if (data) {
        setTransactions(data as unknown as PosTransaction[])
      }
    } catch (err) {
      console.error('Error fetching transactions history:', err)
    }
  }, [role, myUmkm?.id])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchProductsData(), fetchTransactionsData()])
    setLoading(false)
  }, [fetchProductsData, fetchTransactionsData])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Today Daily Summary Metrics
  const todayDailyMetrics: PosDailyMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayTrx = transactions.filter((t) => {
      const tDate = new Date(t.created_at || t.transaction_date).toISOString().split('T')[0]
      return tDate === todayStr && t.status !== 'cancelled' && t.status !== 'failed'
    })

    const totalRev = todayTrx.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)
    const totalItems = todayTrx.reduce(
      (sum, t) => sum + (t.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 1),
      0
    )

    const cashierEmail = user?.email || 'admin@kebunkelulut.my.id'
    const cashierDisplayName = cashierEmail.split('@')[0].replace(/[._-]/g, ' ')

    return {
      totalTrxToday: todayTrx.length,
      totalRevenueToday: totalRev,
      totalItemsToday: totalItems,
      cashierName: cashierDisplayName.replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  }, [transactions, user?.email])

  // Filtered Products Showcase
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false
      }

      // Search filter
      if (debouncedProductSearch) {
        const q = debouncedProductSearch.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchSku = p.sku?.toLowerCase().includes(q)
        const matchCat = p.category?.toLowerCase().includes(q)
        const matchUmkm = p.umkm?.name?.toLowerCase().includes(q)
        if (!matchName && !matchSku && !matchCat && !matchUmkm) return false
      }

      return true
    })
  }, [products, selectedCategory, debouncedProductSearch])

  // Cart Map (Product ID -> quantity in cart)
  const cartMap = useMemo(() => {
    const map: Record<string, number> = {}
    cart.forEach((item) => {
      map[item.product.id] = item.quantity
    })
    return map
  }, [cart])

  // Cart Handlers
  const handleAddToCart = (product: ProductWithUmkm) => {
    if ((product.stock || 0) <= 0) {
      toast.error('Stok produk habis')
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= (product.stock || 0)) {
          toast.error(`Maksimal stok tercapai (${product.stock} ${product.unit || 'pcs'})`)
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQty > (product.stock || 0)) {
      toast.error(`Jumlah melebihi sisa stok (${product.stock} ${product.unit || 'pcs'})`)
      return
    }

    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId))
      return
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    )
  }

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => {
    setCart([])
    setCustomerName('')
  }

  const totalCartAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product.discount_price || item.product.price || 0
      return sum + price * item.quantity
    }, 0)
  }, [cart])

  // Process Payment & Complete Checkout
  const handleProcessPayment = async (
    method: PaymentMethod,
    cashGiven: number,
    change: number
  ) => {
    if (cart.length === 0 || isSubmittingPayment) return
    setIsSubmittingPayment(true)

    try {
      const umkmId = role === 'umkm_user' ? myUmkm?.id || null : null
      const formattedCustomer = customerName.trim() || 'Pembeli Offline'
      const trxDateStr = new Date().toISOString()
      const trxNumber = `KBN-${new Date().toISOString().replace(/\D/g, '').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`

      // 1. Insert Transaction Record
      const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .insert({
          umkm_id: umkmId,
          total_amount: totalCartAmount,
          type: 'offline',
          status: 'completed',
          customer_name: `${formattedCustomer} (${method.toUpperCase()})`,
          created_at: trxDateStr,
        })
        .select()
        .single()

      if (trxErr) throw new Error(trxErr.message)

      // 2. Insert Transaction Items & Decrease Stock & Log Movement
      for (const item of cart) {
        const unitPrice = item.product.discount_price || item.product.price || 0

        // Insert Item
        await supabase.from('transaction_items').insert({
          transaction_id: trx.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_at_time: unitPrice,
        })

        // Update Stock in products table
        const nextStock = Math.max(0, (item.product.stock || 0) - item.quantity)
        const nextSold = (item.product.sold_count || 0) + item.quantity

        await supabase
          .from('products')
          .update({
            stock: nextStock,
            sold_count: nextSold,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.product.id)

        // Log to stock_movements
        await supabase.from('stock_movements').insert({
          product_id: item.product.id,
          previous_stock: item.product.stock || 0,
          quantity: item.quantity,
          movement_type: 'subtract',
          new_stock: nextStock,
          reason: `Kasir offline (Trx: ${trxNumber})`,
        })
      }

      toast.success('Transaksi berhasil disimpan & stok diperbarui!')

      // Prepare Receipt Data
      const receipt: ReceiptData = {
        transactionNumber: trxNumber,
        date: trxDateStr,
        cashierName: todayDailyMetrics.cashierName,
        customerName: formattedCustomer,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.discount_price || i.product.price || 0,
          subtotal: (i.product.discount_price || i.product.price || 0) * i.quantity,
        })),
        totalAmount: totalCartAmount,
        paymentMethod: method,
        cashGiven: method === 'cash' ? cashGiven : undefined,
        change: method === 'cash' ? change : undefined,
      }

      setReceiptData(receipt)
      setPaymentModalOpen(false)
      setMobileCartOpen(false)
      setReceiptModalOpen(true)
      handleClearCart()

      // Refresh data
      await loadAllData()
    } catch (err: any) {
      console.error('Checkout error:', err)
      toast.error(`Gagal memproses pembayaran: ${err.message}`)
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // Void / Cancel Transaction with Atomic Stock Rollback
  const handleExecuteVoid = async () => {
    if (!voidTarget) return
    setVoiding(true)

    try {
      // 1. Mark transaction as cancelled
      const { error: trxErr } = await supabase
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('id', voidTarget.id)

      if (trxErr) throw trxErr

      // 2. Return product stocks
      if (voidTarget.items && voidTarget.items.length > 0) {
        for (const item of voidTarget.items) {
          const { data: currentProd } = await supabase
            .from('products')
            .select('stock, sold_count')
            .eq('id', item.product_id)
            .single()

          if (currentProd) {
            const restoredStock = (currentProd.stock || 0) + item.quantity
            const restoredSold = Math.max(0, (currentProd.sold_count || 0) - item.quantity)

            await supabase
              .from('products')
              .update({
                stock: restoredStock,
                sold_count: restoredSold,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product_id)

            // Log rollback
            await supabase.from('stock_movements').insert({
              product_id: item.product_id,
              previous_stock: currentProd.stock || 0,
              quantity: item.quantity,
              movement_type: 'add',
              new_stock: restoredStock,
              reason: `Void transaksi offline (Trx: ${voidTarget.id.slice(0, 8)})`,
            })
          }
        }
      }

      toast.success(`Transaksi berhasil dibatalkan dan stok dikembalikan!`)
      setVoidTarget(null)
      await loadAllData()
    } catch (err: any) {
      console.error('Void error:', err)
      toast.error(`Gagal membatalkan transaksi: ${err.message}`)
    } finally {
      setVoiding(false)
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-12">
      {/* ── HEADER & TAB SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
            Kasir Penjualan (POS)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Point of Sales kasir offline, sinkronisasi stok otomatis, dan pencatatan omzet.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'pos'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Store size={13} className="text-[#2D6A4F]" />
            <span>POS Kasir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List size={13} className="text-blue-600" />
            <span>Riwayat Transaksi</span>
          </button>
        </div>
      </div>

      {/* ── DAILY SALES SUMMARY STRIP ── */}
      <PosDailySummary metrics={todayDailyMetrics} loading={loading} />

      {/* ── TAB 1: POS VIEW (2-COLUMN) ── */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Product Showcase (8 cols on lg, 7 on xl) */}
          <div className="lg:col-span-8 xl:col-span-8">
            <PosProductGrid
              products={filteredProducts}
              categories={categories}
              search={productSearch}
              onSearchChange={setProductSearch}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              cartMap={cartMap}
              onAddToCart={handleAddToCart}
              loading={loading}
            />
          </div>

          {/* Right: Cart (4 cols on lg, 4 on xl) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4">
            <PosCart
              cart={cart}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={() => setPaymentModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSACTION HISTORY VIEW ── */}
      {activeTab === 'history' && (
        <PosHistoryTable
          transactions={transactions}
          loading={loading}
          onPrintReceipt={(t) => {
            const receipt: ReceiptData = {
              transactionNumber: `KBN-${new Date(t.created_at || t.transaction_date).toISOString().replace(/\D/g, '').slice(0, 8)}-${t.id.slice(0, 4)}`,
              date: t.created_at || t.transaction_date,
              cashierName: todayDailyMetrics.cashierName,
              customerName: t.customer_name,
              items:
                t.items?.map((i) => ({
                  name: i.product?.name || 'Produk',
                  quantity: i.quantity,
                  price: i.price_at_time,
                  subtotal: i.price_at_time * i.quantity,
                })) || [],
              totalAmount: t.total_amount,
              paymentMethod: t.customer_name?.includes('QRIS')
                ? 'QRIS'
                : t.customer_name?.includes('TRANSFER')
                ? 'Transfer'
                : 'Tunai (Cash)',
            }
            setReceiptData(receipt)
            setReceiptModalOpen(true)
          }}
          onQuickView={(t) => {
            toast(`Detail transaksi #${t.id.slice(0, 8)} (${t.items?.length || 1} produk)`, {
              icon: 'ℹ️',
            })
          }}
          onVoidTransaction={(t) => setVoidTarget(t)}
        />
      )}

      {/* ── MOBILE STICKY CART BAR (Below lg) ── */}
      {activeTab === 'pos' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-2xl z-40">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <span className="text-[10px] text-gray-500 block">
                {cart.reduce((s, i) => s + i.quantity, 0)} item dalam keranjang
              </span>
              <span className="font-mono font-black text-sm text-emerald-800">
                {formatCurrency(totalCartAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2D6A4F] text-white hover:bg-[#1B4332] shadow-md flex items-center gap-1.5"
            >
              <span>Bayar Sekarang</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Payment Modal */}
      <PosPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalAmount={totalCartAmount}
        customerName={customerName}
        onProcessPayment={handleProcessPayment}
        isSubmitting={isSubmittingPayment}
      />

      {/* 2. Receipt Modal (Print-Ready) */}
      <PosReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        data={receiptData}
      />

      {/* 3. Void / Cancel Confirmation Modal */}
      <ConfirmModal
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleExecuteVoid}
        title="Batalkan / Void Transaksi"
        message={`Batalkan transaksi sebesar ${formatCurrency(
          voidTarget?.total_amount || 0
        )}? Stok dari seluruh item pada transaksi ini akan otomatis dikembalikan ke etalase.`}
        confirmText="Void & Kembalikan Stok"
        confirmVariant="danger"
        loading={voiding}
      />
    </div>
  )
}
