import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Patch — IT Support AI',
  description: 'Intelligent IT support powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
