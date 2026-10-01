import { getTokenResponse, UserAuthorizationRequiredError } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/documents']

type RequestBody = { projectId: string; documentId: string; replacement: string; startIndex: number; endIndex: number }

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const body = await request.json() as Partial<RequestBody>
  if (!body.projectId || !body.documentId || !body.replacement || typeof body.startIndex !== 'number' || typeof body.endIndex !== 'number' || body.startIndex >= body.endIndex) return Response.json({ error: '유효하지 않은 변경 요청입니다.' }, { status: 400 })
  const { data: project } = await supabase.from('projects').select('id').eq('id', body.projectId).eq('created_by', user.id).maybeSingle()
  if (!project) return Response.json({ error: '프로젝트 권한이 없습니다.' }, { status: 403 })
  try {
    const token = await getTokenResponse(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: SCOPES })
    const response = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(body.documentId)}:batchUpdate`, { method: 'POST', headers: { authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify({ requests: [{ deleteContentRange: { range: { startIndex: body.startIndex, endIndex: body.endIndex } } }, { insertText: { location: { index: body.startIndex }, text: body.replacement } }] }) })
    if (!response.ok) return Response.json({ error: 'Google Docs 변경 적용에 실패했습니다.' }, { status: response.status })
    return Response.json({ applied: true, documentId: body.documentId })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return Response.json({ error: 'Google 계정 연결이 필요합니다.' }, { status: 403 })
    return Response.json({ error: 'Google Docs 연결을 확인할 수 없습니다.' }, { status: 502 })
  }
}
