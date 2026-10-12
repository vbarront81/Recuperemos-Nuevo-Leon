import 'server-only';

/** Valida Turnstile en servidor y comprueba que el token corresponde al dominio configurado. */
export async function validateHuman(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !token || token.length > 2048 || !siteUrl) return false;

  let allowedHostnames: Set<string>;
  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();
    const withoutWww = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    allowedHostnames = new Set([withoutWww, `www.${withoutWww}`]);
  } catch {
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (typeof result !== 'object' || result === null || !('success' in result) || result.success !== true) return false;
    if (!('hostname' in result) || typeof result.hostname !== 'string') return false;
    return allowedHostnames.has(result.hostname.toLowerCase());
  } catch {
    return false;
  }
}
