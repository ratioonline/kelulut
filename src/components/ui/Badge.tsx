import { cn } from '../../lib/utils'

type BadgeVariant = 'green' | 'yellow' | 'blue' | 'red' | 'gray' | 'orange'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Menunggu', variant: 'yellow' },
    confirmed: { label: 'Dikonfirmasi', variant: 'blue' },
    done: { label: 'Selesai', variant: 'green' },
    cancelled: { label: 'Dibatalkan', variant: 'red' },
  }
  const config = map[status] ?? { label: status, variant: 'gray' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
