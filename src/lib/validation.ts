import { z } from 'zod';
export const statusSchema = z.enum(['draft','review','published','archived']);
const httpsUrl = z.union([z.literal(''),z.url().refine(value => value.startsWith('https://'), 'Debe ser una URL HTTPS')]);
export const contentSchema = z.object({
  title:z.string().trim().min(5).max(180),
  slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  subtitle:z.string().trim().max(500),
  body:z.string().min(1).max(100000),
  status:statusSchema,
  cover_url:httpsUrl,
  category_id:z.uuid(),
  featured:z.boolean(),
  tags:z.string().max(500)
});
export const messageSchema = z.object({
  name:z.string().trim().min(2).max(100),
  email:z.email().max(254),
  subject:z.string().trim().min(3).max(180),
  message:z.string().trim().min(10).max(5000),
  consent:z.literal(true),
  website:z.literal(''),
  kind:z.enum(['contact','advertising'])
});
export function slugify(value:string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,140);
}
