import { Helmet } from 'react-helmet-async';

/**
 * PageMeta Component
 *
 * Reusable component for managing page SEO metadata including:
 * - Page title
 * - Meta description
 * - Open Graph tags
 * - Twitter Card tags
 * - Canonical URLs
 * - Keywords
 *
 * @example
 * ```tsx
 * <PageMeta
 *   title="Dashboard"
 *   description="View and manage reconciliation projects"
 *   keywords="reconciliation, dashboard"
 *   canonical="https://app.example.com/"
 * />
 * ```
 */

interface PageMetaProps {
  /** Page title (will be appended with site name) */
  title: string;
  /** Meta description (150-160 characters recommended) */
  description: string;
  /** Optional keywords for SEO */
  keywords?: string;
  /** Optional Open Graph image URL */
  ogImage?: string;
  /** Optional canonical URL */
  canonical?: string;
  /** Optional Open Graph type */
  ogType?: 'website' | 'article' | 'profile';
  /** Optional author */
  author?: string;
  /** Optional robots directive */
  robots?: string;
}

export const PageMeta: React.FC<PageMetaProps> = ({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  ogType = 'website',
  author,
  robots = 'index, follow',
}) => {
  const siteName = 'Reconciliation Platform';
  const fullTitle = title.includes(siteName) ? title : `${title} - ${siteName}`;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullCanonical = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  const defaultOgImage = ogImage || `${siteUrl}/og-image.png`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robots} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={defaultOgImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultOgImage} />

      {/* Canonical URL */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
    </Helmet>
  );
};
