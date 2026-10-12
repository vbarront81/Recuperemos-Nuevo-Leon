export function formatNewsDate(value: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(date);
}
