import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import type { Product } from '../../types/database'
import { useCartStore } from '../../stores/cartStore'
import StarRating from './StarRating'

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  const hasDiscount = product.discount_price !== null && product.discount_price !== undefined
  const displayPrice = hasDiscount ? product.discount_price! : (product.price ?? 0)
  const originalPrice = product.price ?? 0
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : 0

  const thumb =
    (product.images?.length ? product.images[0] : null) ??
    product.image_url ??
    'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=400&q=60'

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250',
        className
      )}
    >
      {/* ── Thumbnail ── */}
      <Link to={`/produk/${product.slug}`} className="block relative overflow-hidden aspect-square">
        <img
          src={thumb}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
        />

        {/* Discount badge */}
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            -{discountPct}%
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500 border border-gray-400 px-2 py-1 rounded-full">
              Habis
            </span>
          </div>
        )}
      </Link>

      {/* ── Info ── */}
      <div className="p-3 flex flex-col gap-1.5">
        <Link
          to={`/produk/${product.slug}`}
          className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#2D6A4F] leading-snug transition-colors"
        >
          {product.name}
        </Link>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-[#F5A623]">
            {formatCurrency(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Rating + sold */}
        <div className="flex items-center justify-between">
          <StarRating value={product.rating ?? 5} size={11} showValue={false} />
          <span className="text-[11px] text-gray-400">
            {(product.sold_count ?? 0) > 0 ? `${product.sold_count} terjual` : ''}
          </span>
        </div>

        {/* Add to cart */}
        <button
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
          className={cn(
            'mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all',
            product.stock > 0
              ? 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <ShoppingCart size={13} />
          {product.stock > 0 ? 'Tambah' : 'Habis'}
        </button>
      </div>
    </div>
  )
}
