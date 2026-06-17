import { cn } from '@/shared/lib'
import React from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          // base styles from fields.css
          'w-full min-h-[36px] border border-[#cfd8e8] rounded-[6px] px-[9px] py-2',
          'text-[#142033] bg-white outline-none',
          // focus styles
          'focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(39,100,246,0.14)]',
          // custom className
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'
