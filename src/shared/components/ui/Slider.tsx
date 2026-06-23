'use client'

import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'

import { cn } from '@/shared/lib/index'

/**
 * Single-value Slider API wrapper.
 * Converts single-number value/onValueChange to Radix's array-based API.
 */
export interface SingleSliderProps extends Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: SingleSliderProps) {
  // Convert single value to array for Radix
  const _values = React.useMemo(
    () =>
      value !== undefined ? [value] : defaultValue !== undefined ? [defaultValue] : [min, max],
    [value, defaultValue, min, max],
  )

  // Handle value change - convert array back to single value
  const handleValueChange = React.useCallback(
    (arr: number[]) => {
      onValueChange?.(arr[0])
    },
    [onValueChange],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
      value={value !== undefined ? [value] : undefined}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
