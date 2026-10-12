import type {MetadataRoute} from 'next';
import {publishedPaths} from '@/lib/data';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';const routes=['','noticias','quienes-somos','contacto','publicidad','terminos-y-condiciones','aviso-de-privacidad'];const articles=await publishedPaths();return [...routes.map(path=>({url:`${base}/${path}`,lastModified:new Date()})),...articles.map(x=>({url:`${base}/noticias/${x.slug}`,lastModified:x.published_at?new Date(x.published_at):new Date()}))];}
