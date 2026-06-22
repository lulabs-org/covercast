'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/shared/lib'
import React from 'react'

/**
 * Backward-compatible API: accepts single-number value / onValueChange,
 * internally bridges to Radix's array-based API.
 */
export interface SliderProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
}

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, value, defaultValue, onValueChange, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      value={value !== undefined ? [value] : undefined}
      defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
      onValueChange={(arr) => onValueChange?.(arr[0])}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-[#cfd8e8]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--accent)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'relative block h-3 w-3 rounded-full bg-[var(--accent)] border-2 border-white',
          'shadow-[0_1px_3px_rgba(15,23,42,0.2)] transition-transform hover:scale-110',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(39,100,246,0.14)]',
          'disabled:pointer-events-none disabled:opacity-50',
          // Expand hit area for easier dragging
          'before:absolute before:inset-[-8px] before:content-[""]',
        )}
      />
    </SliderPrimitive.Root>
  ),
)

Slider.displayName = 'Slider'
