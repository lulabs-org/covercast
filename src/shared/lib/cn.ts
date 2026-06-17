/**
 * 合并 className，过滤 falsy 值
 * @example cn('a', 'b', false && 'c', null, undefined) => 'a b'
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
