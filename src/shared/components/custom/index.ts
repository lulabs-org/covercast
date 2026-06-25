// 自研通用 UI 组件
export { Input, type InputProps } from './Input'
export { TextArea, type TextAreaProps } from './TextArea'
export { ColorPicker, type ColorPickerProps } from './ColorPicker'

// 基于 shadcn 的组件（统一从 ui/index.ts 导入）
export {
  Button,
  buttonVariants,
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
  Slider,
} from '../ui'

export type { DialogSize, SingleSliderProps as SliderProps } from '../ui'
