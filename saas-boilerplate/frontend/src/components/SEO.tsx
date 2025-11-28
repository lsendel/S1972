import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    name?: string;
    type?: string;
    image?: string;
    url?: string;
}

export default function SEO({
    title,
    description,
    name = 'SaaS Boilerplate',
    type = 'website',
    image,
    url,
}: SEOProps) {
    return (
        <Helmet>
            {/* Standard metadata tags */}
            {title ? <title>{title} | {name}</title> : <title>{name}</title>}
            {description && <meta name="description" content={description} />}

            {/* Facebook tags */}
            <meta property="og:type" content={type} />
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            {image && <meta property="og:image" content={image} />}
            {url && <meta property="og:url" content={url} />}

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            {title && <meta name="twitter:title" content={title} />}
            {description && <meta name="twitter:description" content={description} />}
            {image && <meta name="twitter:image" content={image} />}
        </Helmet>
    );
}
