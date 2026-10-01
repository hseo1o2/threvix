export type DocumentFormat = 'docx'

export type RenderedPreview = {
  format: 'pdf'
  contentType: 'application/pdf'
  bytes: Uint8Array
  filename: string
}

const configuredGotenbergUrl = process.env.GOTENBERG_URL?.trim()
const gotenbergUrl = configuredGotenbergUrl?.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/)?.[1] ?? configuredGotenbergUrl

export async function renderDocxToPdf(file: File): Promise<RenderedPreview> {
  if (!gotenbergUrl) {
    throw new Error('GOTENBERG_URL is not configured')
  }

  const form = new FormData()
  form.append('files', file, file.name)
  const username = process.env.GOTENBERG_USERNAME
  const password = process.env.GOTENBERG_PASSWORD
  const headers = username && password
    ? { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` }
    : undefined
  const response = await fetch(`${gotenbergUrl.replace(/\/$/, '')}/forms/libreoffice/convert`, {
    method: 'POST',
    headers,
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
