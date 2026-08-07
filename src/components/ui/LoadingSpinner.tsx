import { cn } from '../../lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullPage?: boolean
}

const sizeMap = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export default function LoadingSpinner({ size = 'md', className, fullPage }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'rounded-full border-[#2D6A4F] border-t-transparent animate-spin',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF3E0]">
        {spinner}
      </div>
    )
  }

  return spinner
}
