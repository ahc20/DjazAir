import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schéma de validation pour les paramètres
const djazairFlightsSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string().optional(), // Rendre optionnel pour compatibilité
  departDate: z.string().optional(), // Ajouter pour compatibilité avec le frontend
  returnDate: z.string().optional(),
  adults: z.number().min(1).max(9).default(1),
  children: z.number().min(0).max(8).default(0),
  infants: z.number().min(0).max(8).default(0),
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
    console.log("🚀 Début de l'API DjazAir Flights");
    
    const body = await request.json();
    console.log("📥 Body reçu:", body);
    
    const params = djazairFlightsSchema.parse(body);
    console.log("✅ Paramètres validés:", params);

    // Gérer la compatibilité des noms de paramètres
    const departureDate = params.departureDate || params.departDate;
    if (!departureDate) {
      console.log("❌ Date de départ manquante");
      return NextResponse.json({
        success: false,
        error: "Date de départ requise",
        data: []
      });
    }

    const isRoundTrip = !!params.returnDate;
    console.log(`🔄 Type de vol: ${isRoundTrip ? 'Aller-Retour (AR)' : 'Aller Simple (AS)'}`);

    // Pour l'instant, générer des vols simulés mais réalistes
    console.log("🎯 Génération de vols DjazAir simulés...");
    
    const djazairFlights: DjazAirFlight[] = [];
    
    // Générer 3 options DjazAir différentes
    for (let i = 0; i < 3; i++) {
      // Prix de base pour chaque segment
      const segment1PriceEUR = 120 + (i * 20); // 120€, 140€, 160€
      const segment2PriceEUR = 180 + (i * 25); // 180€, 205€, 230€
      
      // Pour les vols AR, ajouter les segments retour
      const segment3PriceEUR = 130 + (i * 15); // 130€, 145€, 160€ (retour)
      const segment4PriceEUR = 190 + (i * 20); // 190€, 210€, 230€ (retour)
      
      // Conversion DZD avec taux parallèle
      const officialRate = 150; // 1 EUR = 150 DZD (taux officiel)
      const parallelRate = params.dzdEurRate; // 1 EUR = 260 DZD (taux parallèle)
      
      // Segment 2 et 4: prix en DZD converti au taux parallèle
      const segment2PriceDZD = segment2PriceEUR * officialRate;
      const segment2FinalPriceEUR = (segment2PriceDZD / parallelRate);
      const segment4PriceDZD = segment4PriceEUR * officialRate;
      const segment4FinalPriceEUR = (segment4PriceDZD / parallelRate);
      
      // Prix total selon le type de vol
      let totalPriceEUR, totalPriceDZD;
      if (isRoundTrip) {
        // AR: 4 segments (2 aller + 2 retour)
        totalPriceEUR = segment1PriceEUR + segment2FinalPriceEUR + segment3PriceEUR + segment4FinalPriceEUR;
        totalPriceDZD = (segment1PriceEUR * parallelRate) + segment2PriceDZD + (segment3PriceEUR * parallelRate) + segment4PriceDZD;
      } else {
        // AS: 2 segments (aller seulement)
        totalPriceEUR = segment1PriceEUR + segment2FinalPriceEUR;
        totalPriceDZD = (segment1PriceEUR * parallelRate) + segment2PriceDZD;
      }
      
      // Horaires de départ (matin, après-midi, soir)
      const departureHours = [9, 14, 20];
      const departureHour = departureHours[i];
      
      // Créer des dates simples et valides
      const baseDate = new Date(departureDate);
      const returnBaseDate = isRoundTrip ? new Date(params.returnDate!) : null;
      
      // Segments aller
      const segment1Departure = new Date(baseDate);
      segment1Departure.setHours(departureHour, 0, 0, 0);
      
      const segment1Arrival = new Date(baseDate);
      segment1Arrival.setHours(departureHour + 1, 15, 0, 0);
      
      const segment2Departure = new Date(baseDate);
      segment2Departure.setHours(departureHour + 12, 0, 0, 0);
      
      const segment2Arrival = new Date(baseDate);
      segment2Arrival.setHours(departureHour + 12 + 9, 45, 0, 0);
      
      // Segments retour (seulement pour AR)
      let segment3Departure, segment3Arrival, segment4Departure, segment4Arrival;
      if (isRoundTrip && returnBaseDate) {
        segment3Departure = new Date(returnBaseDate);
        segment3Departure.setHours(departureHour + 2, 0, 0, 0); // +2h pour éviter conflit
        
        segment3Arrival = new Date(returnBaseDate);
        segment3Arrival.setHours(departureHour + 2 + 1, 15, 0, 0);
        
        segment4Departure = new Date(returnBaseDate);
        segment4Departure.setHours(departureHour + 2 + 12, 0, 0, 0);
        
        segment4Arrival = new Date(returnBaseDate);
        segment4Arrival.setHours(departureHour + 2 + 12 + 9, 45, 0, 0);
      }
      
      // Créer le vol DjazAir
      const flight: DjazAirFlight = {
        id: `djazair-${i + 1}`,
        origin: params.origin,
        destination: params.destination,
        departureDate: departureDate,
        returnDate: isRoundTrip ? params.returnDate : undefined,
        totalDuration: isRoundTrip ? `${44 + i * 2}h ${60 + i * 20}m` : `${22 + i}h ${30 + i * 10}m`,
        totalPriceEUR: Math.round(totalPriceEUR * 100) / 100,
        totalPriceDZD: Math.round(totalPriceDZD),
        segments: [
          {
            origin: params.origin,
            destination: "ALG",
            airline: "Air Algérie",
            flightNumber: `AH${1000 + i}`,
            departureTime: segment1Departure.toISOString(),
            arrivalTime: segment1Arrival.toISOString(),
            duration: `${1 + i * 0.5}h ${15 + i * 5}m`,
            priceEUR: segment1PriceEUR,
            currency: "EUR"
          },
          {
            origin: "ALG",
            destination: params.destination,
            airline: "Air Algérie",
            flightNumber: `AH${2000 + i}`,
            departureTime: segment2Departure.toISOString(),
            arrivalTime: segment2Arrival.toISOString(),
            duration: `${9 + i * 0.5}h ${45 + i * 5}m`,
            priceEUR: segment2FinalPriceEUR,
            priceDZD: segment2PriceDZD,
            currency: "DZD"
          }
        ],
        layover: {
          airport: "ALG",
          duration: `${11 + i}h ${50 + i * 10}m`,
          location: "Alger, Algérie"
        },
        savings: {
          amount: 50 + (i * 25), // 50€, 75€, 100€ d'économies
          percentage: 15 + (i * 5), // 15%, 20%, 25%
          comparedTo: isRoundTrip ? 800 + (i * 100) : 400 + (i * 50) // Prix de référence ajusté selon AR/AS
        }
      };
      
      // Ajouter les segments retour pour les vols AR
      if (isRoundTrip && segment3Departure && segment3Arrival && segment4Departure && segment4Arrival) {
        flight.segments.push(
          {
            origin: params.destination,
            destination: "ALG",
            airline: "Air Algérie",
            flightNumber: `AH${3000 + i}`,
            departureTime: segment3Departure.toISOString(),
            arrivalTime: segment3Arrival.toISOString(),
            duration: `${9 + i * 0.5}h ${45 + i * 5}m`,
            priceEUR: segment3PriceEUR,
            currency: "EUR"
          },
          {
            origin: "ALG",
            destination: params.origin,
            airline: "Air Algérie",
            flightNumber: `AH${4000 + i}`,
            departureTime: segment4Departure.toISOString(),
            arrivalTime: segment4Arrival.toISOString(),
            duration: `${1 + i * 0.5}h ${15 + i * 5}m`,
            priceEUR: segment4FinalPriceEUR,
            priceDZD: segment4PriceDZD,
            currency: "DZD"
          }
        );
        
        // Ajouter l'escale retour
        flight.layover = {
          airport: "ALG",
          duration: `${11 + i}h ${50 + i * 10}m`,
          location: "Alger, Algérie (aller et retour)"
        };
      }
      
      djazairFlights.push(flight);
    }

    console.log(`✅ ${djazairFlights.length} vols DjazAir générés avec succès`);
    
    return NextResponse.json({
      success: true,
      data: djazairFlights,
      metadata: {
        tripType: isRoundTrip ? "Aller-Retour (AR)" : "Aller Simple (AS)",
        segmentsFound: {
          outbound: {
            segment1: djazairFlights.length,
            segment2: djazairFlights.length
          }
        },
        totalCombinations: djazairFlights.length,
        dzdEurRate: params.dzdEurRate,
        officialRate: 150,
        policy: params.policy,
        rateExplanation: {
          official: "1 EUR = 150 DZD (taux officiel utilisé par Amadeus)",
          parallel: `1 EUR = ${params.dzdEurRate} DZD (taux parallèle pour les économies DjazAir)`,
          note: "Les prix DZD d'Amadeus sont automatiquement convertis au taux officiel"
        },
        message: "Vols DjazAir simulés générés avec succès - API Amadeus en cours de configuration"
      }
    });

  } catch (error) {
    console.error("❌ Erreur API DjazAir Flights:", error);
    
    if (error instanceof z.ZodError) {
      console.error("❌ Erreur de validation des paramètres:", error.errors);
      return NextResponse.json({
        success: false,
        error: "Paramètres invalides",
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: `Erreur interne du serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      stack: error instanceof Error ? error.stack : undefined
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
