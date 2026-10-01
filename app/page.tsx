'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  GitPullRequest,
  ImagePlus,
  Link2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'

type AssetStatus = '검토 필요' | '최신' | '수정안 생성됨' | '영향 가능'

type Asset = {
  name: string
  type: string
  source: string
  version: string
  detail: string
  status: AssetStatus
  icon: typeof FileText
  tone: string
}

const assets: Asset[] = [
  { name: '행사 운영안', type: '문서', source: 'Google Docs', version: 'v8', detail: '10분 전 수정', status: '검토 필요', icon: FileText, tone: 'blue' },
  { name: '참가자 명단', type: '스프레드시트', source: 'Google Sheets', version: '148명', detail: '어제 동기화', status: '최신', icon: FileCheck2, tone: 'green' },
  { name: '초청 메일', type: '메일 템플릿', source: 'Gmail · Docs', version: '초안 v3', detail: '수정안 생성됨', status: '수정안 생성됨', icon: Mail, tone: 'violet' },
  { name: '좌석 배치도', type: 'PDF', source: 'Google Drive', version: 'v2', detail: '2일 전 수정', status: '영향 가능', icon: FileText, tone: 'amber' },
]

const initialEvents = [
  { kind: 'person', name: '김수현', time: '10:21', text: '고객이 행사 시작 시간 바꾼 것 같은데 확인 가능할까요?', avatar: '수' },
  { kind: 'system', name: 'Threvix', time: '10:22', text: '새로운 변경 요청을 발견했습니다', source: 'Slack #client-a', request: '행사 시작 시간을 14:00에서 15:00로 변경해주세요.' },
]

export default function Page() {
  const [screen, setScreen] = useState<'workspace' | 'pr'>('workspace')
  const [highlighted, setHighlighted] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [approved, setApproved] = useState(false)
  const [comment, setComment] = useState('')
  const [events, setEvents] = useState(initialEvents)
  const [message, setMessage] = useState('')

  function requestReview() {
    setShowReview(false)
    setEvents((current) => [...current, { kind: 'review', name: 'Threvix', time: '방금', text: '김수현님에게 행사 운영안 검토를 요청했습니다.', avatar: 'T' }])
  }

  function sendMessage() {
    if (!message.trim()) return
    setEvents((current) => [...current, { kind: 'person', name: '나', time: '방금', text: message, avatar: '나' }])
    setMessage('')
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#172033]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e5e8ed] bg-white px-6">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5 border-r border-[#e5e8ed] pr-5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm"><Zap className="size-[17px] fill-current" /></div>
            <span className="text-[19px] font-semibold tracking-[-0.04em]">threvix</span>
          </div>
          <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-[#f5f7fa]"><span className="size-2 rounded-full bg-[#2563eb]" /> A사 2026 브랜드 컨퍼런스 <ChevronRight className="size-3.5 text-[#98a1b2]" /></button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {['수','지','서','+'].map((x, i) => <div key={x} className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold ${i === 3 ? 'bg-[#eef2f7] text-[#667085]' : ['bg-[#e4efff] text-[#2563eb]', 'bg-[#fcebdc] text-[#b45309]', 'bg-[#e7f7ee] text-[#1d8652]'][i]}`}>{x}</div>)}
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-white text-xs"><Users data-icon="inline-start" /> 팀원 초대</Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-white text-xs"><Link2 data-icon="inline-start" /> Integrations</Button>
          <Button variant="ghost" size="icon" className="size-8"><Settings2 /></Button>
        </div>
      </header>

      {screen === 'workspace' ? <Workspace {...{ highlighted, setHighlighted, setScreen, showMenu, setShowMenu, events, message, setMessage, sendMessage }} /> : <PullRequest {...{ setScreen, approved, setApproved, comment, setComment, setShowReview, setShowHistory }} />}

      {showReview && <ReviewModal onClose={() => setShowReview(false)} onSubmit={requestReview} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </main>
  )
}

function Workspace({ highlighted, setHighlighted, setScreen, showMenu, setShowMenu, events, message, setMessage, sendMessage }: any) {
  return <div className="mx-auto max-w-[1480px] px-5 py-5">
    <div className="mb-5 flex items-end justify-between"><div><div className="mb-1 flex items-center gap-2 text-xs text-[#7a8494]"><span>프로젝트</span><ChevronRight className="size-3" /><span>Workspace</span></div><h1 className="text-[22px] font-semibold tracking-[-0.03em]">프로젝트 Workspace</h1></div><div className="flex items-center gap-2 text-xs text-[#7a8494]"><span className="size-2 rounded-full bg-[#43b581]" /> 모든 변경사항이 동기화됨 <MoreHorizontal className="ml-2 size-4" /></div></div>
    <div className="grid grid-cols-[260px_minmax(420px,1fr)_300px] gap-4">
      <aside className="rounded-lg border border-[#e1e5eb] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[13px] font-semibold">Project Assets</h2><p className="mt-1 text-[11px] text-[#8993a3]">연결된 산출물 4개</p></div><button className="text-[#8b95a4] hover:text-[#2563eb]"><Search className="size-4" /></button></div>
        <div className="flex flex-col gap-2.5">{assets.map((asset, i) => <AssetCard key={asset.name} asset={asset} active={highlighted && i !== 1} onClick={() => setHighlighted(true)} />)}</div>
        <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[#cbd2dd] py-2.5 text-xs font-medium text-[#667085] hover:border-[#2563eb] hover:text-[#2563eb]"><Plus className="size-3.5" /> Asset 연결</button>
      </aside>

      <section className="flex min-h-[690px] flex-col rounded-lg border border-[#e1e5eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex items-center justify-between border-b border-[#edf0f3] px-5 py-4"><div><h2 className="text-[13px] font-semibold">Project Feed</h2><p className="mt-1 text-[11px] text-[#8993a3]">프로젝트에서 발생한 모든 맥락과 변경사항</p></div><button className="flex items-center gap-1.5 text-xs text-[#667085]"><CircleHelp className="size-3.5" /> Feed 안내</button></div>
        <div className="flex-1 px-5 py-5"><div className="flex flex-col gap-5">{events.map((event: any, i: number) => event.kind === 'system' ? <SystemEvent key={i} event={event} onReview={() => setScreen('pr')} onHighlight={() => setHighlighted(true)} /> : <PersonEvent key={i} event={event} />)}</div></div>
        <div className="relative border-t border-[#edf0f3] p-4"><div className="rounded-lg border border-[#dfe4ea] bg-[#fbfcfd] p-3 focus-within:border-[#93b4f7] focus-within:ring-2 focus-within:ring-[#dbe8ff]"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); sendMessage() } }} rows={2} placeholder="메시지를 입력하거나 프로젝트 컨텍스트를 추가하세요" className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#a1a9b6]" /><div className="flex items-center justify-between pt-2"><div className="flex items-center gap-1"><button onClick={() => setShowMenu(!showMenu)} className="flex size-7 items-center justify-center rounded-md text-[#7d8797] hover:bg-[#eef2f7] hover:text-[#2563eb]"><Paperclip className="size-4" /></button><button className="flex size-7 items-center justify-center rounded-md text-[#7d8797] hover:bg-[#eef2f7] hover:text-[#2563eb]"><ImagePlus className="size-4" /></button><button className="rounded-md px-2 py-1 text-xs text-[#7d8797] hover:bg-[#eef2f7]">@ 멘션</button>{showMenu && <div className="absolute bottom-16 left-4 z-10 w-48 rounded-lg border border-[#e1e5eb] bg-white p-1.5 shadow-lg"><button className="menu-item"><Paperclip className="size-3.5" /> 파일 업로드</button><button className="menu-item"><ImagePlus className="size-3.5" /> 이미지 업로드</button><button className="menu-item"><Link2 className="size-3.5" /> 외부 링크 추가</button><button className="menu-item"><MessageSquare className="size-3.5" /> 카카오톡 캡처 추가</button></div>}</div><Button onClick={sendMessage} size="sm" className="h-7 gap-1.5 bg-[#2563eb] text-xs hover:bg-[#1d4ed8]">보내기 <Send data-icon="inline-end" /></Button></div></div><p className="mt-2 text-[10px] text-[#a0a8b5]">Enter로 전송 · Shift + Enter로 줄바꿈</p></div>
      </section>

      <aside className="rounded-lg border border-[#e1e5eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]"><div className="border-b border-[#edf0f3] px-4 py-4"><h2 className="text-[13px] font-semibold">Current Project State</h2><p className="mt-1 text-[11px] text-[#8993a3]">현재 유효한 프로젝트 상태</p></div><div className="p-4"><SectionTitle icon={<ShieldCheck className="size-3.5" />} title="현재 유효한 결정" /><div className="flex flex-col gap-3">{[['행사 시작 시간','15:00','Slack · 오늘 10:18'],['참가 인원','148명','Email · 어제'],['VIP 세션 장소','3F Grand Hall','Meeting · 2일 전']].map(([a,b,c]) => <button key={a} className="group text-left"><div className="flex items-center justify-between"><span className="text-xs font-medium">{a}</span><ChevronRight className="size-3 text-[#b0b7c2] group-hover:text-[#2563eb]" /></div><div className="mt-1 text-[13px] font-semibold text-[#2563eb]">{b}</div><div className="mt-1 text-[10px] text-[#929baa]">{c}</div></button>)}</div><div className="my-5 border-t border-[#edf0f3]" /><SectionTitle icon={<Clock3 className="size-3.5" />} title="Review Requests" /><div className="flex flex-col gap-2.5">{[['초청 메일','김수현님 확인 필요'],['행사 운영안','박지민님 확인 필요']].map(([a,b]) => <div key={a} className="flex items-center justify-between"><div><div className="text-xs font-medium">{a}</div><div className="mt-1 text-[10px] text-[#929baa]">{b}</div></div><span className="size-1.5 rounded-full bg-[#f59e0b]" /></div>)}</div><div className="my-5 border-t border-[#edf0f3]" /><SectionTitle icon={<GitPullRequest className="size-3.5" />} title="Recent Changes" /><div className="relative flex flex-col gap-4 pl-4 before:absolute before:bottom-1 before:left-[3px] before:top-1 before:w-px before:bg-[#e4e8ee]">{[['10:22','변경 요청 감지'],['어제','참가자 명단 최신화'],['3일 전','VIP 세션 장소 확정']].map(([a,b], i) => <div key={b} className="relative"><span className={`absolute -left-[15px] top-1 size-[7px] rounded-full border-2 border-white ${i === 0 ? 'bg-[#2563eb]' : 'bg-[#b8c0cc]'}`} /><div className="text-[10px] text-[#929baa]">{a}</div><div className="mt-0.5 text-xs">{b}</div></div>)}</div></div></aside>
    </div>
  </div>
}

function AssetCard({ asset, active, onClick }: { asset: Asset; active: boolean; onClick: () => void }) { const Icon = asset.icon; return <button onClick={onClick} className={`w-full rounded-lg border p-3 text-left transition ${active ? 'border-[#8eb2fa] bg-[#f1f6ff] shadow-[0_0_0_3px_#e7efff]' : 'border-[#e7eaee] bg-white hover:border-[#b9c7db]'}`}><div className="flex items-start justify-between"><div className={`flex size-8 items-center justify-center rounded-md ${asset.tone === 'blue' ? 'bg-[#eaf1ff] text-[#2563eb]' : asset.tone === 'green' ? 'bg-[#e9f8ef] text-[#26945b]' : asset.tone === 'violet' ? 'bg-[#f1ecff] text-[#7955c7]' : 'bg-[#fff5df] text-[#c37c16]'}`}><Icon className="size-4" /></div><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${asset.status === '최신' ? 'bg-[#e9f8ef] text-[#278a56]' : asset.status === '검토 필요' ? 'bg-[#fff2dc] text-[#b66a00]' : asset.status === '수정안 생성됨' ? 'bg-[#eaf1ff] text-[#2563eb]' : 'bg-[#f2f3f5] text-[#667085]'}`}>{asset.status}</span></div><div className="mt-3 text-xs font-semibold">{asset.name}</div><div className="mt-1 flex items-center justify-between text-[10px] text-[#8d96a4]"><span>{asset.source}</span><span>{asset.version}</span></div><div className="mt-2 text-[10px] text-[#a0a8b5]">{asset.detail}</div></button> }
function PersonEvent({ event }: any) { return <div className="flex gap-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e4efff] text-xs font-semibold text-[#2563eb]">{event.avatar}</div><div><div className="flex items-center gap-2"><span className="text-xs font-semibold">{event.name}</span><span className="text-[10px] text-[#9ba3af]">{event.time}</span></div><p className="mt-1 text-[13px] leading-6 text-[#4f5b6d]">{event.text}</p></div></div> }
function SystemEvent({ event, onReview, onHighlight }: any) { return <div className="rounded-lg border border-[#bcd2ff] bg-[#f6f9ff] p-4"><div className="flex items-start gap-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#2563eb] text-white"><Sparkles className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-xs font-semibold">Threvix</span><span className="text-[10px] text-[#9ba3af]">{event.time}</span><span className="rounded bg-[#e5efff] px-1.5 py-0.5 text-[10px] font-medium text-[#2563eb]">자동 감지</span></div><div className="mt-3 text-[13px] font-semibold text-[#1d4ed8]">{event.text}</div><div className="mt-3 grid gap-3 text-xs"><div><div className="mb-1 text-[10px] font-medium text-[#8993a3]">출처 · {event.source}</div><div className="rounded-md border border-[#d9e5fb] bg-white px-3 py-2 text-[#46546a]">“{event.request}”</div></div><div><div className="mb-1 text-[10px] font-medium text-[#8993a3]">현재 유효한 결정</div><div className="flex items-center gap-2 font-medium"><span>행사 시작 시간</span><span className="text-[#9aa3b1]">14:00</span><ArrowRight className="size-3 text-[#2563eb]" /><span className="text-[#2563eb]">15:00</span></div></div><div><div className="mb-1 text-[10px] font-medium text-[#8993a3]">영향받는 산출물</div><div className="flex flex-wrap gap-1.5"><span className="tag">행사 운영안 · 수정안 생성됨</span><span className="tag">초청 메일 · 수정안 생성됨</span><span className="tag gray">참가자 안내문 · 확인 필요</span></div></div></div><div className="mt-4 flex items-center gap-2"><Button onClick={() => { onHighlight(); onReview() }} size="sm" className="h-8 bg-[#2563eb] text-xs hover:bg-[#1d4ed8]">변경사항 확인 <ChevronRight data-icon="inline-end" /></Button><Button onClick={onHighlight} variant="outline" size="sm" className="h-8 bg-white text-xs">팀원에게 확인 요청</Button></div></div></div></div> }
function SectionTitle({ icon, title }: any) { return <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#697586]">{icon}{title}</div> }

function PullRequest({ setScreen, approved, setApproved, comment, setComment, setShowReview, setShowHistory }: any) { return <div className="mx-auto max-w-[1480px] px-5 py-5"><button onClick={() => setScreen('workspace')} className="mb-4 flex items-center gap-1.5 text-xs font-medium text-[#667085] hover:text-[#2563eb]"><ArrowLeft className="size-3.5" /> Workspace로 돌아가기</button><div className="mb-5 flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs text-[#7a8494]"><GitPullRequest className="size-4 text-[#2563eb]" /> 변경 요청 #24 <span className="rounded-full bg-[#fff2dc] px-2 py-0.5 text-[10px] font-medium text-[#b66a00]">{approved ? '반영 완료' : '검토 대기'}</span></div><h1 className="text-[24px] font-semibold tracking-[-0.03em]">행사 운영안</h1><p className="mt-1 text-xs text-[#8993a3]">현재 버전 v8 · 마지막 수정 10분 전</p></div><div className="flex gap-2"><Button variant="outline" size="sm" className="gap-1.5 bg-white text-xs" onClick={() => setShowHistory(true)}><Clock3 data-icon="inline-start" /> 버전 기록 보기</Button><Button variant="outline" size="sm" className="gap-1.5 bg-white text-xs"><Download data-icon="inline-start" /> 파일로 내보내기</Button></div></div><div className="mb-4 rounded-lg border border-[#dce7fb] bg-[#f7faff] p-4"><div className="flex items-start gap-3"><div className="flex size-8 items-center justify-center rounded-md bg-[#e5efff] text-[#2563eb]"><Link2 className="size-4" /></div><div className="flex-1"><div className="text-xs font-semibold">변경 근거</div><div className="mt-2 flex items-center gap-2 text-[11px] text-[#6f7b8d]"><span className="rounded bg-[#e8eef8] px-1.5 py-0.5 font-medium">Slack #client-a</span> 오늘 10:18 <button className="ml-1 text-[#2563eb] hover:underline">원문 보기</button></div><p className="mt-2 text-[13px] text-[#46546a]">“고객 요청: 행사 시작 시간을 14:00에서 15:00로 변경해주세요.”</p><div className="mt-3 flex items-center gap-2 border-t border-[#e1eafb] pt-3 text-xs"><Sparkles className="size-3.5 text-[#2563eb]" /><span className="font-semibold">Threvix 판단</span><span className="text-[#667085]">행사 시작 시간이</span><span className="font-semibold text-[#98a2b3]">14:00</span><ArrowRight className="size-3.5 text-[#2563eb]" /><span className="font-semibold text-[#2563eb]">15:00</span>으로 변경됨</div></div></div></div><div className="grid grid-cols-[minmax(500px,1fr)_280px] gap-4"><section className="rounded-lg border border-[#e1e5eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]"><div className="flex items-center justify-between border-b border-[#edf0f3] px-5 py-4"><div><h2 className="text-[13px] font-semibold">변경 내용 비교</h2><p className="mt-1 text-[11px] text-[#8993a3]">v8과 수정 제안의 차이</p></div><span className="flex items-center gap-1.5 text-[11px] text-[#667085]"><span className="size-2 rounded-sm bg-[#fee2e2]" /> 삭제 <span className="ml-2 size-2 rounded-sm bg-[#dcfce7]" /> 추가</span></div><div className="grid grid-cols-2 divide-x divide-[#edf0f3]"><div className="p-5"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-[#667085]">이전 버전</span><span className="rounded bg-[#f1f3f5] px-2 py-0.5 text-[10px] text-[#7a8494]">v8</span></div><div className="flex flex-col gap-7 text-[13px] leading-7 text-[#596579]"><div><div className="text-[11px] font-semibold text-[#8993a3]">행사 일정</div><div className="mt-1 rounded px-2 py-1">14:00 <span className="ml-2">오프닝 세션 시작</span></div></div><div><div className="text-[11px] font-semibold text-[#8993a3]">참고</div><div className="mt-1 rounded px-2 py-1">참가자 등록은 13:30부터 시작합니다.</div></div><div><div className="text-[11px] font-semibold text-[#8993a3]">장소</div><div className="mt-1 rounded px-2 py-1">3F Grand Hall</div></div></div></div><div className="bg-[#fbfefc] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-[#2563eb]">수정 제안</span><span className="rounded bg-[#e9f8ef] px-2 py-0.5 text-[10px] text-[#278a56]">검토 필요</span></div><div className="flex flex-col gap-7 text-[13px] leading-7 text-[#596579]"><div><div className="text-[11px] font-semibold text-[#8993a3]">행사 일정</div><button onClick={() => setComment(comment ? '' : '이 문구는 기존 표현으로 유지해주세요.')} className="mt-1 block w-full rounded border border-[#bbebca] bg-[#dcfce7] px-2 py-1 text-left text-[#18733f] hover:border-[#4caf72]"><span className="font-semibold">15:00</span><span className="ml-2">오프닝 세션 시작</span></button>{comment && <div className="mt-2 rounded-md border border-[#f0dca9] bg-[#fffaf0] p-2.5 text-[11px] text-[#765b20]"><div className="mb-1 flex items-center gap-1 font-semibold"><MessageSquare className="size-3" /> 김수현 · 인라인 댓글</div>{comment}<div className="mt-2 flex gap-1.5"><input placeholder="댓글을 입력하세요" className="min-w-0 flex-1 rounded border border-[#eadfbe] bg-white px-2 py-1 text-[11px] outline-none" /><button className="text-[#2563eb]">전송</button></div></div>}</div><div><div className="text-[11px] font-semibold text-[#8993a3]">참고</div><div className="mt-1 rounded border border-[#bbebca] bg-[#dcfce7] px-2 py-1 text-[#18733f]">참가자 등록은 14:30부터 시작합니다.</div></div><div><div className="text-[11px] font-semibold text-[#8993a3]">장소</div><div className="mt-1 rounded px-2 py-1">3F Grand Hall</div></div></div></div></div><div className="border-t border-[#edf0f3] px-5 py-3 text-[11px] text-[#8993a3]">수정 제안의 초록색 영역을 클릭하면 해당 문장에 댓글을 남길 수 있습니다.</div></section><aside className="flex flex-col gap-4"><div className="rounded-lg border border-[#e1e5eb] bg-white p-4"><SideTitle title="영향받는 다른 산출물" /><div className="flex flex-col gap-3"><button className="flex items-center justify-between text-xs"><span className="flex items-center gap-2"><Mail className="size-3.5 text-[#7955c7]" /> 초청 메일</span><ChevronRight className="size-3 text-[#a0a8b5]" /></button><button className="flex items-center justify-between text-xs"><span className="flex items-center gap-2"><FileText className="size-3.5 text-[#2563eb]" /> 참가자 안내문</span><ChevronRight className="size-3 text-[#a0a8b5]" /></button></div><div className="my-5 border-t border-[#edf0f3]" /><SideTitle title="Reviewer" /><div className="flex flex-col gap-2.5"><div className="flex items-center gap-2 text-xs"><div className="flex size-6 items-center justify-center rounded-full bg-[#e4efff] text-[10px] font-semibold text-[#2563eb]">수</div> 김수현 <Check className="ml-auto size-3.5 text-[#43a466]" /></div><div className="flex items-center gap-2 text-xs"><div className="flex size-6 items-center justify-center rounded-full bg-[#fcebdc] text-[10px] font-semibold text-[#b45309]">지</div> 박지민 <span className="ml-auto size-1.5 rounded-full bg-[#f59e0b]" /></div></div><Button onClick={() => setShowReview(true)} variant="outline" size="sm" className="mt-4 h-8 w-full bg-white text-xs">팀원에게 확인 요청</Button><Button variant="outline" size="sm" className="mt-2 h-8 w-full bg-white text-xs">수정 요청</Button><Button onClick={() => setApproved(true)} disabled={approved} size="sm" className="mt-2 h-9 w-full gap-1.5 bg-[#2563eb] text-xs hover:bg-[#1d4ed8]">{approved ? <><CheckCircle2 data-icon="inline-start" /> 승인됨</> : <><Check data-icon="inline-start" /> 승인</>}</Button></div>{approved && <div className="rounded-lg border border-[#bce6ca] bg-[#f0fdf4] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[#21864c]"><CheckCircle2 className="size-4" /> 변경사항이 현재 버전에 반영되었습니다.</div><div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-[#718174]">Current Version</span><span className="text-lg font-semibold text-[#21864c]">v9</span></div><button onClick={() => setShowHistory(true)} className="mt-3 text-[11px] font-medium text-[#21864c] hover:underline">버전 기록 보기 →</button></div>}</aside></div></div> }
function SideTitle({ title }: { title: string }) { return <h2 className="mb-4 text-[12px] font-semibold">{title}</h2> }
function ReviewModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) { return <ModalShell title="확인 요청" onClose={onClose}><div className="flex flex-col gap-5"><div><label className="mb-2 block text-xs font-semibold">확인할 사람</label><div className="flex flex-col gap-2">{['김수현','박지민','이서연'].map((name, i) => <label key={name} className="flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked={i < 2} className="accent-[#2563eb]" /> {name}</label>)}</div></div><div><label className="mb-2 block text-xs font-semibold">확인할 산출물</label><div className="flex flex-col gap-2">{['행사 운영안','초청 메일','참가자 안내문'].map((name, i) => <label key={name} className="flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked={i < 2} className="accent-[#2563eb]" /> {name}</label>)}</div></div><div><label className="mb-2 block text-xs font-semibold">메시지</label><textarea defaultValue="행사 시간 변경된 부분 확인 부탁드립니다." rows={3} className="w-full resize-none rounded-md border border-[#dfe4ea] p-2.5 text-xs outline-none focus:border-[#8eb2fa]" /></div></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>취소</Button><Button size="sm" onClick={onSubmit} className="bg-[#2563eb]">요청 보내기</Button></div></ModalShell> }
function HistoryModal({ onClose }: { onClose: () => void }) { return <ModalShell title="버전 기록" onClose={onClose}><p className="mb-4 text-xs text-[#8993a3]">행사 운영안의 모든 변경 기록입니다.</p><div className="flex flex-col gap-4">{[['v9 · Current','행사 시작 시간 변경','오늘 10:42',true],['v8','VIP 세션 장소 수정','어제',false],['v7','참가자 명단 업데이트','3일 전',false]].map(([v,t,d,current]) => <div key={v as string} className="flex gap-3"><div className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full ${current ? 'bg-[#e9f8ef] text-[#278a56]' : 'bg-[#f1f3f5] text-[#8993a3]'}`}>{current ? <Check className="size-3.5" /> : <FileText className="size-3.5" />}</div><div><div className="text-xs font-semibold">{v as string}</div><div className="mt-1 text-xs text-[#4f5b6d]">{t as string}</div><div className="mt-1 text-[10px] text-[#a0a8b5]">{d as string}</div></div></div>)}</div></ModalShell> }
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/30 p-4"><div className="w-full max-w-[420px] rounded-xl border border-[#e1e5eb] bg-white p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-[15px] font-semibold">{title}</h2><button onClick={onClose} className="text-[#8993a3] hover:text-[#172033]"><X className="size-4" /></button></div>{children}</div></div> }

/* Tailwind utility classes used in repeated prototype rows. */
const style = typeof document !== 'undefined' ? document.createElement('style') : null
if (style) { style.textContent = `.menu-item{display:flex;width:100%;align-items:center;gap:.5rem;border-radius:.375rem;padding:.5rem .625rem;text-align:left;font-size:.75rem;color:#4f5b6d}.menu-item:hover{background:#f1f5f9;color:#2563eb}.tag{border-radius:.25rem;background:#e8f1ff;padding:.25rem .5rem;font-size:10px;color:#2563eb}.tag.gray{background:#f1f3f5;color:#667085}`; if (!document.head.contains(style)) document.head.appendChild(style) }
