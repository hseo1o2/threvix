import { renderDocxToPdf } from '@/lib/document-renderer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const form = await request.formData()
  const document = form.get('document')

  if (!(document instanceof File) || !document.name.toLowerCase().endsWith('.docx')) {
    return Response.json({ error: 'DOCX 파일만 미리보기로 변환할 수 있습니다.' }, { status: 400 })
  }

  try {
    const preview = await renderDocxToPdf(document)
    return new Response(preview.bytes, {
      headers: {
        'Content-Type': preview.contentType,
        'Content-Disposition': `inline; filename="${preview.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '문서 미리보기 변환에 실패했습니다.'
    const status = message.includes('not configured') ? 503 : 502
    return Response.json({ error: message, renderer: 'gotenberg' }, { status })
  }
}
