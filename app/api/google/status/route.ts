import { getTokenResponse, UserAuthorizationRequiredError } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ connected: false }, { status: 401 })

  try {
    const token = await getTokenResponse(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: SCOPES })
    const metadata = token.metadata ?? {}
    const connection = { email: typeof metadata.email === 'string' ? metadata.email : null, scopes: SCOPES, status: 'connected', updated_at: new Date().toISOString() }
    await supabase.from('google_connections').upsert({ user_id: user.id, provider: 'google', ...connection }, { onConflict: 'user_id,provider' })
    return Response.json({ connected: true, connection })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return Response.json({ connected: false, connection: null })
    return Response.json({ connected: false, error: 'Google 연결 상태를 확인할 수 없습니다.' }, { status: 502 })
  }
}
