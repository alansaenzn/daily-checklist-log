import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const isAuthed = !!data.user;

  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/sign-in") ||
    path.startsWith("/auth/") ||
    path === "/auth";

  // If authenticated, check onboarding status and gate routes
  if (isAuthed) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user!.id)
        .single();

      const needsOnboarding = profile && profile.onboarding_completed === false;

      if (needsOnboarding && !path.startsWith("/onboarding")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (!needsOnboarding && path.startsWith("/onboarding")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    } catch (_) {
      // If profile read fails, default to allowing route; RLS may handle later
    }
  }

  if (!isAuthed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (isAuthed && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
