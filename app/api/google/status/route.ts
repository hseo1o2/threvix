import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ connected: false }, { status: 401 })
  const { data } = await supabase.from('google_connections').select('email, scopes, status, updated_at').eq('user_id', user.id).eq('provider', 'google').maybeSingle()
  return Response.json({ connected: Boolean(data), connection: data ?? null })
}
