import { getTokenResponse, UserAuthorizationRequiredError } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file']

type RequestBody = { patchId: string }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const body = await request.json().catch(() => null) as Partial<RequestBody> | null
  if (!body || typeof body.patchId !== 'string') return Response.json({ error: 'patchId가 필요합니다.' }, { status: 400 })
  const { data: patch } = await supabase.from('patches').select('id, project_id, asset_id, status, previous_value, proposed_value').eq('id', body.patchId).maybeSingle()
  if (!patch || patch.status !== 'approved' || !patch.asset_id) return Response.json({ error: '승인된 patch만 적용할 수 있습니다.' }, { status: 403 })
  const { data: project } = await supabase.from('projects').select('id').eq('id', patch.project_id).eq('created_by', user.id).maybeSingle()
  if (!project) return Response.json({ error: '프로젝트 권한이 없습니다.' }, { status: 403 })
  const { data: asset } = await supabase.from('doc_assets').select('external_id, current_version, current_text').eq('id', patch.asset_id).eq('project_id', patch.project_id).maybeSingle()
  if (!asset || !asset.current_text.includes(patch.previous_value)) return Response.json({ error: '현재 문서가 patch 기준 버전과 달라 적용할 수 없습니다.' }, { status: 409 })
  const documentId = asset.external_id
  const startIndex = asset.current_text.indexOf(patch.previous_value) + 1
  const endIndex = startIndex + patch.previous_value.length
  try {
    const token = await getTokenResponse(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: SCOPES })
    const response = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', headers: { authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify({ requests: [{ deleteContentRange: { range: { startIndex, endIndex } } }, { insertText: { location: { index: startIndex }, text: patch.proposed_value } }] }) })
    if (!response.ok) return Response.json({ error: 'Google Docs 변경 적용에 실패했습니다.' }, { status: response.status })
    await supabase.from('patches').update({ status: 'applied', applied_at: new Date().toISOString() }).eq('id', patch.id).eq('status', 'approved')
    return Response.json({ applied: true, documentId, patchId: patch.id })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return Response.json({ error: 'Google 계정 연결이 필요합니다.' }, { status: 403 })
    return Response.json({ error: 'Google Docs 연결을 확인할 수 없습니다.' }, { status: 502 })
  }
}
