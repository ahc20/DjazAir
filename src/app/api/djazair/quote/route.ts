import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";

// Schéma de validation des paramètres
const djazairQuoteSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().min(1).max(9).default(1),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
  maxResults: z.number().min(1).max(100).default(20),
  policy: z.enum(["DZ_ONLY", "ALL_DZ_TOUCHING"]).default("DZ_ONLY"),
  dzdEurRate: z.number().min(1).max(1000).default(260),
  airlinesWhitelist: z.string().optional(),
});

// Types pour la réponse
interface FlightSegment {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  cabin?: string;
}

interface QuoteBreakdown {
  originToAlgiers: {
    priceEUR: number;
    priceDZD?: number;
    currency: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  algiersToDestination: {
    priceEUR: number;
    priceDZD?: number;
    currency: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  totalEUR: number;
  totalDZD?: number;
  dzdEurRate: number;
  warnings: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraction des paramètres de query
    const params = {
      origin: searchParams.get("origin"),
      destination: searchParams.get("destination"),
      departureDate: searchParams.get("departureDate"),
      returnDate: searchParams.get("returnDate"),
      adults: searchParams.get("adults") ? parseInt(searchParams.get("adults")!) : 1,
      cabin: searchParams.get("cabin") || undefined,
      maxResults: searchParams.get("maxResults") ? parseInt(searchParams.get("maxResults")!) : 20,
      policy: searchParams.get("policy") || "DZ_ONLY",
      dzdEurRate: searchParams.get("dzdEurRate") ? parseFloat(searchParams.get("dzdEurRate")!) : 260,
      airlinesWhitelist: searchParams.get("airlinesWhitelist") || undefined,
    };

    console.log("📥 DjazAir Quote - Paramètres reçus:", params);

    // Validation des paramètres
    const validationResult = djazairQuoteSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres invalides",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;
    
    // Génération du devis DjazAir
    const quote = await generateDjazAirQuote(validatedParams);
    
    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de générer un devis DjazAir",
        },
        { status: 404 }
      );
    }

    console.log("✅ DjazAir Quote - Devis généré:", quote);
    
    return NextResponse.json({
      success: true,
      data: quote,
    });

  } catch (error) {
    console.error("❌ Erreur DjazAir Quote:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 DjazAir Quote - Body reçu:", body);

    // Validation des paramètres
    const validationResult = djazairQuoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;
    
    // Génération du devis DjazAir
    const quote = await generateDjazAirQuote(validatedParams);
    
    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de générer un devis DjazAir",
        },
        { status: 404 }
      );
    }

    console.log("✅ DjazAir Quote - Devis généré:", quote);
    
    return NextResponse.json({
      success: true,
      data: quote,
    });

  } catch (error) {
    console.error("❌ Erreur DjazAir Quote:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
      },
      { status: 500 }
    );
  }
}

/**
 * Génère un devis DjazAir complet
 */
async function generateDjazAirQuote(params: z.infer<typeof djazairQuoteSchema>): Promise<QuoteBreakdown | null> {
  try {
    const amadeusAPI = new AmadeusAPI();
    const warnings: string[] = [];

    // 1. Recherche du premier segment : origin ⇄ ALG
    console.log("🔍 Recherche segment 1:", params.origin, "⇄ ALG");
    const originToAlgiers = await searchFlightSegment(
      amadeusAPI,
      {
        origin: params.origin,
        destination: "ALG",
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        cabin: params.cabin,
      },
      params.policy,
      params.dzdEurRate,
      params.airlinesWhitelist,
      params.maxResults
    );

    if (!originToAlgiers) {
      console.warn("⚠️ Aucun vol trouvé pour", params.origin, "→ ALG");
      return null;
    }

    // 2. Recherche du deuxième segment : ALG ⇄ destination
    console.log("🔍 Recherche segment 2: ALG ⇄", params.destination);
    const algiersToDestination = await searchFlightSegment(
      amadeusAPI,
      {
        origin: "ALG",
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        cabin: params.cabin,
      },
      params.policy,
      params.dzdEurRate,
      params.airlinesWhitelist,
      params.maxResults
    );

    if (!algiersToDestination) {
      console.warn("⚠️ Aucun vol trouvé pour ALG →", params.destination);
      return null;
    }

    // 3. Calcul du total et génération du devis
    const totalEUR = originToAlgiers.priceEUR + algiersToDestination.priceEUR;
    const totalDZD = originToAlgiers.priceDZD && algiersToDestination.priceDZD 
      ? originToAlgiers.priceDZD + algiersToDestination.priceDZD 
      : undefined;

    // 4. Ajout des avertissements
    warnings.push("⚠️ Billets séparés : correspondance non protégée");
    warnings.push("⚠️ Escale à Alger : vérifiez les temps de connexion");
    
    if (params.policy === "DZ_ONLY") {
      warnings.push("ℹ️ Politique DZ_ONLY : DZD uniquement pour les vols depuis ALG");
    } else {
      warnings.push("ℹ️ Politique ALL_DZ_TOUCHING : DZD pour tous les vols touchant ALG");
    }

    const quote: QuoteBreakdown = {
      originToAlgiers: {
        priceEUR: originToAlgiers.priceEUR,
        priceDZD: originToAlgiers.priceDZD,
        currency: originToAlgiers.currency,
        airline: originToAlgiers.airline,
        flightNumber: originToAlgiers.flightNumber,
        departureTime: originToAlgiers.departureTime,
        arrivalTime: originToAlgiers.arrivalTime,
        duration: originToAlgiers.duration,
      },
      algiersToDestination: {
        priceEUR: algiersToDestination.priceEUR,
        priceDZD: algiersToDestination.priceDZD,
        currency: algiersToDestination.currency,
        airline: algiersToDestination.airline,
        flightNumber: algiersToDestination.flightNumber,
        departureTime: algiersToDestination.departureTime,
        arrivalTime: algiersToDestination.arrivalTime,
        duration: algiersToDestination.duration,
      },
      totalEUR,
      totalDZD,
      dzdEurRate: params.dzdEurRate,
      warnings,
    };

    return quote;

  } catch (error) {
    console.error("❌ Erreur génération devis:", error);
    return null;
  }
}

/**
 * Recherche un segment de vol avec la logique métier DjazAir
 */
async function searchFlightSegment(
  amadeusAPI: AmadeusAPI,
  segment: FlightSegment,
  policy: "DZ_ONLY" | "ALL_DZ_TOUCHING",
  dzdEurRate: number,
  airlinesWhitelist?: string,
  maxResults: number = 20
) {
  try {
    // Déterminer la devise selon la politique
    let currency = "EUR";
    if (policy === "DZ_ONLY" && segment.origin === "ALG") {
      currency = "DZD";
    } else if (policy === "ALL_DZ_TOUCHING" && (segment.origin === "ALG" || segment.destination === "ALG")) {
      currency = "DZD";
    }

    console.log(`🔍 Recherche ${segment.origin} → ${segment.destination} en ${currency}`);

    // Recherche via Amadeus
    const flights = await amadeusAPI.searchFlights({
      origin: segment.origin,
      destination: segment.destination,
      departureDate: segment.departureDate,
      returnDate: segment.returnDate,
      passengers: segment.adults,
      cabinClass: segment.cabin || "ECONOMY",
      currency,
    });

    if (flights.length === 0) {
      console.warn(`⚠️ Aucun vol trouvé pour ${segment.origin} → ${segment.destination}`);
      return null;
    }

    // Filtrage par compagnies si whitelist fournie
    let filteredFlights = flights;
    if (airlinesWhitelist) {
      const whitelist = airlinesWhitelist.split(",").map(code => code.trim().toUpperCase());
      filteredFlights = flights.filter(flight => {
        const carrierCode = flight.airline?.toUpperCase();
        return carrierCode && whitelist.includes(carrierCode);
      });
      
      if (filteredFlights.length === 0) {
        console.warn(`⚠️ Aucun vol trouvé pour les compagnies: ${airlinesWhitelist}`);
        return null;
      }
    }

    // Tri par prix croissant et sélection du moins cher
    const sortedFlights = filteredFlights.sort((a, b) => a.price.amount - b.price.amount);
    const cheapestFlight = sortedFlights[0];

    // Conversion en EUR si nécessaire
    let priceEUR = cheapestFlight.price.amount;
    let priceDZD: number | undefined;

    if (currency === "DZD") {
      priceDZD = cheapestFlight.price.amount;
      priceEUR = Math.round((priceDZD / dzdEurRate) * 100) / 100;
      console.log(`💱 Conversion DZD → EUR: ${priceDZD} DZD = ${priceEUR} EUR (taux: ${dzdEurRate})`);
    }

    return {
      priceEUR,
      priceDZD,
      currency,
      airline: cheapestFlight.airline || "N/A",
      flightNumber: cheapestFlight.flightNumber || "N/A",
      departureTime: cheapestFlight.departureTime || "N/A",
      arrivalTime: cheapestFlight.arrivalTime || "N/A",
      duration: cheapestFlight.duration || "N/A",
    };

  } catch (error) {
    console.error(`❌ Erreur recherche segment ${segment.origin} → ${segment.destination}:`, error);
    return null;
  }
}
