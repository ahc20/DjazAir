import { NextResponse } from "next/server";
import { z } from "zod";
import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";

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
    console.log("📥 DjazAir: Données reçues:", body);

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
      `🚀 DjazAir: Calcul pour ${params.origin} → ${params.destination}`
    );

    const amadeusAPI = new AmadeusAPI();

    // Recherche simple : vol vers Alger
    const toAlgiersFlights = await amadeusAPI.searchFlights({
      ...params,
      destination: "ALG",
    });

    // Recherche simple : vol depuis Alger
    const fromAlgiersFlights = await amadeusAPI.searchFlights({
      ...params,
      origin: "ALG",
    });

    if (toAlgiersFlights.length === 0 || fromAlgiersFlights.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Segments Alger non disponibles",
        },
        { status: 404 }
      );
    }

    // Prendre le moins cher de chaque segment
    const bestToAlgiers = toAlgiersFlights.reduce((best, current) =>
      current.price.amount < best.price.amount ? current : best
    );

    const bestFromAlgiers = fromAlgiersFlights.reduce((best, current) =>
      current.price.amount < best.price.amount ? current : best
    );

    // Calcul DjazAir simple
    const totalPriceEUR =
      bestToAlgiers.price.amount + bestFromAlgiers.price.amount;
    const totalPriceDZD = totalPriceEUR * 260; // Taux parallèle
    const totalPriceEURConverted = totalPriceDZD / 260; // Reconversion

    const result = {
      success: true,
      data: {
        origin: params.origin,
        destination: params.destination,
        viaAlgiers: true,
        segments: {
          toAlgiers: {
            flight: bestToAlgiers.flightNumber,
            price: bestToAlgiers.price.amount,
            currency: bestToAlgiers.price.currency,
          },
          fromAlgiers: {
            flight: bestFromAlgiers.flightNumber,
            price: bestFromAlgiers.price.amount,
            currency: bestFromAlgiers.price.currency,
          },
        },
        totalPriceEUR: totalPriceEUR,
        totalPriceDZD: totalPriceDZD,
        totalPriceEURConverted: Math.round(totalPriceEURConverted * 100) / 100,
        exchangeRate: 260,
        message: `Prix total: ${totalPriceEUR}€ + ${totalPriceDZD.toLocaleString()} DZD (taux parallèle)`,
      },
    };

    console.log("✅ DjazAir: Calcul terminé:", result.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Erreur DjazAir:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur de calcul DjazAir",
      },
      { status: 500 }
    );
  }
}
