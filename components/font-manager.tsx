'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FileType2, Loader2, Trash2, Upload, X } from 'lucide-react'

type UserFont = { id: string; file_name: string; storage_path: string; font_family: string | null; mime_type: string; file_size: number; created_at: string }

const ACCEPTED = new Set(['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff', 'application/font-woff2'])
const MAX_SIZE = 20 * 1024 * 1024

export function FontManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fonts, setFonts] = useState<UserFont[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getSupabase = () => createClient()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadFonts() {
      setLoading(true)
      setError(null)
      const { data: { user } } = await getSupabase().auth.getUser()
      if (cancelled) return
      setUserId(user?.id ?? null)
      if (!user) { setLoading(false); return }
      const { data, error: queryError } = await getSupabase().from('user_fonts').select('id,file_name,storage_path,font_family,mime_type,file_size,created_at').order('created_at', { ascending: false })
      if (!cancelled) { setFonts(data ?? []); setError(queryError?.message ?? null); setLoading(false) }
    }
    loadFonts()
    return () => { cancelled = true }
  }, [open])

  async function uploadFont(file: File) {
    if (!userId) { setError('폰트를 업로드하려면 먼저 로그인해야 합니다.'); return }
    if (!ACCEPTED.has(file.type) && !/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(file.name)) { setError('TTF, OTF, WOFF, WOFF2 파일만 업로드할 수 있습니다.'); return }
    if (file.size > MAX_SIZE) { setError('폰트 파일은 20MB 이하만 업로드할 수 있습니다.'); return }
    setBusy(true); setError(null)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await getSupabase().storage.from('user-fonts').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (uploadError) { setError(uploadError.message); setBusy(false); return }
    const { data, error: insertError } = await getSupabase().from('user_fonts').insert({ user_id: userId, file_name: file.name, storage_path: path, font_family: file.name.replace(/\.[^.]+$/, ''), mime_type: file.type || 'application/octet-stream', file_size: file.size }).select('id,file_name,storage_path,font_family,mime_type,file_size,created_at').single()
    if (insertError) { await getSupabase().storage.from('user-fonts').remove([path]); setError(insertError.message); setBusy(false); return }
    setFonts((current) => [data, ...current]); setBusy(false)
  }

  async function removeFont(font: UserFont) {
    setBusy(true); setError(null)
    const [{ error: storageError }, { error: rowError }] = await Promise.all([getSupabase().storage.from('user-fonts').remove([font.storage_path]), getSupabase().from('user_fonts').delete().eq('id', font.id)])
    if (storageError || rowError) setError(storageError?.message ?? rowError?.message ?? '폰트를 삭제하지 못했습니다.')
    else setFonts((current) => current.filter((item) => item.id !== font.id))
    setBusy(false)
  }

  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="font-manager-title" className="w-full max-w-xl overflow-hidden rounded-xl border border-[#dce2ea] bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-[#edf0f3] px-6 py-5"><div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">Document typography</div><h2 id="font-manager-title" className="mt-1 text-lg font-semibold">내 문서 글꼴</h2><p className="mt-1 text-xs leading-5 text-[#667085]">업로드한 글꼴은 내 계정에 안전하게 저장·관리됩니다. PDF 렌더링 적용은 폰트 주입 worker 연결 후 지원됩니다.</p></div><button onClick={onClose} aria-label="닫기" className="rounded-md p-2 text-[#667085]"><X className="size-5" /></button></header><div className="space-y-4 p-6">{!userId ? <div className="rounded-lg border border-[#f0d9a8] bg-[#fff9ed] p-4 text-xs text-[#8b641f]">폰트 업로드를 사용하려면 Supabase Auth로 로그인해야 합니다.</div> : <><input ref={inputRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadFont(file); event.currentTarget.value = '' }} /><button disabled={busy} onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#9bbcff] bg-[#f7faff] px-4 py-5 text-sm font-semibold text-[#2563eb] hover:bg-[#eef4ff] disabled:opacity-50"><Upload className="size-4" />{busy ? '처리 중...' : '글꼴 파일 업로드'}</button></>}{error && <p role="alert" className="text-xs text-[#b42318]">{error}</p>}<div className="space-y-2"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-[#344054]">업로드된 글꼴</h3><span className="text-[10px] text-[#98a2b3]">{fonts.length}개</span></div>{loading ? <div className="flex justify-center py-6 text-[#98a2b3]"><Loader2 className="size-4 animate-spin" /></div> : fonts.length === 0 ? <div className="rounded-lg border border-[#edf0f3] bg-[#fbfcfd] px-4 py-6 text-center text-xs text-[#98a2b3]">아직 업로드한 글꼴이 없습니다.</div> : fonts.map((font) => <div key={font.id} className="flex items-center gap-3 rounded-lg border border-[#e5e8ed] px-3 py-3"><div className="flex size-9 items-center justify-center rounded-md bg-[#eef4ff] text-[#2563eb]"><FileType2 className="size-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-[#344054]">{font.file_name}</div><div className="mt-1 text-[10px] text-[#98a2b3]">{Math.ceil(font.file_size / 1024)} KB · {font.font_family}</div></div><Button variant="ghost" size="icon" disabled={busy} onClick={() => removeFont(font)} aria-label={`${font.file_name} 삭제`}><Trash2 className="size-4 text-[#98a2b3]" /></Button></div>)}</div></div></section></div>
}

export type { UserFont }
