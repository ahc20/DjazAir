import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schéma de validation
const djazairFlightsSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().min(1).max(9).default(1),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  dzdEurRate: z.number().min(1).max(1000).default(260),
});

// Types pour la réponse
interface DjazAirFlight {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  totalDuration: string;
  totalPrice: {
    amount: number;
    currency: string;
    originalDZD?: number;
  };
  segments: {
    toAlgiers: {
      origin: string;
      destination: string;
      departureTime: string;
      arrivalTime: string;
      duration: string;
      airline: string;
      flightNumber: string;
      price: number;
      currency: string;
    };
    fromAlgiers: {
      origin: string;
      destination: string;
      departureTime: string;
      arrivalTime: string;
      duration: string;
      airline: string;
      flightNumber: string;
      price: number;
      currency: string;
    };
  };
  connection: {
    airport: string;
    duration: string;
    type: string;
  };
  savings?: {
    amount: number;
    percentage: number;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 DjazAir Flights - Paramètres reçus:", body);

    // Validation des paramètres
    const validationResult = djazairFlightsSchema.safeParse(body);
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

    const params = validationResult.data;
    
    // Génération des vols DjazAir avec escale en Algérie
    const djazairFlights = await generateDjazAirFlights(params);
    
    if (djazairFlights.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun vol avec escale en Algérie trouvé",
        },
        { status: 404 }
      );
    }

    console.log("✅ Vols DjazAir générés:", djazairFlights.length);
    
    return NextResponse.json({
      success: true,
      data: djazairFlights,
      meta: {
        total: djazairFlights.length,
        origin: params.origin,
        destination: params.destination,
        via: "ALG",
        dzdEurRate: params.dzdEurRate,
      },
    });

  } catch (error) {
    console.error("❌ Erreur DjazAir Flights:", error);
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
 * Génère des vols DjazAir avec escale en Algérie
 */
async function generateDjazAirFlights(params: z.infer<typeof djazairFlightsSchema>): Promise<DjazAirFlight[]> {
  const flights: DjazAirFlight[] = [];
  
  try {
    // Simulation de vols réels avec escale en Algérie
    // En production, cela serait remplacé par des appels à Amadeus ou d'autres APIs
    
    // Option 1: Vol via Air Algérie
    const flight1: DjazAirFlight = {
      id: `djazair-ah-${Date.now()}-1`,
      origin: params.origin,
      destination: params.destination,
      departureTime: `${params.departureDate}T08:00:00Z`,
      arrivalTime: `${params.departureDate}T23:30:00Z`,
      totalDuration: "15h 30m",
      totalPrice: {
        amount: 420,
        currency: "EUR",
        originalDZD: 109200,
      },
      segments: {
        toAlgiers: {
          origin: params.origin,
          destination: "ALG",
          departureTime: `${params.departureDate}T08:00:00Z`,
          arrivalTime: `${params.departureDate}T11:30:00Z`,
          duration: "3h 30m",
          airline: "Air Algérie",
          flightNumber: "AH1001",
          price: 180,
          currency: "EUR",
        },
        fromAlgiers: {
          origin: "ALG",
          destination: params.destination,
          departureTime: `${params.departureDate}T16:00:00Z`,
          arrivalTime: `${params.departureDate}T23:30:00Z`,
          duration: "7h 30m",
          airline: "Air Algérie",
          flightNumber: "AH2002",
          price: 240,
          currency: "DZD",
        },
      },
      connection: {
        airport: "ALG",
        duration: "4h 30m",
        type: "Escale à Alger",
      },
      savings: {
        amount: 80,
        percentage: 16,
      },
    };

    // Option 2: Vol via Air France + Emirates
    const flight2: DjazAirFlight = {
      id: `djazair-af-ek-${Date.now()}-2`,
      origin: params.origin,
      destination: params.destination,
      departureTime: `${params.departureDate}T10:00:00Z`,
      arrivalTime: `${params.departureDate}T22:00:00Z`,
      totalDuration: "12h 00m",
      totalPrice: {
        amount: 480,
        currency: "EUR",
        originalDZD: 124800,
      },
      segments: {
        toAlgiers: {
          origin: params.origin,
          destination: "ALG",
          departureTime: `${params.departureDate}T10:00:00Z`,
          arrivalTime: `${params.departureDate}T13:00:00Z`,
          duration: "3h 00m",
          airline: "Air France",
          flightNumber: "AF1001",
          price: 220,
          currency: "EUR",
        },
        fromAlgiers: {
          origin: "ALG",
          destination: params.destination,
          departureTime: `${params.departureDate}T15:00:00Z`,
          arrivalTime: `${params.departureDate}T22:00:00Z`,
          duration: "7h 00m",
          airline: "Emirates",
          flightNumber: "EK2002",
          price: 260,
          currency: "DZD",
        },
      },
      connection: {
        airport: "ALG",
        duration: "2h 00m",
        type: "Escale courte à Alger",
      },
      savings: {
        amount: 20,
        percentage: 4,
      },
    };

    // Option 3: Vol via Turkish Airlines
    const flight3: DjazAirFlight = {
      id: `djazair-tk-${Date.now()}-3`,
      origin: params.origin,
      destination: params.destination,
      departureTime: `${params.departureDate}T12:00:00Z`,
      arrivalTime: `${params.departureDate}T01:00:00Z`,
      totalDuration: "13h 00m",
      totalPrice: {
        amount: 390,
        currency: "EUR",
        originalDZD: 101400,
      },
      segments: {
        toAlgiers: {
          origin: params.origin,
          destination: "ALG",
          departureTime: `${params.departureDate}T12:00:00Z`,
          arrivalTime: `${params.departureDate}T15:30:00Z`,
          duration: "3h 30m",
          airline: "Turkish Airlines",
          flightNumber: "TK1001",
          price: 160,
          currency: "EUR",
        },
        fromAlgiers: {
          origin: "ALG",
          destination: params.destination,
          departureTime: `${params.departureDate}T18:00:00Z`,
          arrivalTime: `${params.departureDate}T01:00:00Z`,
          duration: "7h 00m",
          airline: "Turkish Airlines",
          flightNumber: "TK2002",
          price: 230,
          currency: "DZD",
        },
      },
      connection: {
        airport: "ALG",
        duration: "2h 30m",
        type: "Escale optimisée à Alger",
      },
      savings: {
        amount: 110,
        percentage: 22,
      },
    };

    flights.push(flight1, flight2, flight3);

    // Ajuster les prix selon la classe de cabine
    flights.forEach(flight => {
      if (params.cabin === "BUSINESS") {
        flight.totalPrice.amount = Math.round(flight.totalPrice.amount * 2.5);
        flight.segments.toAlgiers.price = Math.round(flight.segments.toAlgiers.price * 2.5);
        flight.segments.fromAlgiers.price = Math.round(flight.segments.fromAlgiers.price * 2.5);
      } else if (params.cabin === "FIRST") {
        flight.totalPrice.amount = Math.round(flight.totalPrice.amount * 4);
        flight.segments.toAlgiers.price = Math.round(flight.segments.toAlgiers.price * 4);
        flight.segments.fromAlgiers.price = Math.round(flight.segments.fromAlgiers.price * 4);
      }
    });

    // Ajuster selon le nombre de passagers
    if (params.adults > 1) {
      flights.forEach(flight => {
        flight.totalPrice.amount = Math.round(flight.totalPrice.amount * params.adults);
        flight.segments.toAlgiers.price = Math.round(flight.segments.toAlgiers.price * params.adults);
        flight.segments.fromAlgiers.price = Math.round(flight.segments.fromAlgiers.price * params.adults);
      });
    }

    return flights;

  } catch (error) {
    console.error("❌ Erreur génération vols DjazAir:", error);
    return [];
  }
}
