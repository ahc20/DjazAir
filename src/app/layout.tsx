import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { APP_NAME } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${APP_NAME} - Simulateur d'Arbitrage Aérien`,
  description: 'Comparez les prix des vols directs avec des simulations "via Alger" pour identifier les meilleures opportunités d\'économies. Application 100% légale et informative.',
  keywords: 'arbitrage aérien, vols via Alger, comparaison prix, économies voyages, simulation vols',
  authors: [{ name: `${APP_NAME} Team` }],
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: 'index, follow',
  openGraph: {
    title: `${APP_NAME} - Simulateur d'Arbitrage Aérien`,
    description: 'Comparez les prix des vols directs avec des simulations "via Alger" pour identifier les meilleures opportunités d\'économies.',
    type: 'website',
    locale: 'fr_FR',
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Simulateur d'Arbitrage Aérien`,
    description: 'Comparez les prix des vols directs avec des simulations "via Alger" pour identifier les meilleures opportunités d\'économies.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div id="root" className="h-full">
          {children}
        </div>
        
        {/* Scripts d'analytics et de monitoring (optionnels) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics ou autres outils de monitoring */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Code de monitoring à ajouter ici
                  console.log('${APP_NAME} - Application de simulation d\'arbitrage aérien');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
