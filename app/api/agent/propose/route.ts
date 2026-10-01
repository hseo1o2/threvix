import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const projectId = typeof body?.projectId === 'string' ? body.projectId : null
  const sourceRequest = typeof body?.sourceRequest === 'string' ? body.sourceRequest.trim() : ''
  if (!projectId || !sourceRequest) return Response.json({ error: 'projectId와 sourceRequest가 필요합니다.' }, { status: 400 })

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

  const { data, error } = await supabase.from('agent_proposals').insert({ project_id: projectId, title: proposal.title, summary: proposal.summary, source_request: sourceRequest, diff_json: proposal.changes, created_by: 'Threvix Agent' }).select('id, title, summary, diff_json, status').single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ proposal: data })
}
