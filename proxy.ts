import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/dashboard")) {
    return copyCookies(response, NextResponse.redirect(new URL("/login", request.url)));
  }
  if (user && pathname === "/login") {
    return copyCookies(response, NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
