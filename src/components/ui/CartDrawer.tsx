import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency } from '../../lib/utils'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalItems, totalPrice } =
    useCartStore()

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const waMsg = () => {
    if (items.length === 0) return
    const lines = items.map(
      (i) =>
        `• ${i.product.name} x${i.quantity} = ${formatCurrency(
          (i.product.discount_price ?? i.product.price ?? 0) * i.quantity
        )}`
    )
    const total = formatCurrency(totalPrice())
    const text =
      `Halo, saya ingin memesan:\n${lines.join('\n')}\n\nTotal: ${total}\n\nMohon konfirmasi ketersediaan stok. Terima kasih!`
    window.open(`https://wa.me/6282272611515?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Keranjang belanja"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#2D6A4F]" />
            Keranjang
            {totalItems() > 0 && (
              <span className="bg-[#F5A623] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems()}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Tutup keranjang"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Keranjang masih kosong</p>
              <p className="text-sm text-gray-400 mt-1">Yuk, tambahkan produk dulu!</p>
              <button
                onClick={closeCart}
                className="mt-5 text-sm text-[#2D6A4F] font-semibold underline"
              >
                Lihat Produk
              </button>
            </div>
          ) : (
            items.map((item) => {
              const price = item.product.discount_price ?? item.product.price ?? 0
              const thumb =
                (item.product.images?.length ? item.product.images[0] : null) ??
                item.product.image_url ??
                'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=100'

              return (
                <div key={item.product.id} className="flex gap-3">
                  <Link to={`/produk/${item.product.slug}`} onClick={closeCart}>
                    <img
                      src={thumb}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/produk/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#2D6A4F]"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm font-bold text-[#F5A623] mt-0.5">
                      {formatCurrency(price)}
                    </p>

                    {/* Qty controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total ({totalItems()} item)</span>
              <span className="text-lg font-bold text-[#1B4332]">
                {formatCurrency(totalPrice())}
              </span>
            </div>
            <button
              onClick={waMsg}
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {/* WA icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Pesan via WhatsApp
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
