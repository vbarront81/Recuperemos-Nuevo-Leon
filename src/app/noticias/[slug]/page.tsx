import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cards } from '@/components/content';
import { formatNewsDate } from '@/lib/date-format';
import { publishedOne, relatedArticles } from '@/lib/data';
import { sanitizeArticleHtml } from '@/lib/sanitize-article';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await publishedOne((await params).slug);
  if (!article) return { title: 'Noticia no encontrada', robots: { index: false, follow: false } };

  return {
    title: article.title,
    description: article.subtitle || `Lee la noticia ${article.title} en Recuperemos Nuevo León.`,
    alternates: { canonical: `/noticias/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.subtitle,
      url: `/noticias/${article.slug}`,
      publishedTime: article.published_at || undefined,
      images: article.cover_url ? [{ url: article.cover_url, alt: article.title }] : [],
    },
    twitter: {
      card: article.cover_url ? 'summary_large_image' : 'summary',
      title: article.title,
      description: article.subtitle,
      images: article.cover_url ? [article.cover_url] : [],
    },
  };
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await publishedOne(slug);
  if (!article) notFound();

  const [related] = await Promise.all([relatedArticles(article.category_id, article.slug)]);
  const safeHtml = sanitizeArticleHtml(article.body);
  const categoryHref = `/noticias?categoria=${encodeURIComponent(article.categories?.slug || '')}`;

  return (
    <div className="container page-content">
      <article className="detail-layout">
        <Link className="back-link" href="/noticias">← VOLVER A NOTICIAS</Link>
        <nav className="eyebrow article-breadcrumb" aria-label="Ruta de navegación">
          <Link href="/">INICIO</Link><span aria-hidden="true">/</span>
          <Link href={categoryHref}>{article.categories?.name || 'NOTICIAS'}</Link>
        </nav>
        <h1>{article.title}</h1>
        {article.subtitle && <p className="detail-lead">{article.subtitle}</p>}
        <p className="small-note">
          <time dateTime={article.published_at || undefined}>PUBLICADO EL {formatNewsDate(article.published_at, 'long')}</time>
        </p>
        {article.cover_url ? (
          <div className="detail-img">
            <Image src={article.cover_url} fill priority sizes="(max-width: 930px) 100vw, 930px" alt={article.title} />
          </div>
        ) : (
          <div className="detail-img detail-img-placeholder" role="img" aria-label="Esta noticia no tiene imagen de portada">
            <span>RECUPEREMOS NUEVO LEÓN</span>
          </div>
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        <div className="detail-divider" />
        <div className="detail-links">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/noticias/${article.slug}`)}`} target="_blank" rel="noopener noreferrer">COMPARTIR EN WHATSAPP ↗</a>
          <Link href={categoryHref}>MÁS DE {article.categories?.name?.toUpperCase() || 'NOTICIAS'} ↗</Link>
        </div>
      </article>
      {related.length > 0 && (
        <section className="section related-news" aria-labelledby="related-news-title">
          <div className="section-title">
            <h2 id="related-news-title"><span>RELACIONADAS /</span> {article.categories?.name || 'Noticias'}</h2>
            <Link href={categoryHref}>VER SECCIÓN ↗</Link>
          </div>
          <Cards items={related} />
        </section>
      )}
    </div>
  );
}
