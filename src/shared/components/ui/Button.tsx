import { cn } from '@/shared/lib'
import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-[var(--primary)] hover:bg-[var(--accent-strong)] disabled:bg-[#9aa9c0] disabled:cursor-not-allowed',
  secondary:
    'text-[#1c2a3d] bg-[#eef3fb] border border-[#d4deef] hover:bg-[#e4ecf8] disabled:text-[#8a96aa] disabled:bg-[#eef2f7] disabled:border-[#dbe3f0] disabled:cursor-not-allowed',
  danger: 'w-full text-white bg-[var(--destructive)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[32px] px-3 text-[13px]',
  md: 'min-h-[38px] px-[14px] text-[14px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // base styles
        'border-0 rounded-[6px] cursor-pointer font-extrabold select-none',
        // variant styles
        variantStyles[variant],
        // size styles
        sizeStyles[size],
        // custom className
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
