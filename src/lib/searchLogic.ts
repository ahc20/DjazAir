import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";
import { DjazAirFlight } from "@/types/djazair";

export interface SearchParams {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;  // Pour les vols Aller-Retour (AR)
    adults: number;
    cabin?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    dzdEurRate: number;
}

// Compagnies RÉELLES opérant depuis Alger (vérifié 2024-2025)
const REALISTIC_ALG_CARRIERS = [
    'AH', 'TK', 'EK', 'QR', 'MS', 'SV', 'RJ', 'AF', 'LH', 'BA', 'IB',
    'TU', 'XK', '5O', 'BJ', 'PC', 'TO', 'V7', 'VY', 'X3', 'TB', 'SF', 'XY'
];

// Compagnies qui ACCEPTENT le paiement en DZD depuis l'Algérie
// (vérifié sur les sites officiels - les low-cost européens vendent en EUR)
const DZD_ELIGIBLE_CARRIERS = [
    'AH',  // Air Algérie - vend en DZD
    'EK',  // Emirates - vend en DZD 
    'TK',  // Turkish Airlines - vend en DZD
    'QR',  // Qatar Airways - vend en DZD
    'MS',  // EgyptAir - vend en DZD
    'SV',  // Saudia - vend en DZD
    'RJ',  // Royal Jordanian - vend en DZD
    'TU',  // Tunisair - vend en DZD
    'ET',  // Ethiopian Airlines - vend en DZD
    // Les compagnies européennes (AF, LH, BA, 5O, etc.) vendent en EUR
];

/**
 * Vérifie si une compagnie accepte le paiement en DZD
 */
function isDZDEligibleCarrier(airlineCode: string): boolean {
    // Extraire le code IATA (les 2 premiers caractères)
    const code = airlineCode.substring(0, 2).toUpperCase();
    return DZD_ELIGIBLE_CARRIERS.includes(code);
}

// Helper pour appeler Amadeus avec retry
async function callAmadeusWithRetry(amadeusAPI: AmadeusAPI, searchParams: any, maxRetries: number = 3): Promise<any[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const results = await amadeusAPI.searchFlights(searchParams);
            if (results && results.length > 0) return results;
            return [];
        } catch (error: any) {
            if (error.message.includes('429') && attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            } else if (attempt === maxRetries) {
                console.error("Amadeus Retry Error:", error);
                return [];
            }
        }
    }
    return [];
}

// Helper pour calculer le prix DjazAir
// Applique le taux DZD seulement aux compagnies qui vendent en dinars
function calculateDjazAirPrice(
    priceEUR: number,
    parallelRate: number,
    applyDZDRate: boolean,  // true si acheté en Algérie
    airlineCode?: string     // Code compagnie pour vérifier éligibilité DZD
): { priceEUR: number; priceDZD?: number; isDZDEligible: boolean } {
    // Appliquer DZD seulement si acheté en Algérie ET compagnie éligible
    const isDZDEligible = airlineCode ? isDZDEligibleCarrier(airlineCode) : false;

    if (applyDZDRate && isDZDEligible) {
        const officialRate = 150;
        const priceDZD = Math.round(priceEUR * officialRate);
        const djazAirPriceEUR = priceDZD / parallelRate;
        return { priceEUR: Number(djazAirPriceEUR.toFixed(2)), priceDZD, isDZDEligible: true };
    }
    return { priceEUR: priceEUR, isDZDEligible: false };
}

// Helper pour calculer la durée
function formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.round((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
}

/**
 * Recherche les vols optimisés DjazAir (Multi-leg via Alger)
 * Supporte Aller Simple (AS) et Aller-Retour (AR)
 */
export async function searchDjazAirTrip(params: SearchParams): Promise<DjazAirFlight[]> {
    const amadeusAPI = new AmadeusAPI();
    if (!amadeusAPI.isAvailable()) {
        throw new Error("Amadeus API unavailable");
    }

    const isRoundTrip = !!params.returnDate;
    console.log(`🔍 Recherche ${isRoundTrip ? 'ALLER-RETOUR (AR)' : 'ALLER SIMPLE (AS)'}`);

    // === ALLER ===
    // Segment 1: Origin -> ALG
    const seg1Params = {
        origin: params.origin,
        destination: "ALG",
        departureDate: params.departureDate,
        passengers: params.adults,
        cabinClass: params.cabin || "ECONOMY",
        currency: "EUR"
    };

    // Segment 2: ALG -> Destination
    const seg2Params = {
        origin: "ALG",
        destination: params.destination,
        departureDate: params.departureDate,
        passengers: params.adults,
        cabinClass: params.cabin || "ECONOMY",
        currency: "EUR"
    };

    // Recherche parallèle des segments ALLER
    const searchPromises: Promise<any[]>[] = [
        callAmadeusWithRetry(amadeusAPI, seg1Params),
        callAmadeusWithRetry(amadeusAPI, seg2Params)
    ];

    // === RETOUR (si AR) ===
    if (isRoundTrip && params.returnDate) {
        // Segment 3: Destination -> ALG
        const seg3Params = {
            origin: params.destination,
            destination: "ALG",
            departureDate: params.returnDate,
            passengers: params.adults,
            cabinClass: params.cabin || "ECONOMY",
            currency: "EUR"
        };

        // Segment 4: ALG -> Origin
        const seg4Params = {
            origin: "ALG",
            destination: params.origin,
            departureDate: params.returnDate,
            passengers: params.adults,
            cabinClass: params.cabin || "ECONOMY",
            currency: "EUR"
        };

        searchPromises.push(
            callAmadeusWithRetry(amadeusAPI, seg3Params),
            callAmadeusWithRetry(amadeusAPI, seg4Params)
        );
    }

    const results = await Promise.all(searchPromises);
    const [seg1Results, seg2Results, seg3Results, seg4Results] = results;

    // Vérification segments ALLER
    if (!seg1Results?.length || !seg2Results?.length) {
        console.log("❌ Segments ALLER incomplets");
        return [];
    }

    // Vérification segments RETOUR (si AR)
    if (isRoundTrip && (!seg3Results?.length || !seg4Results?.length)) {
        console.log("❌ Segments RETOUR incomplets");
        return [];
    }

    // Filtrage des segments
    // RÈGLE DJAZAIR: Les segments France ↔ Algérie doivent être DIRECTS
    // Les segments Algérie ↔ Destination finale peuvent avoir des escales

    // S1 (France → ALG): DIRECT uniquement - filtre stops === 0
    const validSeg1 = seg1Results.filter(f =>
        f.destination === "ALG" &&
        (f.stops === 0 || !f.segments || f.segments.length <= 1)
    );

    // S2 (ALG → Destination): escales autorisées
    const validSeg2 = seg2Results.filter(f => f.origin === "ALG");

    // S3 (Destination → ALG): escales autorisées  
    const validSeg3 = isRoundTrip ? seg3Results.filter(f => f.destination === "ALG") : [];

    // S4 (ALG → France): DIRECT uniquement - filtre stops === 0
    const validSeg4 = isRoundTrip ? seg4Results.filter(f =>
        f.origin === "ALG" &&
        (f.stops === 0 || !f.segments || f.segments.length <= 1)
    ) : [];

    console.log(`📊 Segments valides: S1=${validSeg1.length} (directs), S2=${validSeg2.length}, S3=${validSeg3.length}, S4=${validSeg4.length} (directs)`);

    const djazairFlights: DjazAirFlight[] = [];
    const maxCombinations = 20; // Augmenté pour trouver plus d'options
    let found = 0;

    // Helper de tri: Privilégier les vols directs, puis DZD éligibles, puis moins chers
    const smartSort = (segments: any[]) => {
        return segments.sort((a, b) => {
            // 1. Privilégier les vols directs (moins d'escales)
            if ((a.stops || 0) !== (b.stops || 0)) return (a.stops || 0) - (b.stops || 0);

            // 2. Privilégier les compagnies éligibles DZD
            const aDZD = isDZDEligibleCarrier(a.airlineCode || "");
            const bDZD = isDZDEligibleCarrier(b.airlineCode || "");
            if (aDZD && !bDZD) return -1;
            if (!aDZD && bDZD) return 1;

            // 3. Sinon trier par prix
            return a.price.amount - b.price.amount;
        });
    };

    // Appliquer le tri intelligent aux segments "flexibles" (S2 et S3)
    smartSort(validSeg2);
    if (isRoundTrip) smartSort(validSeg3);

    // Combinaison des segments ALLER
    for (const s1 of validSeg1) {
        if (found >= maxCombinations) break;

        for (const s2 of validSeg2) {
            if (found >= maxCombinations) break;

            // Vérif connexion ALLER (2h-24h d'escale)
            const layover1Ms = new Date(s2.departureTime).getTime() - new Date(s1.arrivalTime).getTime();
            const layover1Hours = layover1Ms / (1000 * 60 * 60);
            if (layover1Hours < 2 || layover1Hours > 24) continue;

            // Prix ALLER
            // s1: depuis origine (non-ALG), toujours EUR
            const price1 = calculateDjazAirPrice(s1.price.amount, params.dzdEurRate, false, s1.airlineCode);
            // s2: depuis ALG, DZD seulement si compagnie éligible
            const price2 = calculateDjazAirPrice(s2.price.amount, params.dzdEurRate, true, s2.airlineCode);

            let totalPriceEUR = price1.priceEUR + price2.priceEUR;
            let totalPriceDZD = (price1.priceDZD || Math.round(price1.priceEUR * params.dzdEurRate)) + (price2.priceDZD || 0);
            let segments: any[] = [
                {
                    origin: s1.origin, destination: s1.destination,
                    airline: s1.airline, flightNumber: s1.flightNumber,
                    departureTime: s1.departureTime, arrivalTime: s1.arrivalTime,
                    duration: s1.duration, priceEUR: price1.priceEUR, currency: "EUR", leg: "ALLER",
                    stops: s1.stops || 0,
                    subSegments: s1.segments || []
                },
                {
                    origin: s2.origin, destination: s2.destination,
                    airline: s2.airline, flightNumber: s2.flightNumber,
                    departureTime: s2.departureTime, arrivalTime: s2.arrivalTime,
                    duration: s2.duration, priceEUR: price2.priceEUR,
                    priceDZD: price2.priceDZD,
                    currency: price2.isDZDEligible ? "DZD" : "EUR",  // Dynamique selon compagnie
                    leg: "ALLER",
                    stops: s2.stops || 0,
                    subSegments: s2.segments || []
                }
            ];

            let returnDate: string | undefined = undefined;

            // Si AR, chercher les segments RETOUR compatibles
            if (isRoundTrip) {
                const validReturnCombos: { s3: any; s4: any; layover: number }[] = [];

                for (const s3 of validSeg3) {
                    for (const s4 of validSeg4) {
                        const layover2Ms = new Date(s4.departureTime).getTime() - new Date(s3.arrivalTime).getTime();
                        const layover2Hours = layover2Ms / (1000 * 60 * 60);
                        if (layover2Hours >= 2 && layover2Hours <= 24) {
                            validReturnCombos.push({ s3, s4, layover: layover2Hours });
                        }
                    }
                }

                if (validReturnCombos.length === 0) continue; // Pas de retour valide

                // Prendre le meilleur retour (Direct > DZD > Prix)
                const bestReturn = validReturnCombos.sort((a, b) => {
                    // 1. Privilégier les vols directs sur S3 (Destination -> ALG)
                    const stopsA = a.s3.stops || 0;
                    const stopsB = b.s3.stops || 0;
                    if (stopsA !== stopsB) return stopsA - stopsB;

                    // 2. Privilégier les compagnies éligibles DZD sur S3 (ex: Air Algérie)
                    const aDZD = isDZDEligibleCarrier(a.s3.airlineCode || "");
                    const bDZD = isDZDEligibleCarrier(b.s3.airlineCode || "");
                    if (aDZD && !bDZD) return -1;
                    if (!aDZD && bDZD) return 1;

                    // 3. Sinon trier par prix total du retour
                    const priceA = a.s3.price.amount + a.s4.price.amount;
                    const priceB = b.s3.price.amount + b.s4.price.amount;
                    return priceA - priceB;
                })[0];
                // Prix RETOUR - DZD seulement pour compagnies éligibles
                const price3 = calculateDjazAirPrice(bestReturn.s3.price.amount, params.dzdEurRate, true, bestReturn.s3.airlineCode);
                const price4 = calculateDjazAirPrice(bestReturn.s4.price.amount, params.dzdEurRate, true, bestReturn.s4.airlineCode);

                totalPriceEUR += price3.priceEUR + price4.priceEUR;
                totalPriceDZD += (price3.priceDZD || 0) + (price4.priceDZD || 0);

                segments.push(
                    {
                        origin: bestReturn.s3.origin, destination: bestReturn.s3.destination,
                        airline: bestReturn.s3.airline, flightNumber: bestReturn.s3.flightNumber,
                        departureTime: bestReturn.s3.departureTime, arrivalTime: bestReturn.s3.arrivalTime,
                        duration: bestReturn.s3.duration, priceEUR: price3.priceEUR,
                        priceDZD: price3.priceDZD,
                        currency: price3.isDZDEligible ? "DZD" : "EUR",
                        leg: "RETOUR",
                        stops: bestReturn.s3.stops || 0,
                        subSegments: bestReturn.s3.segments || []
                    },
                    {
                        origin: bestReturn.s4.origin, destination: bestReturn.s4.destination,
                        airline: bestReturn.s4.airline, flightNumber: bestReturn.s4.flightNumber,
                        departureTime: bestReturn.s4.departureTime, arrivalTime: bestReturn.s4.arrivalTime,
                        duration: bestReturn.s4.duration, priceEUR: price4.priceEUR,
                        priceDZD: price4.priceDZD,
                        currency: price4.isDZDEligible ? "DZD" : "EUR",
                        leg: "RETOUR",
                        stops: bestReturn.s4.stops || 0,
                        subSegments: bestReturn.s4.segments || []  // Détails des escales (ex: ALG→IST→CDG)
                    }
                );

                returnDate = bestReturn.s3.departureTime;
            }

            // Calcul durée totale (ALLER seulement pour l'affichage principal)
            const outboundDuration = new Date(s2.arrivalTime).getTime() - new Date(s1.departureTime).getTime();

            // Calcul économies vs prix normal
            const normalPrice = segments.reduce((sum, seg) => {
                const origPrice = seg.currency === "DZD" && seg.priceDZD
                    ? seg.priceDZD / 150  // Retour au prix EUR original
                    : seg.priceEUR;
                return sum + origPrice;
            }, 0);
            const savings = normalPrice - totalPriceEUR;

            djazairFlights.push({
                id: `dz-${isRoundTrip ? 'AR' : 'AS'}-${s1.flightNumber}-${s2.flightNumber}`,
                origin: params.origin,
                destination: params.destination,
                departureDate: s1.departureTime,
                returnDate: returnDate,
                totalDuration: formatDuration(outboundDuration),
                totalPriceEUR: Number(totalPriceEUR.toFixed(2)),
                totalPriceDZD: totalPriceDZD,
                segments: segments,
                layover: {
                    airport: "ALG",
                    duration: formatDuration(layover1Ms),
                    location: "Alger, Algérie"
                },
                savings: {
                    amount: Number(savings.toFixed(2)),
                    percentage: Math.round((savings / normalPrice) * 100),
                    comparedTo: Number(normalPrice.toFixed(2))
                }
            });

            found++;
        }
    }

    console.log(`✅ ${djazairFlights.length} vols DjazAir ${isRoundTrip ? 'AR' : 'AS'} trouvés`);
    return djazairFlights.sort((a, b) => a.totalPriceEUR - b.totalPriceEUR);
}

/**
 * Recherche les vols classiques (Direct ou escale standard) pour comparaison
 */
export async function searchClassicTrip(params: SearchParams): Promise<any[]> {
    const amadeusAPI = new AmadeusAPI();
    if (!amadeusAPI.isAvailable()) return [];

    const searchParams = {
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        passengers: params.adults,
        cabinClass: params.cabin || "ECONOMY",
        currency: "EUR"
    };

    const results = await callAmadeusWithRetry(amadeusAPI, searchParams);

    // DÉDUPLICATION: Filtrer les doublons exacts (mêmes segments, mêmes horaires, même prix)
    const uniqueResults = results.reduce((acc: any[], current) => {
        // Créer une clé unique basée sur les numéros de vol et le prix
        const segmentsKey = current.segments?.map((seg: any) =>
            seg.subSegments?.map((s: any) => `${s.airline}${s.flightNumber}-${s.departureTime}`).join('|')
        ).join('||');

        const key = `${segmentsKey}-${current.price.amount}`;

        if (!acc.find(item => {
            const itemKey = item.segments?.map((seg: any) =>
                seg.subSegments?.map((s: any) => `${s.airline}${s.flightNumber}-${s.departureTime}`).join('|')
            ).join('||') + `-${item.price.amount}`;
            return itemKey === key;
        })) {
            acc.push(current);
        }
        return acc;
    }, []);

    return uniqueResults.sort((a, b) => a.price.amount - b.price.amount);
}

/**
 * Helper pour ajouter des jours à une date
 */
function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Recherche avec FALLBACK sur dates proches
 * Si aucun vol DjazAir trouvé, essaie les dates voisines (-3 à +5 jours)
 * Retourne les résultats avec la date effectivement utilisée
 */
export async function searchDjazAirTripWithFallback(params: SearchParams): Promise<{
    flights: DjazAirFlight[];
    actualDepartureDate: string;
    actualReturnDate?: string;
    isAlternativeDate: boolean;
    message?: string;
}> {
    // D'abord essayer la date demandée
    console.log(`🔍 Recherche pour date originale: ${params.departureDate}`);
    const originalResults = await searchDjazAirTrip(params);

    if (originalResults.length > 0) {
        return {
            flights: originalResults,
            actualDepartureDate: params.departureDate,
            actualReturnDate: params.returnDate,
            isAlternativeDate: false
        };
    }

    // Pas de résultats - essayer les dates proches
    console.log("⚠️ Aucun vol trouvé, recherche sur dates alternatives...");

    // Ordre de recherche: +1, +2, +3, +4, +5, -1, -2, -3 (priorité aux dates futures)
    const offsets = [1, 2, 3, 4, 5, -1, -2, -3];

    for (const offset of offsets) {
        const altDepartureDate = addDays(params.departureDate, offset);
        let altReturnDate: string | undefined = undefined;

        // Si AR, décaler aussi la date de retour du même offset
        if (params.returnDate) {
            altReturnDate = addDays(params.returnDate, offset);
        }

        console.log(`📅 Tentative pour ${altDepartureDate}${altReturnDate ? ` - ${altReturnDate}` : ''}...`);

        const altResults = await searchDjazAirTrip({
            ...params,
            departureDate: altDepartureDate,
            returnDate: altReturnDate
        });

        if (altResults.length > 0) {
            const direction = offset > 0 ? '+' : '';
            console.log(`✅ Vols trouvés pour ${altDepartureDate} (${direction}${offset} jours)`);

            return {
                flights: altResults,
                actualDepartureDate: altDepartureDate,
                actualReturnDate: altReturnDate,
                isAlternativeDate: true,
                message: `Date alternative: ${new Date(altDepartureDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} (${direction}${offset} jour${Math.abs(offset) > 1 ? 's' : ''})`
            };
        }
    }

    // Vraiment aucun vol trouvé sur aucune date proche
    console.log("❌ Aucun vol DjazAir disponible sur aucune date proche");
    return {
        flights: [],
        actualDepartureDate: params.departureDate,
        actualReturnDate: params.returnDate,
        isAlternativeDate: false,
        message: "Aucun vol via Alger disponible pour cette période"
    };
}
