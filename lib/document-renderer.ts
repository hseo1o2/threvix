export type DocumentFormat = 'docx'

export type RenderedPreview = {
  format: 'pdf'
  contentType: 'application/pdf'
  bytes: Uint8Array
  filename: string
}

const configuredGotenbergUrl = process.env.GOTENBERG_URL?.trim()
const parsedGotenbergUrl = configuredGotenbergUrl?.match(/^\[[^\]]+\]\((https:\/\/[^)]+)\)$/)?.[1] ?? configuredGotenbergUrl
const gotenbergUrl = parsedGotenbergUrl && /^https:\/\/[^/]+(?::\d+)?$/.test(parsedGotenbergUrl) ? parsedGotenbergUrl : undefined

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
  let response: Response | undefined
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const requestForm = new FormData()
    requestForm.append('files', file, file.name)
    response = await fetch(`${gotenbergUrl.replace(/\/$/, '')}/forms/libreoffice/convert`, {
      method: 'POST',
      headers,
      body: requestForm,
      signal: AbortSignal.timeout(90_000),
    })
    if (response.ok) break
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
  }

  if (!response?.ok) {
    const detail = response ? (await response.text()).slice(0, 240) : 'no response'
    throw new Error(`Gotenberg conversion failed (${response?.status ?? 'unknown'}): ${detail}`)
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
