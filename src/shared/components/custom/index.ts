// 自研通用 UI 组件
export { Input, type InputProps } from './Input'
export { TextArea, type TextAreaProps } from './TextArea'
export { ColorPicker, type ColorPickerProps } from './ColorPicker'

// Button：已合并到 shadcn ui/button.tsx，这里重导出保持调用方兼容
export { Button, buttonVariants } from '../ui/button'

// 基于 shadcn 的适配组件
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'

export type { DialogSize } from '../ui/dialog'

export { Slider } from '../ui/slider'
export type { SingleSliderProps as SliderProps } from '../ui/slider'
