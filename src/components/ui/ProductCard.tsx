import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import type { Product } from '../../types/database'
import { useCartStore } from '../../stores/cartStore'
import StarRating from './StarRating'

interface ProductCardProps {
  product: Product
  isTop?: boolean
  salesRibbon?: string
  showBadge?: boolean
  className?: string
}

function ProductCard({
  product,
  isTop = false,
  salesRibbon,
  showBadge = true,
  className,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  const hasDiscount = product.discount_price !== null && product.discount_price !== undefined
  const displayPrice = hasDiscount ? product.discount_price! : (product.price ?? 0)
  const originalPrice = product.price ?? 0
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : 0

  const thumb = (() => {
    const raw =
      (product.images?.length ? product.images[0] : null) ??
      product.image_url ??
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=400&q=60'
    // Resize gambar Supabase Storage untuk thumbnail
    if (raw.includes('supabase') && raw.includes('/storage/')) {
      const separator = raw.includes('?') ? '&' : '?'
      return `${raw}${separator}width=300&quality=75`
    }
    return raw
  })()

  return (
    <div
      className={cn(
        'group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/80',
        'hover:shadow-md hover:border-[#2D6A4F]/40 transition-all duration-200 flex flex-col justify-between',
        className
      )}
    >
      {/* ── Thumbnail Section ── */}
      <Link to={`/produk/${product.slug}`} className="block relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={thumb}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* TOP Badge (Shopee Style) */}
        {isTop && (
          <div className="absolute top-0 left-0 bg-[#FF5722] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-br-md shadow flex items-center gap-0.5 uppercase tracking-wider">
            TOP
          </div>
        )}

        {/* Star / Promo Badge (Shopee Style) */}
        {showBadge && !isTop && (
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {(product.rating ?? 5) >= 4.5 && (
              <span className="bg-[#EE4D2D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <Star size={9} fill="currentColor" /> Star+
              </span>
            )}
            {hasDiscount && (
              <span className="bg-[#F5A623] text-gray-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm uppercase">
                Promo
              </span>
            )}
          </div>
        )}

        {/* Discount Badge (Top Right) */}
        {hasDiscount && discountPct > 0 && (
          <div className="absolute top-0 right-0 bg-[#FFE880] text-[#EE4D2D] text-[11px] font-bold px-1.5 py-1 rounded-bl-lg shadow-sm flex flex-col items-center leading-none">
            <span>{discountPct}%</span>
            <span className="text-[8px] uppercase font-normal text-gray-700">OFF</span>
          </div>
        )}

        {/* Sales Ribbon Overlay (Bottom of image) */}
        {salesRibbon && (
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium py-1 px-2 text-center truncate">
            {salesRibbon}
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-300 px-2.5 py-1 rounded-full shadow-sm">
              Stok Habis
            </span>
          </div>
        )}
      </Link>

      {/* ── Info Section ── */}
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        <div className="space-y-1">
          <Link
            to={`/produk/${product.slug}`}
            className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#EE4D2D] leading-snug transition-colors"
          >
            {product.name}
          </Link>

          {/* Price row (Shopee style bold red/orange price) */}
          <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
            <span className="text-sm sm:text-base font-extrabold text-[#EE4D2D]">
              {formatCurrency(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Rating + Sold count row */}
        <div className="pt-1 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1">
              <StarRating value={product.rating ?? 5} size={10} showValue={false} />
              <span className="text-[10px] text-gray-400">({product.rating ?? '5.0'})</span>
            </div>
            <span>
              {(product.sold_count ?? 0) > 0
                ? `${product.sold_count > 1000 ? `${(product.sold_count / 1000).toFixed(1)}RB+` : product.sold_count} terjual`
                : 'Baru'}
            </span>
          </div>

          {/* Add to cart button */}
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              product.stock > 0
                ? 'bg-[#EE4D2D]/10 hover:bg-[#EE4D2D] text-[#EE4D2D] hover:text-white border border-[#EE4D2D]/30 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            )}
          >
            <ShoppingCart size={13} />
            {product.stock > 0 ? 'Beli / +Keranjang' : 'Habis'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)
