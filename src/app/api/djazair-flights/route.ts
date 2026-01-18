import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";
import { isValidAirportCode, getAirportInfo, getAirportDisplayName } from "@/data/airports";

// Schéma de validation pour les paramètres
const djazairFlightsSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string().optional(),
  departDate: z.string().optional(),
  returnDate: z.string().nullable().optional().transform(val => val === null ? undefined : val),
  adults: z.number().min(1).max(9).default(1),
  children: z.number().min(0).max(8).default(0),
  infants: z.number().min(0).max(8).default(0),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  maxResults: z.number().min(1).max(100).default(20),
  policy: z.enum(["DZ_ONLY", "ALL_DZ_TOUCHING"]).default("DZ_ONLY"),
  dzdEurRate: z.number().min(1).max(1000).default(280),
  airlinesWhitelist: z.string().optional(),
});

// Local interface removed, using shared type from @/types/djazair

// Helper function moved to shared lib
import { searchDjazAirTrip } from "@/lib/searchLogic";

export async function POST(request: Request) {
  try {
    console.log("🚀 Début de l'API DjazAir Flights - VOLS RÉELS UNIQUEMENT");

    const body = await request.json();
    console.log("📥 Body reçu:", body);

    const params = djazairFlightsSchema.parse(body);
    console.log("✅ Paramètres validés:", params);

    if (!isValidAirportCode(params.origin) || !isValidAirportCode(params.destination)) {
      return NextResponse.json({ success: false, error: "Code aéroport invalide", data: [] });
    }

    if (params.origin === "ALG" || params.destination === "ALG") {
      return NextResponse.json({
        success: false,
        error: "Pour un vol DjazAir, Alger (ALG) doit être une escale, pas l'origine ou la destination finale.",
        data: []
      });
    }

    const departureDate = params.departureDate || params.departDate;
    if (!departureDate) {
      return NextResponse.json({ success: false, error: "Date de départ requise", data: [] });
    }

    // Appel de la logique partagée AVEC FALLBACK sur dates proches
    const isRoundTrip = !!params.returnDate;
    console.log(`🚀 Appel de searchLogic avec fallback... Mode: ${isRoundTrip ? 'ALLER-RETOUR' : 'ALLER SIMPLE'}`);

    const { searchDjazAirTripWithFallback } = await import("@/lib/searchLogic");

    const result = await searchDjazAirTripWithFallback({
      origin: params.origin,
      destination: params.destination,
      departureDate: departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      cabin: params.cabin,
      dzdEurRate: params.dzdEurRate
    });

    if (result.flights.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: result.message || "Aucun vol compatible trouvé via Alger."
      });
    }

    console.log(`✅ ${result.flights.length} vols DjazAir trouvés${result.isAlternativeDate ? ' (date alternative)' : ''}`);
    return NextResponse.json({
      success: true,
      data: result.flights,
      isAlternativeDate: result.isAlternativeDate,
      actualDepartureDate: result.actualDepartureDate,
      actualReturnDate: result.actualReturnDate,
      alternativeDateMessage: result.message,
      metadata: { source: "REAL_API_MULTI_LEG_FALLBACK" }
    });

  } catch (error: any) {
    console.error("❌ Erreur API DjazAir:", error);
    return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
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
