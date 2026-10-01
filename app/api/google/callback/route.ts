import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const result = url.searchParams.get('error') ? 'error' : 'connected'
  const redirect = new URL('/', url.origin)
  redirect.searchParams.set('google', result)
  return NextResponse.redirect(redirect)
}
