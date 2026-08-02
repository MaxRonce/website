import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import './globals.css';
import { SmoothScroll } from '@/components/SmoothScroll';
import { getContent } from '@/lib/getContent';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { identity } = await getContent();
  return {
    metadataBase: new URL(identity.siteUrl),
    title: `${identity.name} — Astrophysics & Data Science`,
    description: identity.intro,
    openGraph: {
      title: `${identity.name} — Astrophysics & Data Science`,
      description: identity.intro,
      url: identity.siteUrl,
      siteName: identity.name,
      type: 'website',
      images: [{ url: '/og.svg', width: 1200, height: 630, alt: identity.headline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${identity.name} — Astrophysics & Data Science`,
      description: identity.intro,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#030711',
  colorScheme: 'dark',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { identity, externalLinks } = await getContent();
  const sameAs = Array.from(
    new Set([
      identity.github,
      ...externalLinks
        .filter((link) => link.id === 'github' || link.id === 'linkedin')
        .map((link) => link.href),
    ]),
  );
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: identity.fullName,
    jobTitle: identity.role,
    image: new URL(identity.photo, identity.siteUrl).toString(),
    email: identity.email,
    url: identity.siteUrl,
    sameAs,
  };

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <SmoothScroll />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
