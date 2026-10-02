import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { renderDocxToPdf } from '@/lib/document-renderer'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 300

const previewCache = new Map<string, { bytes: Uint8Array; expiresAt: number }>()
const previewRequests = new Map<string, Promise<Uint8Array>>()
const PREVIEW_CACHE_TTL = 10 * 60 * 1000

async function renderFile(filePath: string, cacheKey: string) {
  const cached = previewCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.bytes

  const existingRequest = previewRequests.get(cacheKey)
  if (existingRequest) return existingRequest

  const request = readFile(filePath)
    .then((bytes) => renderDocxToPdf(new File([bytes], path.basename(filePath), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })))
    .then((preview) => {
      previewCache.set(cacheKey, { bytes: preview.bytes, expiresAt: Date.now() + PREVIEW_CACHE_TTL })
      return preview.bytes
    })
    .finally(() => previewRequests.delete(cacheKey))

  previewRequests.set(cacheKey, request)
  return request
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: Request) {
  if (!await requireUser()) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const variant = new URL(request.url).searchParams.get('variant') === 'proposed' ? 'proposed' : 'original'
  const filename = variant === 'proposed' ? 'UNIS-U-KATHON-2025-proposed.docx' : 'UNIS-U-KATHON-2025-d5b088.docx'
  const filePath = path.join(process.cwd(), 'data', variant === 'proposed' ? 'UNIS-U-KATHON-2025-proposed.docx' : filename)

  try {
    const bytes = await renderFile(filePath, variant)
    return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${filename.replace('.docx', '.pdf')}"`, 'Cache-Control': 'private, max-age=600, stale-while-revalidate=60' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : '문서 미리보기 변환에 실패했습니다.'
    return Response.json({ error: message, renderer: 'gotenberg' }, { status: message.includes('not configured') ? 503 : 502 })
  }
}

export async function POST(request: Request) {
  if (!await requireUser()) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const form = await request.formData()
  const document = form.get('document')
  const MAX_DOCX_BYTES = 10 * 1024 * 1024
  if (!(document instanceof File) || !document.name.toLowerCase().endsWith('.docx')) return Response.json({ error: 'DOCX 파일만 미리보기로 변환할 수 있습니다.' }, { status: 400 })
  if (document.size > MAX_DOCX_BYTES) return Response.json({ error: '미리보기 파일은 10MB 이하만 업로드할 수 있습니다.' }, { status: 413 })
  try {
    const preview = await renderDocxToPdf(document)
    return new Response(preview.bytes, { headers: { 'Content-Type': preview.contentType, 'Content-Disposition': `inline; filename="${preview.filename}"`, 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : '문서 미리보기 변환에 실패했습니다.'
    return Response.json({ error: message, renderer: 'gotenberg' }, { status: message.includes('not configured') ? 503 : 502 })
  }
}
