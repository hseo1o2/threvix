import { getToken, UserAuthorizationRequiredError } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/documents']

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const projectId = typeof body?.projectId === 'string' ? body.projectId : ''
  const documentId = typeof body?.documentId === 'string' ? body.documentId : ''
  if (!projectId || !documentId) return Response.json({ error: 'projectId와 documentId가 필요합니다.' }, { status: 400 })
  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('created_by', user.id).maybeSingle()
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
  try {
    const token = await getToken(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: SCOPES })
    const [metadataResponse, documentResponse] = await Promise.all([
      fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(documentId)}?fields=id,name,mimeType,webViewLink,modifiedTime`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
    ])
    if (!metadataResponse.ok || !documentResponse.ok) return Response.json({ error: '문서 내용을 읽지 못했습니다.' }, { status: 502 })
    const metadata = await metadataResponse.json()
    const document = await documentResponse.json()
    const text = (document.body?.content ?? []).flatMap((block: { paragraph?: { elements?: Array<{ textRun?: { content?: string } }> } }) => block.paragraph?.elements?.map((element) => element.textRun?.content ?? '') ?? []).join('')
    const { data: asset, error: assetError } = await supabase.from('doc_assets').upsert({ project_id: projectId, provider: 'google_docs', external_id: metadata.id, name: metadata.name, mime_type: metadata.mimeType, web_url: metadata.webViewLink, current_version: metadata.modifiedTime ?? 'v1', current_text: text, synced_at: new Date().toISOString() }, { onConflict: 'project_id,external_id' }).select('id, name, current_version, current_text, web_url').single()
    if (assetError) return Response.json({ error: assetError.message }, { status: 500 })
    const { error: versionError } = await supabase.from('doc_versions').upsert({ asset_id: asset.id, version: asset.current_version, text_content: text, source: 'google_docs' }, { onConflict: 'asset_id,version' })
    if (versionError) return Response.json({ error: versionError.message }, { status: 500 })
    return Response.json({ asset })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return Response.json({ error: 'Google 계정 연결이 필요합니다.' }, { status: 401 })
    return Response.json({ error: 'Google Docs 동기화에 실패했습니다.' }, { status: 502 })
  }
}
