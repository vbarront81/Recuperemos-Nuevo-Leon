import 'server-only';
import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags.filter((tag) => tag !== 'img' && tag !== 'iframe'),
  'h1', 'h2', 'h3', 'blockquote',
];

/** Sanitiza antes de guardar y también al renderizar, por defensa en profundidad. */
export function sanitizeArticleHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: { a: ['href', 'name', 'target', 'rel'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer' }, true),
    },
  });
}
