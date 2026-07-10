import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'E & E | Emircan & Efsun',
  description: 'Sadece ikinize özel alan',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'E & E | Emircan & Efsun',
    description: 'Sadece ikinize özel alan',
    images: ['/og-image.png'],
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7d2438" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
