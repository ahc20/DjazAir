import { NextResponse } from "next/server";
import { z } from "zod";

const djazairRequestSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengers: z.number().min(1).max(9).default(1),
  cabinClass: z
    .enum(["Economy", "ECONOMY", "Premium Economy", "Business", "First"])
    .default("Economy"),
  currency: z.string().default("EUR"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 DjazAir Simple: Données reçues:", body);

    // Validation
    const validationResult = djazairRequestSchema.safeParse(body);
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

    const params = validationResult.data;
    console.log(
      `🚀 DjazAir Simple: Calcul pour ${params.origin} → ${params.destination}`
    );

    // Calcul DjazAir SIMPLE et RAPIDE - pas d'appels externes
    const djazairOption = calculateDjazAirOption(params);

    console.log("✅ DjazAir Simple: Option calculée:", djazairOption);
    return NextResponse.json({
      success: true,
      data: djazairOption,
    });
  } catch (error) {
    console.error("❌ Erreur DjazAir Simple:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur de calcul DjazAir",
      },
      { status: 500 }
    );
  }
}

/**
 * Calcule une option DjazAir simple et rapide
 */
function calculateDjazAirOption(params: any) {
  const departureDate = new Date(params.departureDate);
  
  // Horaires optimisés
  const toAlgiersDeparture = new Date(departureDate);
  toAlgiersDeparture.setHours(10, 0, 0, 0); // 10h00

  const fromAlgiersDeparture = new Date(departureDate);
  fromAlgiersDeparture.setHours(14, 30, 0, 0); // 14h30

  const fromAlgiersArrival = new Date(departureDate);
  fromAlgiersArrival.setHours(22, 0, 0, 0); // 22h00

  // Prix basés sur la distance et les taux de change
  const basePrice = calculateBasePrice(params.origin, params.destination);
  const toAlgiersPrice = Math.round(basePrice * 0.4 * 100) / 100; // 40% du prix total
  const fromAlgiersPrice = Math.round(basePrice * 0.6 * 100) / 100; // 60% du prix total
  const totalPrice = toAlgiersPrice + fromAlgiersPrice;

  return {
    id: `djazair-simple-${Date.now()}`,
    airline: "DjazAir",
    airlineCode: "DJZ",
    flightNumber: "DJZ001",
    origin: params.origin,
    destination: params.destination,
    departureTime: toAlgiersDeparture.toISOString(),
    arrivalTime: fromAlgiersArrival.toISOString(),
    duration: "12h 00m",
    stops: 1,
    price: {
      amount: totalPrice,
      currency: "EUR",
      originalDZD: Math.round(totalPrice * 260),
    },
    aircraft: "Airbus A320",
    cabinClass: params.cabinClass || "Economy",
    provider: "DjazAir",
    direct: false,
    viaAlgiers: true,
    baggage: {
      included: true,
      weight: "23kg",
      details: "Bagage en soute inclus",
    },
    connection: {
      airport: "ALG",
      duration: "4h 30m",
      flightNumber: "DJZ002",
    },
    searchSource: "djazair",
    segments: {
      toAlgiers: {
        flight: "DJZ001",
        price: toAlgiersPrice,
        currency: "EUR",
        airline: "DjazAir",
        departure: toAlgiersDeparture.toISOString(),
        arrival: new Date(toAlgiersDeparture.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2h
      },
      fromAlgiers: {
        flight: "DJZ002",
        price: fromAlgiersPrice,
        currency: "EUR",
        airline: "DjazAir",
        departure: fromAlgiersDeparture.toISOString(),
        arrival: fromAlgiersArrival.toISOString(),
      },
    },
    // Calcul des économies par rapport à un prix de référence
    savings: {
      amount: Math.round((basePrice * 1.2 - totalPrice) * 100) / 100, // 20% de marge
      percentage: Math.round(((basePrice * 1.2 - totalPrice) / (basePrice * 1.2)) * 100),
    },
  };
}

/**
 * Calcule un prix de base réaliste basé sur la distance
 */
function calculateBasePrice(origin: string, destination: string): number {
  // Distances approximatives en km pour les routes principales
  const distances: { [key: string]: number } = {
    "CDG-DXB": 5200,
    "CDG-JFK": 5800,
    "CDG-NRT": 9700,
    "CDG-SYD": 17000,
    "CDG-BKK": 9500,
    "CDG-SIN": 10700,
    "CDG-HKG": 9600,
    "CDG-BOM": 6800,
    "CDG-DEL": 6500,
    "CDG-PEK": 8200,
    "CDG-SHA": 8900,
    "CDG-IST": 2200,
    "CDG-CAI": 3200,
    "CDG-BEY": 2800,
    "CDG-AMM": 3000,
    "CDG-RUH": 4200,
    "CDG-DOH": 4500,
    "CDG-AUH": 4800,
  };

  const route = `${origin}-${destination}`;
  const distance = distances[route] || 5000; // Distance par défaut

  // Prix de base: ~0.08€/km pour l'économie
  return Math.round(distance * 0.08 * 100) / 100;
}
