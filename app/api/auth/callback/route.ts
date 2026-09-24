import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchDiscordUser } from "@/lib/discord";
import { createSession, isAuthorizedAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = cookies().get("aishu_oauth_state")?.value;
  cookies().delete("aishu_oauth_state");
  if (!code || !state || !expected || state !== expected)
    return NextResponse.redirect(new URL("/login?error=state_mismatch", req.url));
  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchDiscordUser(token.access_token);
    if (!isAuthorizedAdmin(user.id))
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    await createSession({ sub: user.id, username: user.username, avatar: user.avatar, discordAccessToken: token.access_token });
    return NextResponse.redirect(new URL("/overview", req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}