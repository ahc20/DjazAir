import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";

// Schéma de validation pour les paramètres
const djazairFlightsSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  adults: z.number().min(1).max(9).default(1),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  maxResults: z.number().min(1).max(100).default(20),
  policy: z.enum(["DZ_ONLY", "ALL_DZ_TOUCHING"]).default("DZ_ONLY"),
  dzdEurRate: z.number().min(1).max(1000).default(260),
  airlinesWhitelist: z.string().optional(),
});

interface DjazAirFlight {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  totalDuration: string;
  totalPriceEUR: number;
  totalPriceDZD?: number;
  segments: {
    origin: string;
    destination: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    priceEUR: number;
    priceDZD?: number;
    currency: string;
  }[];
  layover: {
    airport: string;
    duration: string;
    location: string;
  };
  savings: {
    amount: number;
    percentage: number;
    comparedTo: number;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = djazairFlightsSchema.parse(body);

    console.log("🚀 DjazAir Flights API - Paramètres reçus:", params);

    // Initialisation de l'API Amadeus
    const amadeusAPI = new AmadeusAPI();
    
    // Recherche du premier segment : origin → ALG
    console.log("🔍 Recherche du segment 1:", params.origin, "→ ALG");
    const segment1Flights = await amadeusAPI.searchFlights({
      origin: params.origin,
      destination: "ALG",
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.adults,
      cabinClass: params.cabin,
      currency: "EUR",
    });

    if (!segment1Flights || segment1Flights.length === 0) {
      console.log("❌ Aucun vol trouvé pour le segment 1");
      return NextResponse.json({
        success: false,
        error: `Aucun vol trouvé de ${params.origin} vers Alger (ALG)`,
        data: []
      });
    }

    // Recherche du deuxième segment : ALG → destination
    console.log("🔍 Recherche du segment 2: ALG →", params.destination);
    const segment2Flights = await amadeusAPI.searchFlights({
      origin: "ALG",
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.adults,
      cabinClass: params.cabin,
      currency: "EUR", // Amadeus retourne le prix en EUR, pas en DZD
    });

    if (!segment2Flights || segment2Flights.length === 0) {
      console.log("❌ Aucun vol trouvé pour le segment 2");
      return NextResponse.json({
        success: false,
        error: `Aucun vol trouvé d'Alger (ALG) vers ${params.destination}`,
        data: []
      });
    }

    console.log(`✅ Segments trouvés: ${segment1Flights.length} + ${segment2Flights.length}`);

    // Génération des combinaisons DjazAir
    const djazairFlights: DjazAirFlight[] = [];
    const maxCombinations = Math.min(5, segment1Flights.length * segment2Flights.length);

    let combinationsGenerated = 0;
    
    // Parcourir les combinaisons possibles
    for (const segment1 of segment1Flights.slice(0, 3)) {
      for (const segment2 of segment2Flights.slice(0, 3)) {
        if (combinationsGenerated >= maxCombinations) break;

        // Vérifier la compatibilité des horaires
        const segment1Arrival = new Date(segment1.arrivalTime);
        const segment2Departure = new Date(segment2.departureTime);
        const layoverDuration = segment2Departure.getTime() - segment1Arrival.getTime();
        
        // Escale minimum de 2h, maximum de 24h
        if (layoverDuration < 2 * 60 * 60 * 1000 || layoverDuration > 24 * 60 * 60 * 1000) {
          continue;
        }

        // Calcul des prix avec correction des taux de change
        const segment1PriceEUR = segment1.price.amount;  // Prix en EUR depuis l'origine
        
        // CORRECTION : Amadeus retourne le prix en EUR pour le segment ALG → DXB
        // Il faut le multiplier par 150 (taux officiel) puis diviser par 260 (taux parallèle)
        const amadeusPriceEUR = segment2.price.amount;  // Prix EUR retourné par Amadeus
        const officialRate = 150;  // Taux officiel : 1 EUR = 150 DZD
        const parallelRate = params.dzdEurRate;  // Taux parallèle : 1 EUR = 260 DZD
        
        // Étape 1 : Convertir le prix EUR d'Amadeus en DZD (taux officiel)
        const segment2PriceDZD = amadeusPriceEUR * officialRate;
        
        // Étape 2 : Convertir ce prix DZD au taux parallèle pour avoir le "vrai" prix EUR
        const segment2FinalPriceEUR = segment2PriceDZD / parallelRate;
        
        // Logs détaillés pour le debugging
        console.log(`🔢 Calcul des taux pour ${segment2.origin} → ${segment2.destination}:`);
        console.log(`   Prix Amadeus (EUR): ${amadeusPriceEUR} EUR`);
        console.log(`   Taux officiel: 1 EUR = ${officialRate} DZD`);
        console.log(`   Taux parallèle: 1 EUR = ${parallelRate} DZD`);
        console.log(`   Prix en DZD (officiel): ${amadeusPriceEUR} × ${officialRate} = ${segment2PriceDZD.toFixed(0)} DZD`);
        console.log(`   Prix final (EUR parallèle): ${segment2PriceDZD.toFixed(0)} / ${parallelRate} = ${segment2FinalPriceEUR.toFixed(2)} EUR`);
        
        const totalPriceEUR = segment1PriceEUR + segment2FinalPriceEUR;
        const totalPriceDZD = (segment1PriceEUR * parallelRate) + segment2PriceDZD;

        // Calcul de la durée totale
        const totalDurationMs = (new Date(segment2.arrivalTime).getTime() - new Date(segment1.departureTime).getTime());
        const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalDuration = `${totalHours}h ${totalMinutes}m`;

        // Formatage de l'escale
        const layoverHours = Math.floor(layoverDuration / (1000 * 60 * 60));
        const layoverMinutes = Math.floor((layoverDuration % (1000 * 60 * 60)) / (1000 * 60));
        const layoverDurationFormatted = `${layoverHours}h ${layoverMinutes}m`;

        const flight: DjazAirFlight = {
          id: `djazair-${segment1.id}-${segment2.id}`,
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          totalDuration,
          totalPriceEUR: Math.round(totalPriceEUR * 100) / 100,
          totalPriceDZD: Math.round(totalPriceDZD),
          segments: [
            {
              origin: segment1.origin,
              destination: segment1.destination,
              airline: segment1.airline || "Compagnie non spécifiée",
              flightNumber: segment1.flightNumber || "Vol non spécifié",
              departureTime: segment1.departureTime,
              arrivalTime: segment1.arrivalTime,
              duration: segment1.duration || "Durée non spécifiée",
              priceEUR: segment1PriceEUR,
              currency: "EUR"
            },
            {
              origin: segment2.origin,
              destination: segment2.destination,
              airline: segment2.airline || "Compagnie non spécifiée",
              flightNumber: segment2.flightNumber || "Vol non spécifié",
              departureTime: segment2.departureTime,
              arrivalTime: segment2.arrivalTime,
              duration: segment2.duration || "Durée non spécifiée",
              priceEUR: segment2FinalPriceEUR,
              priceDZD: segment2PriceDZD,
              currency: "DZD"
            }
          ],
          layover: {
            airport: "ALG",
            duration: layoverDurationFormatted,
            location: "Alger, Algérie"
          },
          savings: {
            amount: 0, // Sera calculé côté frontend
            percentage: 0,
            comparedTo: 0
          }
        };

        djazairFlights.push(flight);
        combinationsGenerated++;
      }
    }

    // Trier par prix croissant
    djazairFlights.sort((a, b) => a.totalPriceEUR - b.totalPriceEUR);

    console.log(`🎯 ${djazairFlights.length} combinaisons DjazAir générées`);

    return NextResponse.json({
      success: true,
      data: djazairFlights,
      metadata: {
        segmentsFound: {
          segment1: segment1Flights.length,
          segment2: segment2Flights.length
        },
        totalCombinations: djazairFlights.length,
        dzdEurRate: params.dzdEurRate,
        officialRate: 150,
        policy: params.policy,
        rateExplanation: {
          official: "1 EUR = 150 DZD (taux officiel utilisé par Amadeus)",
          parallel: `1 EUR = ${params.dzdEurRate} DZD (taux parallèle pour les économies DjazAir)`,
          note: "Les prix DZD d'Amadeus sont automatiquement convertis au taux officiel"
        }
      }
    });

  } catch (error) {
    console.error("❌ Erreur API DjazAir Flights:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Paramètres invalides",
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraction des paramètres depuis l'URL
    const params = {
      origin: searchParams.get("origin") || "CDG",
      destination: searchParams.get("destination") || "DXB",
      departureDate: searchParams.get("departureDate") || "2025-09-17",
      returnDate: searchParams.get("returnDate") || undefined,
      adults: parseInt(searchParams.get("adults") || "1"),
      cabin: (searchParams.get("cabin") as any) || "ECONOMY",
      maxResults: parseInt(searchParams.get("maxResults") || "20"),
      policy: (searchParams.get("policy") as any) || "DZ_ONLY",
      dzdEurRate: parseFloat(searchParams.get("dzdEurRate") || "260"),
      airlinesWhitelist: searchParams.get("airlinesWhitelist") || undefined,
    };

    // Validation des paramètres
    const validatedParams = djazairFlightsSchema.parse(params);
    
    // Appel de la logique POST
    const postRequest = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validatedParams)
    });

    return POST(postRequest);

  } catch (error) {
    console.error("❌ Erreur API DjazAir Flights GET:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Paramètres invalides",
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Erreur interne du serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}
