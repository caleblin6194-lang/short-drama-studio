import { NextRequest, NextResponse } from 'next/server'

// 需要登录才能访问的路径前缀
const PROTECTED_PREFIXES = ['/dashboard', '/project', '/projects']

// 仅管理员可访问
const ADMIN_PREFIXES = ['/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('sb-access-token')?.value

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAdmin = ADMIN_PREFIXES.some(p => pathname.startsWith(p))

  if ((isProtected || isAdmin) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*',
    '/projects/:path*',
    '/admin/:path*',
  ],
}
