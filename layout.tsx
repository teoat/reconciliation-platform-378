import './globals.css'
import './styles/progress-bars.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '378 Data and Evidence Reconciliation App',
  description: 'A comprehensive data and evidence reconciliation application for matching and analysis',
  icons: {
    icon: '/favicon-32x32.svg',
    shortcut: '/favicon-16x16.svg',
    apple: '/favicon-32x32.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
