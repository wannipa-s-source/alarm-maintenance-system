import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** เส้นทางที่ไม่ต้องล็อกอิน */
const PUBLIC_PATHS = ['/login'];

/**
 * Proxy คุมการเข้าถึงเส้นทาง (Next.js 16 เปลี่ยนชื่อจาก middleware.ts เป็น proxy.ts)
 * - ยังไม่ล็อกอิน และพยายามเข้าเส้นทางที่ต้องล็อกอิน -> ส่งไปหน้า /login
 * - ล็อกอินแล้ว แต่พยายามเข้า /login -> ส่งไปหน้า /dashboard
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() ตรวจสอบ token กับ Supabase Auth server (ปลอดภัยกว่า getSession())
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // ตัดทิ้งเฉพาะไฟล์ static / API เพื่อไม่ให้ auth logic บล็อก CSS, JS และรูปภาพ
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
