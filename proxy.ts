import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseConfig';

/** เฉพาะหน้าเข้าสู่ระบบกับสมัครสมาชิกที่เข้าถึงได้โดยไม่ต้องล็อกอิน */
const PUBLIC_ROUTES = ['/login', '/register'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() ตรวจสอบ session จริงกับ Supabase (ไม่เชื่อค่าใน cookie อย่างเดียว)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicRoute(pathname);

  // ยังไม่ล็อกอินและพยายามเข้าเว็บ -> ส่งไปหน้า Login พร้อมจำ path เดิมไว้
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    if (pathname !== '/') {
      url.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    }
    return NextResponse.redirect(url);
  }

  // ล็อกอินอยู่แล้วแต่พยายามเข้าหน้า Login/Register -> ส่งกลับหน้าแรก
  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * ข้าม: API routes, static assets, ไฟล์ใน public และไฟล์รูปภาพ
     * ที่เหลือทุกหน้า (/, /dashboard, /machines, /alarms, /maintenance ฯลฯ) ต้องผ่านการล็อกอิน
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|woff2?)$).*)',
  ],
};
