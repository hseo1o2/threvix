'use client'

import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs'

export function PdfPreview({ variant, title }: { variant: 'original' | 'proposed'; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('문서 렌더링 중…')
  const [pageCount, setPageCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    let pdf: PDFDocumentProxy | undefined
    async function render() {
      try {
        let response: Response | undefined
        for (let attempt = 0; attempt < 3; attempt += 1) {
          response = await fetch(`/api/documents/preview?variant=${variant}`, { cache: 'no-store' })
          if (response.ok) break
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
        }
        if (!response?.ok) throw new Error('PDF preview request failed after retries')
        pdf = await getDocument({ data: await response.arrayBuffer() }).promise
        if (cancelled || !containerRef.current) return
        const container = containerRef.current
        container.replaceChildren()
        const ratio = window.devicePixelRatio || 1
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
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
          container.appendChild(paper)
          await page.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined }).promise
        }
        if (!cancelled) { setPageCount(pdf.numPages); setStatus('') }
      } catch (error) { if (!cancelled) setStatus(error instanceof Error ? `PDF 미리보기 오류: ${error.message}` : 'PDF 미리보기를 불러오지 못했습니다.') }
    }
    render()
    return () => { cancelled = true; pdf?.destroy() }
  }, [variant, title])
  return <div className="relative min-h-[720px] bg-[#eef0f3] p-4"><div ref={containerRef} aria-label={title} className="min-h-[680px]">{status && <div className="absolute inset-0 z-10 grid place-items-center bg-[#eef0f3]/95 px-4 text-center text-xs text-[#667085]">{status}</div>}</div>{!status && <div className="sticky bottom-3 mx-auto mt-2 w-fit rounded-full border border-[#dfe3e8] bg-white/95 px-3 py-1 text-[10px] text-[#667085] shadow-sm">{pageCount}페이지 · 세로 스크롤</div>}</div>
}
