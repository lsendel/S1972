import { Helmet } from 'react-helmet-async'

interface MetaTagsProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  keywords?: string[]
  noindex?: boolean
}

export function MetaTags({
  title,
  description,
  image = '/og-default.jpg',
  url,
  type = 'website',
  keywords = [],
  noindex = false
}: MetaTagsProps) {
  const fullTitle = `${title} | SaaS Platform`
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="SaaS Platform" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional SEO */}
      <meta name="author" content="SaaS Platform" />
      <meta name="language" content="English" />
    </Helmet>
  )
}
