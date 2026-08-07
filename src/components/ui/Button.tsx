import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children?: React.ReactNode
  className?: string
}

// Native button
type NativeButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    as?: undefined
    to?: undefined
  }

// React Router Link
type LinkButtonProps = ButtonBaseProps &
  Omit<LinkProps, 'children'> & {
    as: typeof Link
  }

type ButtonProps = NativeButtonProps | LinkButtonProps

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white focus:ring-[#2D6A4F] active:scale-95',
  secondary: 'bg-[#F5A623] hover:bg-[#e09520] text-white focus:ring-[#F5A623] active:scale-95',
  outline:
    'border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white focus:ring-[#2D6A4F] active:scale-95',
  ghost: 'text-[#2D6A4F] hover:bg-[#2D6A4F]/10 focus:ring-[#2D6A4F] active:scale-95',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 active:scale-95',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      loading,
      children,
      className,
      as: AsComp,
      ...rest
    } = props as ButtonBaseProps & { as?: typeof Link; to?: string; [key: string]: unknown }

    const classes = cn(base, variants[variant], sizes[size], className)

    if (AsComp && rest.to) {
      return (
        <AsComp
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={rest.to as string}
          className={classes}
          {...(rest as Omit<LinkProps, 'to' | 'className'>)}
        >
          {loading && <Spinner />}
          {children}
        </AsComp>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled || loading}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button
