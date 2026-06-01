import type { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'

export default function MainLayout({
  children,
  showHeader = true,
  showNav = true,
}: {
  children: ReactNode
  showHeader?: boolean
  showNav?: boolean
}) {
  return (
    <div className="screen">
      {showHeader ? <Header /> : null}
      <main className="main">{children}</main>
      {showNav ? <BottomNav /> : null}
    </div>
  )
}
