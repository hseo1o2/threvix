'use client'

import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs'

type PreviewProps = { variant: 'original' | 'proposed'; title: string; highlights?: string[] }

export function PdfPreview({ variant, title, highlights = [] }: PreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('문서 렌더링 중…')
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let loadingTask: ReturnType<typeof getDocument> | undefined
    const renderTasks: Array<{ cancel?: () => void }> = []
    const host = hostRef.current

    async function render() {
      if (!host) return
      host.replaceChildren()
      setStatus('문서 렌더링 중…')
      setPageCount(0)
      try {
        let response: Response | undefined
        for (let attempt = 0; attempt < 3; attempt += 1) {
          response = await fetch(`/api/documents/preview?variant=${variant}`, { cache: 'force-cache' })
          if (response.ok) break
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)))
        }
        if (!response?.ok) throw new Error(`PDF preview request failed: HTTP ${response?.status ?? 'unknown'}`)
        loadingTask = getDocument({ data: await response.arrayBuffer() })
        const pdf = await loadingTask.promise
        if (cancelled) return
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return
          const page = await pdf.getPage(pageNumber)
          const base = page.getViewport({ scale: 1 })
          const availableWidth = Math.max(280, host.clientWidth - 24)
          const scale = Math.min(1.45, availableWidth / base.width)
          const viewport = page.getViewport({ scale })
          const paper = document.createElement('div')
          paper.className = 'relative mx-auto mb-4 w-fit max-w-full overflow-hidden bg-white shadow-sm'
          const canvas = document.createElement('canvas')
          canvas.setAttribute('aria-label', `${title} ${pageNumber}페이지`)
          canvas.width = Math.floor(viewport.width * ratio)
          canvas.height = Math.floor(viewport.height * ratio)
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.style.display = 'block'
          paper.style.width = `${viewport.width}px`
          paper.style.maxWidth = '100%'
          paper.appendChild(canvas)
          host.appendChild(paper)
          const renderTask = page.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined })
          renderTasks.push(renderTask)
          await renderTask.promise
          if (highlights.length) {
            const text = await page.getTextContent()
            for (const item of text.items) {
              if (!('str' in item)) continue
              const normalizedItem = item.str.replace(/\s+/g, ' ').trim()
              const matches = highlights.some((value) => {
                const normalizedValue = value.replace(/\s+/g, ' ').trim()
                return normalizedItem.includes(normalizedValue) || normalizedValue.split(/\s+/).some((part) => part.length > 2 && normalizedItem.includes(part))
              })
              if (!matches) continue
              const [, , , fontHeight, x, y] = item.transform
              const [left, top] = viewport.convertToViewportPoint(x, y)
              const [right, bottom] = viewport.convertToViewportPoint(x + item.width, y + Math.abs(fontHeight))
              const marker = document.createElement('div')
              marker.className = 'pointer-events-none absolute rounded bg-[#ffe066]/70 ring-1 ring-[#e2ad00]/50'
              marker.style.left = `${Math.min(left, right) - 2}px`
              marker.style.top = `${Math.min(top, bottom) - 2}px`
              marker.style.width = `${Math.max(Math.abs(right - left) + 4, 24)}px`
              marker.style.height = `${Math.max(Math.abs(bottom - top) + 4, 12)}px`
              paper.appendChild(marker)
            }
          }
        }
        if (!cancelled) { setPageCount(pdf.numPages); setStatus('') }
      } catch (error) {
        if (!cancelled && error instanceof Error && error.name !== 'RenderingCancelledException') setStatus(`PDF 미리보기 오류: ${error.message}`)
      }
    }
    void render()
    return () => { cancelled = true; renderTasks.forEach((task) => task.cancel?.()); loadingTask?.destroy?.(); host?.replaceChildren() }
  }, [variant, title, highlights])

  return <div className="relative h-[min(68vh,760px)] min-h-[420px] overflow-y-auto overscroll-contain bg-[#eef0f3] p-3 sm:p-4"><div ref={hostRef} aria-label={title} className="min-h-[680px] w-full" />{status && <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#eef0f3]/95 px-4 text-center text-xs text-[#667085]">{status}</div>}{!status && <div className="sticky bottom-3 mx-auto mt-2 w-fit rounded-full border border-[#dfe3e8] bg-white/95 px-3 py-1 text-[10px] text-[#667085]">{pageCount}페이지 · 세로 스크롤</div>}</div>
}
