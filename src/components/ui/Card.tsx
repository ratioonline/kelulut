import { cn } from '../../lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
}

export function Card({ className, children, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6 pb-0', className)}>{children}</div>
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-6 pb-6 pt-0 flex items-center gap-3', className)}>{children}</div>
  )
}
