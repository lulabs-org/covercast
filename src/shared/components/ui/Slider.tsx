import { cn } from '@/shared/lib'
import React from 'react'

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onValueChange?: (value: number) => void
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onChange, onValueChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onValueChange?.(Number(event.currentTarget.value))
    }

    return (
      <input
        ref={ref}
        type="range"
        className={cn('w-full p-0', className)}
        onChange={handleChange}
        {...props}
      />
    )
  },
)

Slider.displayName = 'Slider'
