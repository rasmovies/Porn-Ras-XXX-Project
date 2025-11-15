import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  author?: string;
  structuredData?: object;
  noindex?: boolean;
  nofollow?: boolean;
  googleSiteVerification?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'PORNRAS - Adult Content Platform',
  description = 'PORNRAS - Your ultimate destination for premium adult content. Watch videos, browse models, channels, and categories.',
  image = '/PORNRAS.png',
  url = 'https://pornras.com',
  type = 'website',
  keywords = 'adult content, videos, models, channels, categories',
  author = 'PORNRAS',
  structuredData,
  noindex = false,
  nofollow = false,
  googleSiteVerification,
}) => {
  const fullTitle = title.includes('PORNRAS') ? title : `${title} | PORNRAS`;
  const fullUrl = url.startsWith('http') ? url : `https://pornras.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://pornras.com${image}`;

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Google Search Console Verification */}
      {googleSiteVerification && (
        <meta name="google-site-verification" content={googleSiteVerification} />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="PORNRAS" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
