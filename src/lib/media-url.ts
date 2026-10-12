/** Solo usa recursos subidos al bucket público media o imágenes locales de marca. */
export function isAllowedMediaUrl(value: string): boolean {
  if (!value) return true;
  if (/^\/brand\/[a-zA-Z0-9._-]+$/.test(value)) return true;
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl) return false;
  try {
    const base = new URL(configuredUrl);
    const candidate = new URL(value);
    return candidate.protocol === 'https:' &&
      candidate.origin === base.origin &&
      candidate.pathname.startsWith('/storage/v1/object/public/media/') &&
      !candidate.username && !candidate.password;
  } catch {
    return false;
  }
}
