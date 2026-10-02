'use client'

import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs'

type PreviewProps = { variant: 'original' | 'proposed'; title: string }

export function PdfPreview({ variant, title }: PreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('문서 렌더링 중…')
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let loadingTask: ReturnType<typeof getDocument> | undefined
    let renderTasks: Array<{ cancel?: () => void }> = []
    const host = hostRef.current

    async function render() {
      if (!host) return
      host.replaceChildren()
      setStatus('문서 렌더링 중…')
      setPageCount(0)

      try {
        let response: Response | undefined
        for (let attempt = 0; attempt < 3; attempt += 1) {
          response = await fetch(`/api/documents/preview?variant=${variant}`, { cache: 'no-store' })
          if (response.ok) break
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)))
        }
        if (!response?.ok) {
          let detail = `HTTP ${response?.status ?? 'unknown'}`
          try {
            const body = await response?.json()
            if (body?.error) detail = body.error
          } catch { /* keep the HTTP status when the server returned non-JSON */ }
          throw new Error(`PDF preview request failed: ${detail}`)
        }

        loadingTask = getDocument({ data: await response.arrayBuffer() })
        const pdf = await loadingTask.promise
        if (cancelled) return

        const ratio = window.devicePixelRatio || 1
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return
          const page = await pdf.getPage(pageNumber)
          const base = page.getViewport({ scale: 1 })
          const scale = Math.min(1.35, 680 / base.width)
          const viewport = page.getViewport({ scale })
          const paper = document.createElement('div')
          paper.className = 'relative mx-auto mb-4 w-fit bg-white shadow-sm'
          const canvas = document.createElement('canvas')
          canvas.setAttribute('aria-label', `${title} ${pageNumber}페이지`)
          canvas.width = Math.floor(viewport.width * ratio)
          canvas.height = Math.floor(viewport.height * ratio)
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`
          paper.appendChild(canvas)
          host.appendChild(paper)
          const renderTask = page.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined })
          renderTasks.push(renderTask)
          await renderTask.promise
        }

        if (!cancelled) {
          setPageCount(pdf.numPages)
          setStatus('')
        }
      } catch (error) {
        if (!cancelled && error instanceof Error && error.name !== 'RenderingCancelledException') {
          setStatus(`PDF 미리보기 오류: ${error.message}`)
        }
      }
    }

    void render()
    return () => {
      cancelled = true
      renderTasks.forEach((task) => task.cancel?.())
      loadingTask?.destroy?.()
      host?.replaceChildren()
    }
  }, [variant, title])

  return (
    <div className="relative min-h-[720px] bg-[#eef0f3] p-4">
      <div ref={hostRef} aria-label={title} className="min-h-[680px]" />
      {status && <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#eef0f3]/95 px-4 text-center text-xs text-[#667085]">{status}</div>}
      {!status && <div className="sticky bottom-3 mx-auto mt-2 w-fit rounded-full border border-[#dfe3e8] bg-white/95 px-3 py-1 text-[10px] text-[#667085] shadow-sm">{pageCount}페이지 · 세로 스크롤</div>}
    </div>
  )
}
