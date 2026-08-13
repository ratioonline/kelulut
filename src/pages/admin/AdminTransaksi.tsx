import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardBody } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import type { Product } from '../../types/database'
import { formatCurrency } from '../../lib/utils'

type TransactionItem = {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  price_at_time: number
  product: Product
}

type Transaction = {
  id: string
  umkm_id: string | null
  total_amount: number
  status: string
  transaction_date: string
  type: string
  customer_name: string | null
  created_at: string
  items: TransactionItem[]
  umkm?: { name: string }
}

export default function AdminTransaksi() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([])
  const [customerName, setCustomerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { role, myUmkm } = useAuthStore()

  const fetchTransactions = async () => {
    setLoading(true)
    let query = supabase.from('transactions').select(`
      *,
      umkm:umkms(name),
      items:transaction_items(*, product:products(*))
    `).order('created_at', { ascending: false })

    if (role === 'umkm_user' && myUmkm) {
      query = query.eq('umkm_id', myUmkm.id)
    }

    const { data, error } = await query
    
    if (error) {
      toast.error('Gagal memuat transaksi')
    } else {
      setTransactions(data as unknown as Transaction[])
    }
    setLoading(false)
  }

  const fetchProducts = async () => {
    let query = supabase.from('products').select('*').eq('status', 'active')
    if (role === 'umkm_user' && myUmkm) {
      query = query.eq('umkm_id', myUmkm.id)
    }
    const { data } = await query
    if (data) setProducts(data as Product[])
  }

  useEffect(() => {
    fetchTransactions()
    fetchProducts()
  }, [role, myUmkm])

  const openCreate = () => {
    setCart([])
    setCustomerName('')
    setModalOpen(true)
  }

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Stok produk habis')
      return
    }
    setCart(prev => {
      const exist = prev.find(p => p.product.id === product.id)
      if (exist) {
        if (exist.quantity >= product.stock) {
          toast.error('Jumlah melebihi stok yang tersedia')
          return prev
        }
        return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    if (qty > product.stock) {
      toast.error('Jumlah melebihi stok')
      return
    }
    if (qty <= 0) {
      setCart(prev => prev.filter(p => p.product.id !== productId))
      return
    }
    setCart(prev => prev.map(p => p.product.id === productId ? { ...p, quantity: qty } : p))
  }

  const totalAmount = cart.reduce((sum, item) => sum + ((item.product.discount_price || item.product.price) * item.quantity), 0)

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong')
      return
    }
    
    setIsSubmitting(true)
    try {
      const umkmId = role === 'umkm_user' ? (myUmkm?.id || null) : null

      // 1. Create Transaction
      const { data: trx, error: trxErr } = await supabase.from('transactions').insert({
        umkm_id: umkmId,
        total_amount: totalAmount,
        type: 'offline',
        status: 'completed',
        customer_name: customerName || 'Pembeli Offline'
      }).select().single()

      if (trxErr) throw new Error(trxErr.message)

      // 2. Insert Items & Decrease Stock
      for (const item of cart) {
        const priceAtTime = item.product.discount_price || item.product.price
        
        await supabase.from('transaction_items').insert({
          transaction_id: trx.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_at_time: priceAtTime
        })

        // Decrease stock
        await supabase.from('products')
          .update({ stock: item.product.stock - item.quantity, sold_count: (item.product.sold_count || 0) + item.quantity })
          .eq('id', item.product.id)
          
        // Log movement
        await supabase.from('stock_movements').insert({
          product_id: item.product.id,
          previous_stock: item.product.stock,
          quantity: item.quantity,
          movement_type: 'subtract',
          new_stock: item.product.stock - item.quantity,
          reason: `Terjual offline (Trx: ${trx.id})`
        })
      }

      toast.success('Transaksi berhasil disimpan')
      setModalOpen(false)
      fetchTransactions()
      fetchProducts() // Refresh stocks
    } catch (err: any) {
      toast.error(`Gagal menyimpan transaksi: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penjualan Kasir (Offline)</h1>
          <p className="text-sm text-gray-500 mt-1">Catat transaksi penjualan offline untuk sinkronisasi stok dan pendapatan.</p>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} /> Transaksi Baru</Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Belum ada transaksi offline.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pembeli</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{trx.customer_name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {trx.items?.map(i => `${i.product?.name} (${i.quantity}x)`).join(', ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#F5A623]">{formatCurrency(trx.total_amount)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md">
                          <CheckCircle2 size={12} /> Selesai
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Kasir Penjualan Offline"
        size="lg"
        footer={
          <>
            <div className="flex-1 text-left">
              <span className="text-sm text-gray-500">Total Tagihan:</span>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} loading={isSubmitting} disabled={cart.length === 0}>Simpan Transaksi</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[50vh]">
          {/* Product List */}
          <div className="border-r border-gray-100 pr-4 flex flex-col h-full">
            <h3 className="font-semibold text-gray-900 mb-3">Pilih Produk</h3>
            <div className="overflow-y-auto flex-1 space-y-2 pr-2">
              {products.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${p.stock <= 0 ? 'bg-gray-50 opacity-50' : 'hover:border-[#2D6A4F] hover:bg-green-50/30'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(p.discount_price || p.price)} • Stok: {p.stock}</p>
                  </div>
                  <Plus size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="flex flex-col h-full">
            <h3 className="font-semibold text-gray-900 mb-3">Keranjang ({cart.length} item)</h3>
            
            <div className="mb-4">
              <Input 
                label="Nama Pelanggan (Opsional)" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="mis. Bpk. Budi"
                size="sm"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm text-gray-900">{item.product.name}</p>
                    <button onClick={() => updateQuantity(item.product.id, 0)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-[#F5A623]">{formatCurrency((item.product.discount_price || item.product.price) * item.quantity)}</p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-white border flex items-center justify-center font-bold text-gray-600"
                      >-</button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-white border flex items-center justify-center font-bold text-gray-600"
                      >+</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-10">Belum ada produk yang dipilih</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
