import { getToken, UserAuthorizationRequiredError } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/documents']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  try {
    const token = await getToken(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: SCOPES })
    const response = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.document%27%20and%20trashed%3Dfalse&orderBy=modifiedTime%20desc&pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink)', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    if (!response.ok) return Response.json({ error: 'Google Docs 목록을 가져오지 못했습니다.' }, { status: response.status })
    const payload = await response.json()
    return Response.json({ documents: payload.files ?? [] })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return Response.json({ error: 'Google 계정 연결이 필요합니다.' }, { status: 401 })
    return Response.json({ error: 'Google Docs에 연결할 수 없습니다.' }, { status: 502 })
  }
}
