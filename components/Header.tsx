'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useChatContext } from '@/context/ChatContext'

interface HeaderProps {
  username?: string
}

export default function Header({ username }: HeaderProps) {
  const router = useRouter()
  const { resetChat } = useChatContext()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function handleNewChat() {
    resetChat()
    router.push('/')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-black text-white h-14 flex items-center px-6"
      data-testid="header"
    >
      <div className="flex items-center justify-between w-full">
        <Link href="/" className="flex items-center gap-2 text-white no-underline" data-testid="header-logo-link">
          <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center" data-testid="header-logo">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-base tracking-tight" data-testid="header-app-name">Patch</span>
        </Link>

        <nav className="flex items-center gap-1" data-testid="header-nav">
          {username && (
            <span className="text-gray-400 text-sm mr-3" data-testid="header-username">
              {username}
            </span>
          )}
          <Link
            href="/incidents"
            className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="header-incidents-link"
          >
            Incidents
          </Link>
          <button
            onClick={handleNewChat}
            className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="header-new-chat-btn"
          >
            New Chat
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="header-logout-btn"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}
