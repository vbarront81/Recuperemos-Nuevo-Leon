import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, MapPin, Newspaper } from 'lucide-react';
import { Cards, SectionTitle } from '@/components/content';
import { categories, published, settings, type Category, type Content } from '@/lib/data';
import { formatNewsDate } from '@/lib/date-format';

export const dynamic = 'force-dynamic';

function categoryHref(category: Category) {
  return `/noticias?categoria=${encodeURIComponent(category.slug)}`;
}

function LeadStory({ article }: { article: Content }) {
  return (
    <article className="front-lead">
      <Link className="front-lead-image" href={`/noticias/${article.slug}`} aria-label={`Leer: ${article.title}`}>
        {article.cover_url ? (
          <Image src={article.cover_url} fill priority sizes="(max-width: 800px) 100vw, 62vw" alt={article.title} />
        ) : (
          <div className="story-placeholder"><Newspaper size={58} aria-hidden="true" /></div>
        )}
      </Link>
      <div className="front-lead-copy">
        <div className="story-meta">
          <Link href={categoryHref({ id: article.category_id, name: article.categories?.name || 'Noticias', slug: article.categories?.slug || '' })}>
            {article.categories?.name || 'Noticias'}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={article.published_at || undefined}>{formatNewsDate(article.published_at)}</time>
        </div>
        <h1><Link href={`/noticias/${article.slug}`}>{article.title}</Link></h1>
        {article.subtitle && <p>{article.subtitle}</p>}
        <Link className="story-more" href={`/noticias/${article.slug}`}>Leer noticia <ArrowUpRight size={17} /></Link>
      </div>
    </article>
  );
}

function Headlines({ items }: { items: Content[] }) {
  return (
    <ol className="front-headlines">
      {items.map((article) => (
        <li key={article.id}>
          <Link className="front-headline-category" href={`/noticias?categoria=${encodeURIComponent(article.categories?.slug || '')}`}>
            {article.categories?.name || 'Noticias'}
          </Link>
          <h2><Link href={`/noticias/${article.slug}`}>{article.title}</Link></h2>
          <time dateTime={article.published_at || undefined}>{formatNewsDate(article.published_at)}</time>
        </li>
      ))}
    </ol>
  );
}

function SectionEmpty({ category, hasPublished }: { category: Category; hasPublished: boolean }) {
  return (
    <p className="category-empty">
      {hasPublished
        ? `Las noticias de ${category.name} ya aparecen arriba.`
        : `Aún no hay noticias publicadas en ${category.name}.`}
      {' '}<Link href={categoryHref(category)}>Ver toda la sección <ArrowUpRight size={14} /></Link>
    </p>
  );
}

export default async function Home() {
  const [news, cfg, cats] = await Promise.all([published(), settings(), categories()]);
  const lead = news.find((article) => article.featured) || news[0];
  const usedIds = new Set<string>(lead ? [lead.id] : []);
  const headlines = news.filter((article) => !usedIds.has(article.id)).slice(0, 3);
  headlines.forEach((article) => usedIds.add(article.id));
  const recent = news.filter((article) => !usedIds.has(article.id)).slice(0, 6);
  recent.forEach((article) => usedIds.add(article.id));
  const sectionItems = cats.map((category) => {
    const categoryNews = news.filter((article) => article.category_id === category.id);
    const items = categoryNews.filter((article) => !usedIds.has(article.id)).slice(0, 3);
    items.forEach((article) => usedIds.add(article.id));
    return { category, items, hasPublished: categoryNews.length > 0 };
  });

  return (
    <>
      <section className="home-hero" aria-label="Identidad del portal">
        <div className="container">
          <div className="hero-eyebrow">
            <span>ACTUALIDAD / INFORMACIÓN / CONTEXTO</span>
            <span><MapPin size={15} aria-hidden="true" /> NUEVO LEÓN, MÉXICO</span>
          </div>
          <div className="hero-art">
            <Image
              src={cfg.banner_url || '/brand/banner-nuevo-leon.jpg'}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 1320px"
              alt="Recuperemos Nuevo León"
            />
          </div>
          <div className="hero-caption">
            <p>LA INFORMACIÓN<br /><b>QUE NOS IMPORTA.</b></p>
            <Link href="/noticias">IR A NOTICIAS <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <div className="ticker" aria-label="Secciones del portal">
        <div className="container ticker-inner">
          <span>RECUPEREMOS NUEVO LEÓN</span>
          <span>LOCAL <b aria-hidden="true">✳</b> NACIONAL <b aria-hidden="true">✳</b> POLÍTICA <b aria-hidden="true">✳</b> ESPECTÁCULOS <b aria-hidden="true">✳</b> VIRAL</span>
        </div>
      </div>

      <div className="container">
        <section className="intro-statement front-intro">
          <span className="eyebrow">UN PORTAL PARA MANTENERTE INFORMADO</span>
          <div>
            <h2>LO QUE PASA.<br /><em>LO QUE IMPORTA.</em></h2>
            <p>Actualidad de Nuevo León y México, información pública y cultura popular. Noticias organizadas por sección, con contexto y sin rumores presentados como hechos.</p>
          </div>
        </section>

        <nav className="category-strip" aria-label="Explorar noticias por categoría">
          {cats.map((category) => (
            <Link key={category.id} href={categoryHref(category)}>
              {category.name}<ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <section className="section front-page-top" aria-labelledby="front-page-heading">
          <SectionTitle number="01" title="En portada" href="/noticias" />
          {lead ? (
            <div className="front-news-grid">
              <LeadStory article={lead} />
              {headlines.length > 0 && <Headlines items={headlines} />}
            </div>
          ) : (
            <div className="front-empty">
              <span className="eyebrow">PORTAL EN PREPARACIÓN</span>
              <h1 id="front-page-heading">Noticias verificadas, organizadas para Nuevo León.</h1>
              <p>Las publicaciones aparecerán aquí cuando el equipo editorial las publique. No mostramos noticias de ejemplo como si fueran reales.</p>
              <Link className="button button-dark" href="/contacto">CONTACTAR AL EQUIPO <ArrowRight size={17} /></Link>
            </div>
          )}
        </section>

        {sectionItems.map(({ category, items, hasPublished }, index) => (
          <section className="section" key={category.id} aria-labelledby={`section-${category.slug}`}>
            <div className="section-title">
              <h2 id={`section-${category.slug}`}><span>0{index + 2} /</span> {category.name}</h2>
              <Link href={categoryHref(category)}>VER SECCIÓN <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            {items.length ? <Cards items={items} /> : <SectionEmpty category={category} hasPublished={hasPublished} />}
          </section>
        ))}

        {recent.length > 0 && (
          <section className="section">
            <SectionTitle number="07" title="Más recientes" href="/noticias" />
            <Cards items={recent} />
          </section>
        )}

        <section className="manifesto">
          <div><span className="eyebrow">RECUPEREMOS NUEVO LEÓN</span><h2>INFORMACIÓN<br /><em>PARA TODOS.</em></h2></div>
          <div><p>Un espacio editorial para seguir la actualidad local, nacional y los temas que generan conversación.</p><Link className="button" href="/quienes-somos">CONOCE EL PORTAL <ArrowRight size={19} /></Link></div>
        </section>
      </div>
    </>
  );
}
