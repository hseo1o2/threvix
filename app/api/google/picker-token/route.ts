import { getTokenResponse, UserAuthorizationRequiredError } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const SCOPES = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.file']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  try {
    const response = await getTokenResponse(CONNECTOR, { subject: { type: 'user', id: user.id }, scopes: SCOPES }) as unknown as { accessToken?: string; access_token?: string }
    const accessToken = response.accessToken ?? response.access_token
    if (!accessToken) return Response.json({ error: 'Google 인증 토큰을 가져오지 못했습니다.' }, { status: 502 })
    return Response.json({ accessToken })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) return Response.json({ error: 'Google 계정 연결이 필요합니다.', authorizationRequired: true }, { status: 403 })
    return Response.json({ error: 'Google Picker 인증을 준비하지 못했습니다.' }, { status: 502 })
  }
}
