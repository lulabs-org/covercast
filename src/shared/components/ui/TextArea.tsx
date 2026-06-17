import { cn } from '@/shared/lib'
import React from 'react'

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // base styles (shared with Input)
          'w-full min-h-[36px] border border-[#cfd8e8] rounded-[6px] px-[9px] py-2',
          'text-[#142033] bg-white outline-none',
          // focus styles (shared with Input)
          'focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(39,100,246,0.14)]',
          // textarea-specific styles
          'resize-vertical leading-[1.45]',
          // custom className
          className,
        )}
        {...props}
      />
    )
  },
)

TextArea.displayName = 'TextArea'
