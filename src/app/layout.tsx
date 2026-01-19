import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} - Vos vols moins cher en passant par l'Algérie`,
  description:
    "Économisez jusqu'à 60% sur vos vols internationaux en passant par Alger. Comparez les prix et trouvez les meilleures opportunités.",
  keywords:
    "vols pas cher, vols via Alger, économies voyages, comparaison prix, Algérie hub aérien",
  authors: [{ name: `${APP_NAME} Team` }],
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: `${APP_NAME} - Vos vols moins cher en passant par l'Algérie`,
    description:
      "Économisez jusqu'à 60% sur vos vols internationaux en passant par Alger.",
    type: "website",
    locale: "fr_FR",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Vos vols moins cher en passant par l'Algérie`,
    description:
      "Économisez jusqu'à 60% sur vos vols internationaux en passant par Alger.",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#047857",
  manifest: "/manifest.json",
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
        {process.env.NODE_ENV === "production" && (
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
