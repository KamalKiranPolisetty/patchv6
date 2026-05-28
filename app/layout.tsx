import type { Metadata } from 'next'
import './globals.css'
import { getSession } from '@/lib/session'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Patch — Discount Tire IT Support',
  description: 'Self-service IT troubleshooting assistant for Discount Tire store associates',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const showHeader = !!session

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-white">
        <Providers username={session?.username} showHeader={showHeader}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
