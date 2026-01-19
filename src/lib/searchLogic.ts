import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";
import { getDuffelAPI } from "@/server/flightAPI/duffelAPI";
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

// Compagnies qui AFFICHENT des prix en DZD depuis leur site Algérie
// Ces compagnies offrent des prix DZD avantageux quand convertis au taux parallèle
const DZD_ELIGIBLE_CARRIERS = [
    'AH',  // Air Algérie - vend en DZD
    'AF',  // Air France - vend en DZD depuis airfrance.dz (le HACK principal!)
    'EK',  // Emirates - vend en DZD 
    'TK',  // Turkish Airlines - vend en DZD
    'QR',  // Qatar Airways - vend en DZD
    'MS',  // EgyptAir - vend en DZD
    'SV',  // Saudia - vend en DZD
    'RJ',  // Royal Jordanian - vend en DZD
    'TU',  // Tunisair - vend en DZD
    'ET',  // Ethiopian Airlines - vend en DZD
    'LH',  // Lufthansa - vend en DZD sur site Algérie
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
        // Taux de change utilisé par les compagnies pour convertir EUR -> DZD
        // Basé sur l'observation : 82€ = 13,958 DZD => Taux ~170.2
        // C'est souvent le taux IATA ou un taux commercial légèrement supérieur à l'officiel (150)
        const airlineCommercialRate = 170;

        // 1. Estimer le prix en DZD tel qu'affiché sur le site Algérie
        const priceDZD = Math.round(priceEUR * airlineCommercialRate);

        // 2. Convertir ce prix DZD en EUR au taux parallèle (le vrai coût pour l'utilisateur)
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
                    subSegments: s1.segments || [],
                    baggage: s1.baggage
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
                    subSegments: s2.segments || [],
                    baggage: s2.baggage
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
                        subSegments: bestReturn.s3.segments || [],
                        baggage: bestReturn.s3.baggage
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
                        subSegments: bestReturn.s4.segments || [], // Détails des escales (ex: ALG→IST→CDG)
                        baggage: bestReturn.s4.baggage
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

    let results = await callAmadeusWithRetry(amadeusAPI, searchParams);

    // FALLBACK: Si Amadeus ne retourne rien, essayer Duffel
    if (results.length === 0) {
        console.log("⚠️ Amadeus vide, tentative Duffel...");
        const duffelAPI = getDuffelAPI();
        if (duffelAPI.isAvailable()) {
            results = await duffelAPI.searchFlights({
                origin: params.origin,
                destination: params.destination,
                departureDate: params.departureDate,
                returnDate: params.returnDate,
                passengers: params.adults,
                cabinClass: params.cabin,
                currency: "EUR"
            });
            console.log(`🔄 Duffel: ${results.length} résultats`);
        }
    }

    // DÉDUPLICATION: Filtrer les doublons exacts (mêmes segments, mêmes horaires, même prix)
    const uniqueResults = results.reduce((acc: any[], current) => {
        // Créer une clé unique basée sur les numéros de vol et le prix
        const segmentsKey = current.segments?.map((seg: any) =>
            seg.subSegments?.map((s: any) => `${s.airline}${s.flightNumber}-${s.departureTime}`).join('|')
        ).join('||');

        const key = `${segmentsKey}-${current.price?.amount || current.price}`;

        if (!acc.find(item => {
            const itemKey = item.segments?.map((seg: any) =>
                seg.subSegments?.map((s: any) => `${s.airline}${s.flightNumber}-${s.departureTime}`).join('|')
            ).join('||') + `-${item.price?.amount || item.price}`;
            return itemKey === key;
        })) {
            acc.push(current);
        }
        return acc;
    }, []);

    return uniqueResults.sort((a, b) => (a.price?.amount || a.price) - (b.price?.amount || b.price));
}

/**
 * Génère une option Classique synthétique (Air Algérie) pour le Fallback
 * Imite la structure AmadeusFlightResult pour l'affichage
 */
function generateSyntheticClassicOption(params: SearchParams): any {
    // Dates simulées réalistes
    const departureDate = new Date(params.departureDate);
    const leg1Dep = new Date(departureDate);
    leg1Dep.setHours(12, 50, 0, 0); // 12h50 Paris (horaire classique AH)

    // Arrivée ALG (+2h15)
    const leg1Arr = new Date(leg1Dep.getTime() + 2.25 * 3600 * 1000);

    // Escale à Alger (3h30 - réaliste pour le sud)
    const leg2Dep = new Date(leg1Arr.getTime() + 3.5 * 3600 * 1000);

    // Arrivée Destination (ex: Djanet ~2h15 de vol)
    // Distance approx ou fixe pour le sud
    const leg2DurationAuth = 2.25 * 3600 * 1000;
    const leg2Arr = new Date(leg2Dep.getTime() + leg2DurationAuth);

    // Prix réaliste "Classique" (cher, sans optimisation)
    // Ex: Paris-Djanet classique tourne autour de 400-600€
    const basePrice = 450;
    const price = params.returnDate ? basePrice * 1.8 : basePrice;

    // Construction de l'objet résultat style Amadeus
    const segments = [
        {
            origin: params.origin,
            destination: params.destination, // "Global" segment info derived? No, checking format
            departureTime: leg1Dep.toISOString(),
            arrivalTime: leg2Arr.toISOString(),
            airline: "Air Algérie",
            flightNumber: "AH1000",
            duration: "8h 00m" // Total approx
        }
    ];

    // Note: Le frontend attend souvent une structure nested 'segments' ou 'itineraries'
    // Mais ici on renvoie le format "flat" transformé par AmadeusAPI ou le format raw?
    // AmadeusAPI.parseFlightResults renvoie AmadeusFlightResult.
    // Structure:
    /*
      {
        id: string,
        price: { amount, currency },
        segments: [ { origin, destination, departureTime, ... }, ... ]
      }
    */

    return {
        id: `classic-synth-${Date.now()}`,
        airline: "Air Algérie",
        airlineCode: "AH",
        flightNumber: "AH1000/AH6000",
        origin: params.origin,
        destination: params.destination,
        departureTime: leg1Dep.toISOString(),
        arrivalTime: leg2Arr.toISOString(),
        duration: "8h 00m",
        stops: 1,
        price: {
            amount: price,
            currency: "EUR"
        },
        aircraft: "737-800",
        cabinClass: params.cabin || "Economy",
        provider: "Amadeus (Simulated)",
        direct: false,
        baggage: {
            included: true,
            weight: "23kg",
            details: "1 Bagage inclus"
        },
        segments: [
            {
                origin: params.origin,
                destination: "ALG",
                departureTime: leg1Dep.toISOString(),
                arrivalTime: leg1Arr.toISOString(),
                airline: "Air Algérie",
                flightNumber: "AH1000",
                duration: "2h 15m"
            },
            {
                origin: "ALG",
                destination: params.destination,
                departureTime: leg2Dep.toISOString(),
                arrivalTime: leg2Arr.toISOString(),
                airline: "Air Algérie",
                flightNumber: "AH6292", // Vol typique vers le sud
                duration: "2h 15m"
            }
        ]
    };
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
 * Génère une option DjazAir synthétique (Fallback) pour garantir un résultat
 */
function generateSyntheticDjazAirOption(params: SearchParams): DjazAirFlight {
    console.log("⚠️ Génération d'une option synthétique pour:", params);

    // Estimation basique de la durée selon la région (Code IATA)
    const isLongHaul = (code: string) => ["JFK", "NYC", "YUL", "PEK", "DXB", "JNB", "NRT"].includes(code);
    const getDurationMs = (code: string) => isLongHaul(code) ? 8 * 3600 * 1000 : 2.5 * 3600 * 1000;
    const getDurationStr = (code: string) => {
        if (["PEK", "NRT"].includes(code)) return "10h 00m"; // Even longer for Asia
        if (isLongHaul(code)) return "8h 00m";
        return "2h 30m";
    };

    const leg1DurationMs = getDurationMs(params.origin); // Origin -> ALG
    const leg2DurationMs = getDurationMs(params.destination); // ALG -> Dest

    // Dates simulées réalistes
    const departureDate = new Date(params.departureDate);
    const toAlgiersDep = new Date(departureDate);
    toAlgiersDep.setHours(11, 30, 0, 0); // 11h30

    // Arrivée ALG
    const toAlgiersArr = new Date(toAlgiersDep.getTime() + leg1DurationMs);

    // Escale 4h
    const fromAlgiersDep = new Date(toAlgiersArr.getTime() + 4 * 3600 * 1000);

    // Arrivée Destination
    const fromAlgiersArr = new Date(fromAlgiersDep.getTime() + leg2DurationMs);

    // Distances approx pour pricing
    const distances: Record<string, number> = {
        'DXB': 5200, 'JFK': 5800, 'BKK': 9500, 'NRT': 9700
    };
    const dist = distances[params.destination] || 5000;

    // Prix basés sur distance (0.07€/km pour être compétitif)
    const basePrice = Math.round(dist * 0.07);
    const priceEUR = Math.round(basePrice * 100) / 100;

    // Segments
    const segments: any[] = [
        {
            origin: params.origin,
            destination: "ALG",
            airline: "Air Algérie",
            flightNumber: "AH1001",
            departureTime: toAlgiersDep.toISOString(),
            arrivalTime: toAlgiersArr.toISOString(),
            duration: getDurationStr(params.origin),
            priceEUR: Math.round(priceEUR * 0.3),
            currency: "EUR",
            leg: "ALLER",
            stops: 0
        },
        {
            origin: "ALG",
            destination: params.destination,
            airline: "Air Algérie",
            flightNumber: "AH2002",
            departureTime: fromAlgiersDep.toISOString(),
            arrivalTime: fromAlgiersArr.toISOString(),
            duration: getDurationStr(params.destination),
            priceEUR: Math.round(priceEUR * 0.7), // Sera affiché en DZD converti
            priceDZD: Math.round(priceEUR * 0.7 * 150), // Prix officiel DZD
            currency: "DZD",
            leg: "ALLER",
            stops: 0
        }
    ];

    let returnDate: string | undefined = undefined;
    let totalPriceEUR = priceEUR;

    // Gestion retour si AR
    if (params.returnDate) {
        returnDate = params.returnDate;
        const retDate = new Date(params.returnDate);

        // S3: Dest -> ALG
        const retToAlgDep = new Date(retDate);
        retToAlgDep.setHours(9, 0, 0, 0);
        const retToAlgArr = new Date(retToAlgDep.getTime() + 7.5 * 3600 * 1000);

        // S4: ALG -> Origin
        const retFromAlgDep = new Date(retToAlgArr.getTime() + 3 * 3600 * 1000); // 3h escale
        const retFromAlgArr = new Date(retFromAlgDep.getTime() + 2.5 * 3600 * 1000);

        // Prix retour (souvent un peu moins cher)
        const retPriceEUR = Math.round(priceEUR * 0.9);
        totalPriceEUR += retPriceEUR;

        segments.push(
            {
                origin: params.destination,
                destination: "ALG",
                airline: "Air Algérie",
                flightNumber: "AH2003",
                departureTime: retToAlgDep.toISOString(),
                arrivalTime: retToAlgArr.toISOString(),
                duration: "7h 30m",
                priceEUR: Math.round(retPriceEUR * 0.7),
                priceDZD: Math.round(retPriceEUR * 0.7 * 150),
                currency: "DZD",
                leg: "RETOUR",
                stops: 0
            },
            {
                origin: "ALG",
                destination: params.origin,
                airline: "Air Algérie",
                flightNumber: "AH1004",
                departureTime: retFromAlgDep.toISOString(),
                arrivalTime: retFromAlgArr.toISOString(),
                duration: "2h 30m",
                priceEUR: Math.round(retPriceEUR * 0.3),
                priceDZD: Math.round(retPriceEUR * 0.3 * 150),
                currency: "DZD",
                leg: "RETOUR",
                stops: 0
            }
        );
    }

    const totalDurationMs = fromAlgiersArr.getTime() - toAlgiersDep.getTime();

    // Calcul économie simulée (25-30% vs classique)
    const savingsAmount = Math.round(totalPriceEUR * 0.35);

    return {
        id: `dz-synth-${Date.now()}`,
        origin: params.origin,
        destination: params.destination,
        departureDate: toAlgiersDep.toISOString(),
        returnDate: returnDate,
        totalDuration: formatDuration(totalDurationMs),
        totalPriceEUR: Number(totalPriceEUR.toFixed(2)),
        segments: segments,
        layover: {
            airport: "ALG",
            duration: "4h 00m",
            location: "Alger, Algérie"
        },
        savings: {
            amount: savingsAmount,
            percentage: 35,
            comparedTo: totalPriceEUR + savingsAmount
        }
    };
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
        message: "Aucun vol disponible pour ces dates (Amadeus API limitation)."
    };
}
