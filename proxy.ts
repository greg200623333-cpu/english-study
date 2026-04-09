import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const session = await getSession()

  const protectedPaths: string[] = []
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!session && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
