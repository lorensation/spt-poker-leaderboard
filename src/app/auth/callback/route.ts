import { NextResponse, type NextRequest } from "next/server";

import { completePlayerIdentityLink } from "@/lib/auth/player";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/profile";
  const authError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(new URL(`/identify?error=${encodeURIComponent(authError)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/identify?error=This sign-in link is invalid or expired. Request a new link.", request.url));
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/identify?error=This sign-in link is invalid or expired. Request a new link.", request.url));
  }

  const linkResult = await completePlayerIdentityLink();
  if (!linkResult.success) {
    return NextResponse.redirect(new URL(`/identify?error=${encodeURIComponent(linkResult.message)}`, request.url));
  }

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/profile", request.url));
}
