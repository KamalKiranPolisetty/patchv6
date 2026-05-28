'use client'

import { ChatProvider } from '@/context/ChatContext'
import Header from './Header'

interface ProvidersProps {
  children: React.ReactNode
  username?: string
  showHeader?: boolean
}

export default function Providers({ children, username, showHeader }: ProvidersProps) {
  return (
    <ChatProvider>
      {showHeader && <Header username={username} />}
      {children}
    </ChatProvider>
  )
}
