import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const patchId = typeof body?.patchId === 'string' ? body.patchId : ''
  const status = body?.status === 'approved' || body?.status === 'changes_requested' ? body.status : ''
  if (!patchId || !status) return Response.json({ error: 'patchId와 유효한 status가 필요합니다.' }, { status: 400 })

  const { data: patch } = await supabase.from('patches').select('id, project_id, status').eq('id', patchId).maybeSingle()
  if (!patch) return Response.json({ error: 'patch를 찾을 수 없습니다.' }, { status: 404 })
  const { data: project } = await supabase.from('projects').select('id').eq('id', patch.project_id).eq('created_by', user.id).maybeSingle()
  if (!project) return Response.json({ error: '프로젝트 권한이 없습니다.' }, { status: 403 })
  if (patch.status === 'applied' || patch.status === 'rejected') return Response.json({ error: '이미 종료된 patch입니다.' }, { status: 409 })

  const { data: updated, error } = await supabase.from('patches').update({ status, approved_by: status === 'approved' ? user.id : null, approved_at: status === 'approved' ? new Date().toISOString() : null }).eq('id', patchId).eq('status', patch.status).select('id, status, approved_by, approved_at').single()
  if (error) return Response.json({ error: 'patch 검토 상태를 저장하지 못했습니다.' }, { status: 500 })
  await supabase.from('reviews').upsert({ patch_id: patchId, reviewer_id: user.id, status }, { onConflict: 'patch_id,reviewer_id' })
  return Response.json({ patch: updated })
}
