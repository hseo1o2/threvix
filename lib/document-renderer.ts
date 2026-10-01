export type DocumentFormat = 'docx'

export type RenderedPreview = {
  format: 'pdf'
  contentType: 'application/pdf'
  bytes: Uint8Array
  filename: string
}

const gotenbergUrl = process.env.GOTENBERG_URL

export async function renderDocxToPdf(file: File): Promise<RenderedPreview> {
  if (!gotenbergUrl) {
    throw new Error('GOTENBERG_URL is not configured')
  }

  const form = new FormData()
  form.append('files', file, file.name)
  const response = await fetch(`${gotenbergUrl.replace(/\/$/, '')}/forms/libreoffice/convert`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    throw new Error(`Gotenberg conversion failed (${response.status})`)
  }

  return {
    format: 'pdf',
    contentType: 'application/pdf',
    bytes: new Uint8Array(await response.arrayBuffer()),
    filename: file.name.replace(/\.docx$/i, '.pdf'),
  }
}

export function isDocumentRendererConfigured() {
  return Boolean(gotenbergUrl)
}
