import { createClient } from '@/lib/supabase/server'

const MAX_TEXT = 100_000

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const projectId = typeof body?.projectId === 'string' ? body.projectId : ''
  const assetId = typeof body?.assetId === 'string' ? body.assetId : ''
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const previousValue = typeof body?.previousValue === 'string' ? body.previousValue : ''
  const proposedValue = typeof body?.proposedValue === 'string' ? body.proposedValue : ''
  if (!projectId || !assetId || !title || !previousValue || !proposedValue || previousValue.length > MAX_TEXT || proposedValue.length > MAX_TEXT) return Response.json({ error: '유효하지 않은 patch입니다.' }, { status: 400 })

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('created_by', user.id).maybeSingle()
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
  const { data: asset } = await supabase.from('doc_assets').select('id, external_id, current_version, current_text').eq('id', assetId).eq('project_id', projectId).maybeSingle()
  if (!asset) return Response.json({ error: '프로젝트에 연결된 문서를 찾을 수 없습니다.' }, { status: 404 })
  if (!asset.current_text.includes(previousValue)) return Response.json({ error: '현재 문서와 patch의 기준 텍스트가 일치하지 않습니다.' }, { status: 409 })

  const { data: patch, error } = await supabase.from('patches').insert({ project_id: projectId, asset_id: asset.id, base_version_id: null, title, source_text: previousValue, previous_value: previousValue, proposed_value: proposedValue, summary: typeof body?.summary === 'string' ? body.summary.slice(0, 1000) : null, status: 'review_requested', created_by: 'user', created_by_type: 'human', created_by_id: user.id }).select('id, project_id, asset_id, title, previous_value, proposed_value, status, created_at').single()
  if (error) return Response.json({ error: 'patch를 저장하지 못했습니다.' }, { status: 500 })
  const { error: operationError } = await supabase.from('patch_operations').insert({ patch_id: patch.id, operation: 'replace', target_anchor: { source: 'document_text', value: previousValue }, before_value: previousValue, after_value: proposedValue })
  if (operationError) return Response.json({ error: 'patch 작업을 저장하지 못했습니다.' }, { status: 500 })
  return Response.json({ patch }, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) return Response.json({ error: 'projectId가 필요합니다.' }, { status: 400 })
  const { data } = await supabase.from('patches').select('id, asset_id, title, summary, previous_value, proposed_value, status, created_at, approved_at, applied_at').eq('project_id', projectId).eq('created_by_id', user.id).order('created_at', { ascending: false })
  return Response.json({ patches: data ?? [] })
}
