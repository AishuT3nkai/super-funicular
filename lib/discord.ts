const API_BASE = "https://discord.com/api/v10";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function buildAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: requireEnv("DISCORD_CLIENT_ID"),
    redirect_uri: requireEnv("DISCORD_REDIRECT_URI"),
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    client_id: requireEnv("DISCORD_CLIENT_ID"),
    client_secret: requireEnv("DISCORD_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: requireEnv("DISCORD_REDIRECT_URI"),
  });
  const res = await fetch(`${API_BASE}/oauth2/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store",
  });
  if (!res.ok) throw new Error(`Discord token exchange failed: ${res.status}`);
  return await res.json() as { access_token: string; token_type: string; expires_in: number; refresh_token: string; scope: string };
}

export async function fetchDiscordUser(accessToken: string) {
  const res = await fetch(`${API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch Discord user: ${res.status}`);
  return await res.json() as { id: string; username: string; avatar: string | null };
}