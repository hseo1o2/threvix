import { startAuthorization } from '@vercel/connect'
import { createClient } from '@/lib/supabase/server'

const CONNECTOR = 'google/threvix-google-workspace'
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/documents']

function getOrigin(request: Request) {
  const url = new URL(request.url)
  return process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `${url.protocol}//${url.host}`
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const origin = getOrigin(request)
  const authorization = await startAuthorization(
    CONNECTOR,
    { subject: { type: 'user', id: user.id }, scopes: GOOGLE_SCOPES },
    { callbackUrl: `${origin}/api/google/callback` },
  )
  return Response.json({ url: authorization.url })
}
