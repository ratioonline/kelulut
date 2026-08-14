import { ShoppingCart, Trash2, Plus, Minus, X, User, ArrowRight } from 'lucide-react'
import type { Product } from '../../../types/database'
import { formatCurrency } from '../../../lib/utils'

export interface CartItem {
  product: Product & { umkm?: { name: string } | null }
  quantity: number
}

interface PosCartProps {
  cart: CartItem[]
  customerName: string
  onCustomerNameChange: (val: string) => void
  onUpdateQuantity: (productId: string, qty: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCheckout: () => void
}

export default function PosCart({
  cart,
  customerName,
  onCustomerNameChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: PosCartProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.price || 0
    return sum + price * item.quantity
  }, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-3.5 sm:p-4 flex flex-col justify-between h-full sticky top-4">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingCart size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Keranjang Kasir</h2>
              <p className="text-[10px] text-gray-400 font-mono">
                {totalItems} item dipilih
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold hover:underline flex items-center gap-0.5"
              title="Kosongkan keranjang"
            >
              <Trash2 size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Customer Name Input */}
        <div className="mt-3 relative">
          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Nama pembeli (opsional)..."
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all"
          />
        </div>

        {/* Cart Items List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-340px)] min-h-[160px] pr-0.5">
          {cart.length > 0 ? (
            cart.map((item) => {
              const price = item.product.discount_price || item.product.price || 0
              const lineTotal = price * item.quantity
              const isMaxStock = item.quantity >= (item.product.stock || 0)

              return (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-xs truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {formatCurrency(price)} / {item.product.unit || 'pcs'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-gray-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                      title="Hapus dari keranjang"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Quantity Stepper & Line Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Minus size={11} />
                      </button>

                      <span className="w-6 text-center font-mono font-bold text-xs text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={isMaxStock}
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isMaxStock
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={isMaxStock ? 'Stok maksimal tercapai' : 'Tambah'}
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <span className="font-mono font-black text-emerald-800 text-xs">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs space-y-1">
              <ShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="font-medium text-gray-500">Keranjang masih kosong</p>
              <p className="text-[11px]">Pilih produk di sebelah kiri untuk memulai transaksi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Footer Summary & Checkout Button */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5 mt-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Total Item:</span>
            <span className="font-mono font-semibold text-gray-900">{totalItems} pcs</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100">
            <span className="font-bold text-gray-800">Total Tagihan:</span>
            <span className="font-mono font-black text-lg text-emerald-800">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={onCheckout}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
            cart.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#2D6A4F] text-white hover:bg-[#1B4332] hover:scale-[1.01]'
          }`}
        >
          <span>BAYAR PESANAN ({formatCurrency(totalAmount)})</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
