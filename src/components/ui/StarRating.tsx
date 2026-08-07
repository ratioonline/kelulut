import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StarRatingProps {
  value: number        // 0 – 5, support desimal
  count?: number
  size?: number
  showValue?: boolean
  className?: string
}

export default function StarRating({
  value,
  count,
  size = 14,
  showValue = true,
  className,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = value >= i + 1
          const half   = !filled && value >= i + 0.5
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              {/* Grey base */}
              <Star
                size={size}
                className="text-gray-200 fill-gray-200 absolute inset-0"
              />
              {/* Filled overlay */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : '50%' }}
                >
                  <Star size={size} className="text-[#F5A623] fill-[#F5A623]" />
                </span>
              )}
            </span>
          )
        })}
      </div>
      {showValue && (
        <span className="text-xs text-[#F5A623] font-semibold">{value.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  )
}
