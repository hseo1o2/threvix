import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const projectId = typeof body?.projectId === 'string' ? body.projectId : null
  const sourceRequest = typeof body?.sourceRequest === 'string' ? body.sourceRequest.trim() : ''
  const assetId = typeof body?.assetId === 'string' ? body.assetId : null
  if (!projectId || !sourceRequest || sourceRequest.length > 5000) return Response.json({ error: 'projectId와 sourceRequest가 필요합니다.' }, { status: 400 })

  const { data: project } = await supabase.from('projects').select('id, name').eq('id', projectId).eq('created_by', user.id).maybeSingle()
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })

  const result = await generateText({
    model: 'openai/gpt-5.4-mini',
    system: 'You are Threvix, an agency operations agent. Produce a concise Korean change proposal. Never claim an external document was changed. Return only JSON with title, summary, and changes (array of {target, before, after, reason}).',
    prompt: `프로젝트: ${project.name}\n변경 요청: ${sourceRequest}`,
  })

  let proposal: { title: string; summary: string; changes: Array<{ target: string; before: string; after: string; reason: string }> }
  try {
    proposal = JSON.parse(result.text)
  } catch {
    proposal = { title: '변경 요청 검토안', summary: result.text, changes: [] }
  }

  const { data, error } = await supabase.from('agent_proposals').insert({ project_id: projectId, asset_id: assetId, title: proposal.title.slice(0, 500), summary: proposal.summary.slice(0, 2000), source_request: sourceRequest, diff_json: proposal.changes, created_by: 'Threvix Agent' }).select('id, title, summary, diff_json, status').single()
  if (error) return Response.json({ error: '제안 저장에 실패했습니다.' }, { status: 500 })
  let patch = null
  const firstChange = proposal.changes[0]
  if (assetId && firstChange && typeof firstChange.before === 'string' && typeof firstChange.after === 'string') {
    const { data: asset } = await supabase.from('doc_assets').select('id, project_id, current_text').eq('id', assetId).eq('project_id', projectId).maybeSingle()
    if (asset && asset.current_text.includes(firstChange.before)) {
      const { data: createdPatch } = await supabase.from('patches').insert({ project_id: projectId, asset_id: asset.id, title: proposal.title.slice(0, 500), source_text: firstChange.before, previous_value: firstChange.before, proposed_value: firstChange.after, summary: proposal.summary.slice(0, 1000), status: 'review_requested', created_by: 'Threvix Agent', created_by_type: 'agent', created_by_id: user.id }).select('id, status, asset_id, title').single()
      patch = createdPatch
      if (createdPatch) await supabase.from('patch_operations').insert({ patch_id: createdPatch.id, operation: 'replace', target_anchor: { source: 'agent_proposal', proposalId: data.id }, before_value: firstChange.before, after_value: firstChange.after, reason: firstChange.reason })
    }
  }
  return Response.json({ proposal: data, patch })
}
