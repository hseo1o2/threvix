import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  return Response.json({ error: '전체 Drive 목록 조회는 지원하지 않습니다. Google Picker에서 사용자가 프로젝트 파일을 직접 선택해야 합니다.', pickerRequired: true }, { status: 410 })
}
