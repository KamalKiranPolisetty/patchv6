'use client'

import { useState, useRef } from 'react'

interface Props {
  category: string
  onClose: () => void
  onSuccess: () => void
}

export default function UploadModal({ category, onClose, onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    if (!f.name.endsWith('.docx')) {
      setError('Only .docx files are allowed')
      return
    }
    setError('')
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('category', category)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) {
      setError(data.error || 'Upload failed')
    } else {
      setSuccess(true)
      setTimeout(onSuccess, 1000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="upload-modal">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" data-testid="upload-modal-content">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900" data-testid="upload-modal-title">
            Upload Document — {category}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" data-testid="upload-close-btn">✕</button>
        </div>

        {success ? (
          <div className="text-center py-8" data-testid="upload-success">
            <div className="text-green-500 text-4xl mb-3">✓</div>
            <p className="text-green-700 font-medium">Document uploaded successfully!</p>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
              data-testid="upload-dropzone"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                data-testid="upload-file-input"
              />
              <div className="text-4xl mb-3">📄</div>
              {file ? (
                <p className="text-slate-700 font-medium" data-testid="upload-filename">{file.name}</p>
              ) : (
                <>
                  <p className="text-slate-600 font-medium">Drag & drop your .docx file here</p>
                  <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                </>
              )}
            </div>

            {error && <p className="text-red-600 text-sm mt-3" data-testid="upload-error">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                data-testid="upload-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                data-testid="upload-submit-btn"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
