import { NextResponse } from 'next/server'
import { existsSync } from 'fs'
import path from 'path'

export async function GET() {
  const kbPath = path.join(process.cwd(), 'knowledge_base', 'VDI', 'vdi.txt')
  const available = existsSync(kbPath)
  return NextResponse.json({ available })
}
