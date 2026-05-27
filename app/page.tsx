'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import UploadModal from './components/UploadModal'

interface CategoryStatus {
  category: string
  hasDoc: boolean
  filename: string | null
}

const ICONS: Record<string, string> = {
  VDI: '🖥️',
  Printer: '🖨️',
  Scanner: '📠',
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [categories, setCategories] = useState<CategoryStatus[]>([])
  const [uploadCategory, setUploadCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch('/api/session')
      const sessionData = await sessionRes.json()
      if (!sessionData.user) {
        router.replace('/login')
        return
      }
      setUser(sessionData.user)

      const kbRes = await fetch('/api/knowledge-base')
      if (kbRes.ok) {
        const data = await kbRes.json()
        setCategories(data)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleCategoryClick(cat: CategoryStatus) {
    if (!cat.hasDoc) {
      setUploadCategory(cat.category)
    } else {
      router.push(`/chat?category=${cat.category}`)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function refreshCategories() {
    const res = await fetch('/api/knowledge-base')
    if (res.ok) setCategories(await res.json())
    setUploadCategory(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="home-page">
      <header className="bg-white border-b border-slate-200 px-6 py-4" data-testid="home-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900" data-testid="brand-title">Patch</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-sm" data-testid="user-email">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              data-testid="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900" data-testid="welcome-heading">
            Welcome, {user?.email?.split('@')[0]}
          </h2>
          <p className="text-slate-500 mt-2" data-testid="page-subtitle">Select a category to start troubleshooting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleCategoryClick(cat)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-left hover:shadow-md hover:border-blue-300 transition-all"
              data-testid={`category-card-${cat.category.toLowerCase()}`}
            >
              <div className="text-5xl mb-4" data-testid={`category-icon-${cat.category.toLowerCase()}`}>
                {ICONS[cat.category]}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3" data-testid={`category-title-${cat.category.toLowerCase()}`}>
                {cat.category}
              </h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  cat.hasDoc ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
                data-testid={`category-status-${cat.category.toLowerCase()}`}
              >
                {cat.hasDoc ? '✓ Doc Available' : '⚠ Upload Needed'}
              </span>
            </button>
          ))}
        </div>
      </main>

      {uploadCategory && (
        <UploadModal
          category={uploadCategory}
          onClose={() => setUploadCategory(null)}
          onSuccess={refreshCategories}
        />
      )}
    </div>
  )
}
