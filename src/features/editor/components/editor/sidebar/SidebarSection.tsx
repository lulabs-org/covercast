import type { ReactNode } from 'react'
import styles from './SidebarSection.module.css'

export function SidebarSection({
  title,
  caption,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  caption: string
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className={styles.sidebarSection}>
      <button
        type="button"
        className={styles.sidebarSectionHeader}
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <small>{caption}</small>
        <b>{collapsed ? '＋' : '－'}</b>
      </button>
      {collapsed ? null : <div className={styles.sidebarSectionBody}>{children}</div>}
    </section>
  )
}
