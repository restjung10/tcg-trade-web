import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATTERNS = [
  /^\/mypage/,
  /^\/boards\/(sell|buy)\/write/,
  /^\/boards\/(sell|buy)\/[^/]+\/edit/,
  /^\/boards\/(sell|buy)\/[^/]+\/report/,
  /^\/chat/,
  /^\/admin/,
];
const ONBOARDING_PATH = "/onboarding/nickname";
const SUSPENDED_PATH = "/suspended";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATTERNS.some((pattern) => pattern.test(path));

  if (!user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (isProtected || path === ONBOARDING_PATH) {
    const { data: statusRows } = await supabase.rpc("get_my_account_status");
    const status = statusRows?.[0];

    if (status?.suspended && path !== SUSPENDED_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = SUSPENDED_PATH;
      return NextResponse.redirect(url);
    }

    if (
      status &&
      !status.suspended &&
      !status.onboarded &&
      path !== ONBOARDING_PATH
    ) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_PATH;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
