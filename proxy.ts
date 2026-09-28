import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseConfig';
import { canAccessRoute, normalizeRole } from '@/lib/permissions';

/** เฉพาะหน้าเข้าสู่ระบบที่เข้าถึงได้โดยไม่ต้องล็อกอิน */
const PUBLIC_ROUTES = ['/login'];

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

  // ล็อกอินแล้วแต่บทบาทไม่ถึงหน้านี้ -> ส่งกลับหน้าแรกพร้อมข้อความแจ้งเหตุผล
  if (user && !canAccessRoute(pathname, 'viewer')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!canAccessRoute(pathname, normalizeRole(profile?.role))) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      url.searchParams.set('denied', pathname);
      return NextResponse.redirect(url);
    }
  }

  // หมายเหตุ: ปล่อยให้ผู้ที่ล็อกอินแล้วเข้าหน้า Login ได้
  // เพื่อให้มีปุ่ม "Logout" ไว้กดเปลี่ยนบัญชีจากหน้านี้
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
