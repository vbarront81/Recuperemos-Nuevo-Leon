import { configured, db } from './supabase';

export type Category = { id: string; name: string; slug: string };
export type Settings = Record<string, string>;
export type Content = {
  id: string; title: string; slug: string; subtitle: string; body: string; cover_url: string;
  status: string; featured: boolean; published_at: string | null; category_id: string;
  author_id: string; tags: string; created_at?: string;
  categories?: { name: string; slug: string } | null;
};

const categoryOrder = ['local', 'nacional', 'politica', 'espectaculos', 'viral'];
const defaultCategories: Category[] = [
  { id: 'local', name: 'Local', slug: 'local' },
  { id: 'nacional', name: 'Nacional', slug: 'nacional' },
  { id: 'politica', name: 'Política', slug: 'politica' },
  { id: 'espectaculos', name: 'Espectáculos', slug: 'espectaculos' },
  { id: 'viral', name: 'Viral', slug: 'viral' },
];

export async function settings(): Promise<Settings> {
  if (!configured()) return {};
  const client = await db();
  const { data, error } = await client.from('settings').select('key,value');
  if (error) throw new Error('No fue posible leer la configuración del sitio');
  return Object.fromEntries((data ?? []).map((item) => [item.key, item.value]));
}

export async function published(): Promise<Content[]> {
  if (!configured()) return [];
  const client = await db();
  const { data, error } = await client.from('articles')
    .select('*, categories(name,slug)')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(48);
  if (error) throw new Error('No fue posible leer las noticias');
  return (data ?? []) as Content[];
}

export async function categories(): Promise<Category[]> {
  if (!configured()) return defaultCategories;
  const client = await db();
  const { data, error } = await client.from('categories').select('id,name,slug');
  if (error) throw new Error('No fue posible leer las categorías');
  const rank = (slug: string) => { const i = categoryOrder.indexOf(slug); return i < 0 ? 999 : i; };
  return ((data ?? defaultCategories) as Category[]).sort((a, b) => rank(a.slug) - rank(b.slug));
}

export async function publishedOne(slug: string): Promise<Content | null> {
  if (!configured()) return null;
  const client = await db();
  const { data, error } = await client.from('articles')
    .select('*, categories(name,slug)')
    .eq('slug', slug).eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString()).maybeSingle();
  if (error) throw new Error('No fue posible leer la noticia');
  return (data as Content | null) ?? null;
}

export async function relatedArticles(categoryId: string, currentSlug: string, limit = 3): Promise<Content[]> {
  if (!configured()) return [];
  const client = await db();
  const { data, error } = await client.from('articles')
    .select('*, categories(name,slug)')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(Math.min(Math.max(Math.trunc(limit), 1), 6));
  if (error) throw new Error('No fue posible cargar noticias relacionadas');
  return (data ?? []) as Content[];
}

export async function searchArticles(options: { q?: string; categoryId?: string; page?: number; pageSize?: number }): Promise<{items: Content[]; total: number; page: number; pageSize: number}> {
  const page = Math.min(Math.max(Math.trunc(options.page || 1), 1), 10000);
  const pageSize = Math.min(Math.max(Math.trunc(options.pageSize || 12), 1), 30);
  if (!configured()) return { items: [], total: 0, page, pageSize };
  const client = await db();
  let query = client.from('articles').select('*, categories(name,slug)', { count: 'exact' })
    .eq('status', 'published').not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString());
  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (options.q?.trim()) query = query.textSearch('search_vector', options.q.trim().slice(0, 100), { type: 'websearch', config: 'spanish' });
  const { data, error, count } = await query.order('published_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error('No fue posible buscar noticias en este momento');
  return { items: (data ?? []) as Content[], total: count ?? 0, page, pageSize };
}

export async function publishedPaths(): Promise<{slug: string; published_at: string | null}[]> {
  if (!configured()) return [];
  const client = await db();
  const { data, error } = await client.from('articles').select('slug,published_at')
    .eq('status', 'published').not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false }).limit(1000);
  if (error) throw new Error('No fue posible construir el sitemap');
  return data ?? [];
}
