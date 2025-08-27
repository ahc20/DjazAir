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
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content={APP_NAME} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Avertissement légal dans les métadonnées */}
        <meta name="legal-notice" content="Cette application ne vend pas de billets en dinars algériens et ne réalise aucune opération de change. Les calculs 'via Alger' sont des SIMULATIONS basées sur des hypothèses administrateur ou des saisies utilisateur." />
        <meta name="compliance" content="Application 100% légale respectant la réglementation française et européenne" />
      </head>
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
                  console.log(`${APP_NAME} - Application de simulation d'arbitrage aérien`);
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
