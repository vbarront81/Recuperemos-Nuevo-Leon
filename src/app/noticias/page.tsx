import Link from 'next/link';
import type {Metadata} from 'next';
import {PageHeader} from '@/components/shell';
import {Cards} from '@/components/content';
import {categories,searchArticles} from '@/lib/data';
export async function generateMetadata({searchParams}:{searchParams:Promise<{q?:string;categoria?:string}>}):Promise<Metadata>{
  const params=await searchParams;
  const selected=String(params.categoria||'').trim().slice(0,80);
  const cats=await categories();
  const category=cats.find(c=>c.slug===selected||c.name===selected);
  const title=category?category.name:'Noticias';
  return {title,description:category?`Últimas noticias de ${category.name} en Recuperemos Nuevo León.`:'Noticias locales, nacionales, política, espectáculos y tendencias virales.',alternates:{canonical:category?`/noticias?categoria=${encodeURIComponent(category.slug)}`:'/noticias'}};
}
export const dynamic='force-dynamic';
export default async function News({searchParams}:{searchParams:Promise<{q?:string;categoria?:string;pagina?:string}>}){
  const params=await searchParams;
  const q=String(params.q||'').trim().slice(0,100);
  const selected=String(params.categoria||'').trim().slice(0,80);
  const page=Math.min(Math.max(Number.parseInt(params.pagina||'1',10)||1,1),10000);
  const cats=await categories();
  const category=cats.find(c=>c.slug===selected||c.name===selected);
  const result=selected&&!category?{items:[],total:0,page,pageSize:12}:await searchArticles({q,categoryId:category?.id,page,pageSize:12});
  const maxPages=Math.max(1,Math.ceil(result.total/result.pageSize));
  function pageLink(number:number){const query=new URLSearchParams();if(q)query.set('q',q);if(category)query.set('categoria',category.slug);query.set('pagina',String(number));return `/noticias?${query}`;}
  const title=category?category.name:'Todas las noticias';
  const description=category?`Consulta la cobertura de ${category.name.toLowerCase()} publicada por Recuperemos Nuevo León.`:'Consulta la actualidad local, nacional, política, de espectáculos y viral.';
  const emptyTitle=q?'No encontramos noticias con esa búsqueda':category?`Aún no hay noticias de ${category.name}`:'Las noticias están por llegar';
  const emptyDescription=q?'Prueba con otras palabras o cambia los filtros para encontrar publicaciones.':category?'Esta sección mostrará aquí las publicaciones cuando el equipo editorial las publique.':'Cuando el equipo editorial publique noticias, aparecerán aquí automáticamente.';
  return <div className="container page-content"><PageHeader eyebrow="LA ACTUALIDAD NOS MUEVE" title={title} description={description}/>
    <nav className="archive-categories" aria-label="Filtrar noticias por sección"><Link href="/noticias" aria-current={!category?'page':undefined}>Todas</Link>{cats.map(c=><Link key={c.id} href={`/noticias?categoria=${encodeURIComponent(c.slug)}`} aria-current={category?.id===c.id?'page':undefined}>{c.name}</Link>)}</nav>
    <form action="/noticias" className="archive-tools"><input className="input" name="q" placeholder="Buscar artículos..." aria-label="Buscar artículos" defaultValue={q}/><select className="select" name="categoria" aria-label="Categoría" defaultValue={category?.slug||''}><option value="">Todas las categorías</option>{cats.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select><button type="submit">BUSCAR ↗</button></form>
    <Cards items={result.items} emptyTitle={emptyTitle} emptyDescription={emptyDescription}/>
    {result.total>result.pageSize&&<nav aria-label="Paginación de noticias" className="archive-tools" style={{marginTop:32,justifyContent:'space-between'}}>
      {page>1?<Link className="button" href={pageLink(page-1)}>← ANTERIOR</Link>:<span/>}
      <span>Página {Math.min(page,maxPages)} de {maxPages} · {result.total} artículos</span>
      {page<maxPages?<Link className="button" href={pageLink(page+1)}>SIGUIENTE →</Link>:<span/>}
    </nav>}
  </div>;
}
