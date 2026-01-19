import puppeteer, { Browser, Page } from 'puppeteer';

export interface GoogleFlightsDZDResult {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    priceDZD: number;
    priceEUR: number;  // Converti au taux parallèle
    airline: string;
    flightNumbers: string[];
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    source: 'google_flights_scraped' | 'fallback';
}

/**
 * Scraper pour obtenir les prix en DZD depuis Google Flights
 * Google Flights affiche les prix en devise locale (DZD pour l'Algérie)
 * ce qui permet d'obtenir les vrais prix Air Algérie
 */
export class GoogleFlightsDZDScraper {
    private parallelRate = 280;  // Taux parallèle: 1€ = 280 DZD
    private browser: Browser | null = null;
    private cache: Map<string, { data: GoogleFlightsDZDResult[], timestamp: number }> = new Map();
    private cacheTimeoutMs = 60 * 60 * 1000; // 1 heure

    // Prix basés sur les observations réelles (mise à jour avec les vrais prix)
    private realPricesDZD: Record<string, number> = {
        // Prix observés sur Google Flights / Air Algérie (aller simple)
        'ALG-DXB': 72122,   // Observé sur Google Flights
        'DXB-ALG': 72122,
        'ALG-CDG': 42000,
        'CDG-ALG': 42000,
        'ALG-ORY': 42000,
        'ORY-ALG': 42000,
        'ALG-LYS': 45000,
        'ALG-MRS': 38000,
        'ALG-IST': 55000,
        'ALG-CAI': 48000,
        'ALG-JED': 65000,
        'ALG-TUN': 22000,
        'ALG-CAS': 28000,
        'ALG-PEK': 95000,
    };

    /**
     * Initialise Puppeteer
     */
    async initialize(): Promise<void> {
        if (!this.browser) {
            console.log('🚀 Initialisation de Puppeteer pour Google Flights...');
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--lang=fr-DZ',  // Forcer la langue française/Algérie pour les prix en DZD
                ],
            });
            console.log('✅ Puppeteer initialisé pour Google Flights');
        }
    }

    /**
     * Ferme le navigateur
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Génère la clé de cache
     */
    private getCacheKey(origin: string, destination: string, date: string): string {
        return `${origin}-${destination}-${date}`;
    }

    /**
     * Recherche le prix DZD sur Google Flights
     */
    async searchDZDPrice(
        origin: string,
        destination: string,
        departureDate: string,
        returnDate?: string
    ): Promise<GoogleFlightsDZDResult | null> {
        const cacheKey = this.getCacheKey(origin, destination, departureDate);

        // Vérifier le cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeoutMs) {
            console.log(`📦 Prix trouvé en cache: ${cacheKey}`);
            return cached.data[0] || null;
        }

        try {
            await this.initialize();
            const page = await this.browser!.newPage();

            // Configuration pour simuler un utilisateur algérien (prix en DZD)
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'fr-DZ,fr;q=0.9,ar-DZ;q=0.8',
            });
            await page.setViewport({ width: 1920, height: 1080 });

            // Construire l'URL Google Flights avec devise DZD
            const tripType = returnDate ? 'round-trip' : 'one-way';
            const url = this.buildGoogleFlightsUrl(origin, destination, departureDate, returnDate);

            console.log(`🔍 Scraping Google Flights: ${url}`);

            try {
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });

                // Attendre un peu pour que les prix se chargent
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Extraire les prix
                const result = await this.extractPricesFromPage(page, origin, destination, departureDate);

                await page.close();

                if (result) {
                    // Mettre en cache
                    this.cache.set(cacheKey, { data: [result], timestamp: Date.now() });
                    console.log(`✅ Prix trouvé: ${result.priceDZD} DZD = ${result.priceEUR}€`);
                    return result;
                }
            } catch (error) {
                console.error('❌ Erreur scraping Google Flights:', error);
                await page.close();
            }

            // Fallback vers prix estimés
            return this.getFallbackPrice(origin, destination, departureDate);

        } catch (error) {
            console.error('❌ Erreur Puppeteer:', error);
            return this.getFallbackPrice(origin, destination, departureDate);
        }
    }

    /**
     * Construit l'URL Google Flights
     */
    private buildGoogleFlightsUrl(
        origin: string,
        destination: string,
        departureDate: string,
        returnDate?: string
    ): string {
        // Format date: YYYY-MM-DD
        const baseUrl = 'https://www.google.com/travel/flights';
        const params = new URLSearchParams({
            hl: 'fr',
            gl: 'dz',  // Pays: Algérie (pour avoir les prix en DZD)
            curr: 'DZD',  // Devise: Dinar Algérien
        });

        // Google Flights utilise un format spécifique pour les recherches
        // On va construire une URL de recherche simple
        const searchQuery = returnDate
            ? `vols ${origin} ${destination} ${departureDate} ${returnDate}`
            : `vol ${origin} ${destination} ${departureDate} aller simple`;

        params.set('q', searchQuery);

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Extrait les prix de la page Google Flights
     */
    private async extractPricesFromPage(
        page: Page,
        origin: string,
        destination: string,
        departureDate: string
    ): Promise<GoogleFlightsDZDResult | null> {
        try {
            // Attendre les résultats
            await page.waitForSelector('[class*="price"], [class*="YMlIz"]', { timeout: 10000 }).catch(() => { });

            // Extraire les données de la page
            const flightData = await page.evaluate(() => {
                const results: { priceDZD: number; priceEUR: number; airline: string; duration: string }[] = [];

                // Chercher les éléments de prix
                // Google Flights utilise différentes classes, on cherche des patterns courants
                const priceElements = document.querySelectorAll(
                    '[class*="YMlIz"], [class*="price"], [aria-label*="DZD"], [data-gs*="price"]'
                );

                priceElements.forEach((el) => {
                    const text = el.textContent || '';
                    // Chercher un pattern de prix en DZD (ex: "72 122 DZD" ou "72122 DZD")
                    const dzdMatch = text.match(/(\d[\d\s]*)\s*DZD/i);
                    if (dzdMatch) {
                        const priceDZD = parseInt(dzdMatch[1].replace(/\s/g, ''));
                        if (priceDZD > 10000 && priceDZD < 500000) {
                            results.push({
                                priceDZD,
                                priceEUR: 0,  // Sera calculé après
                                airline: 'Air Algérie',
                                duration: '',
                            });
                        }
                    }
                });

                // Si on n'a pas trouvé de prix DZD, chercher dans le texte de la page
                if (results.length === 0) {
                    const bodyText = document.body.innerText;
                    const dzdMatches = bodyText.match(/(\d[\d\s]{1,6})\s*DZD/gi);
                    if (dzdMatches) {
                        dzdMatches.forEach((match) => {
                            const numMatch = match.match(/(\d[\d\s]*)/);
                            if (numMatch) {
                                const priceDZD = parseInt(numMatch[1].replace(/\s/g, ''));
                                if (priceDZD > 10000 && priceDZD < 500000) {
                                    results.push({
                                        priceDZD,
                                        priceEUR: 0,
                                        airline: 'Air Algérie',
                                        duration: '',
                                    });
                                }
                            }
                        });
                    }
                }

                return results;
            });

            if (flightData.length > 0) {
                // Prendre le prix le plus bas
                const cheapest = flightData.reduce((min, curr) =>
                    curr.priceDZD < min.priceDZD ? curr : min
                );

                return {
                    origin,
                    destination,
                    departureDate,
                    priceDZD: cheapest.priceDZD,
                    priceEUR: Math.round((cheapest.priceDZD / this.parallelRate) * 100) / 100,
                    airline: 'Air Algérie',
                    flightNumbers: [],
                    departureTime: '',
                    arrivalTime: '',
                    duration: cheapest.duration,
                    stops: 0,
                    source: 'google_flights_scraped',
                };
            }

            return null;
        } catch (error) {
            console.error('❌ Erreur extraction prix:', error);
            return null;
        }
    }

    /**
     * Prix de fallback basés sur les observations réelles
     */
    getFallbackPrice(
        origin: string,
        destination: string,
        departureDate: string
    ): GoogleFlightsDZDResult {
        const route = `${origin}-${destination}`;
        const reverseRoute = `${destination}-${origin}`;

        // Chercher le prix dans notre base de données
        let priceDZD = this.realPricesDZD[route] || this.realPricesDZD[reverseRoute];

        if (!priceDZD) {
            // Estimer le prix selon la route
            if (origin === 'ALG' || destination === 'ALG') {
                // Vol direct depuis/vers Alger
                priceDZD = 45000;  // Prix moyen
            } else {
                // Vol avec correspondance via Alger
                const segment1 = this.realPricesDZD[`${origin}-ALG`] || 42000;
                const segment2 = this.realPricesDZD[`ALG-${destination}`] || 45000;
                priceDZD = segment1 + segment2;
            }
        }

        console.log(`📊 Prix fallback utilisé: ${route} = ${priceDZD} DZD`);

        return {
            origin,
            destination,
            departureDate,
            priceDZD,
            priceEUR: Math.round((priceDZD / this.parallelRate) * 100) / 100,
            airline: 'Air Algérie',
            flightNumbers: [],
            departureTime: '',
            arrivalTime: '',
            duration: '',
            stops: origin === 'ALG' || destination === 'ALG' ? 0 : 1,
            source: 'fallback',
        };
    }

    /**
     * Met à jour les prix réels observés
     */
    updateRealPrice(route: string, priceDZD: number): void {
        this.realPricesDZD[route] = priceDZD;
        console.log(`💾 Prix mis à jour: ${route} = ${priceDZD} DZD`);
    }

    /**
     * Obtient le taux parallèle
     */
    getParallelRate(): number {
        return this.parallelRate;
    }

    /**
     * Met à jour le taux parallèle
     */
    setParallelRate(rate: number): void {
        this.parallelRate = rate;
    }
}

// Instance singleton
export const googleFlightsScraper = new GoogleFlightsDZDScraper();
