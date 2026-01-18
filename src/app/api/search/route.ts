import { NextRequest, NextResponse } from "next/server";
import { searchFormSchema } from "@/lib/zod";
import { AmadeusAPI } from "@/server/flightSearch/amadeusAPI";
import { isValidAirportCode, getAirportDisplayName } from "@/data/airports";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = searchFormSchema.parse(body);

    // Validation des codes aéroports
    if (!isValidAirportCode(validatedData.origin)) {
      console.log(`❌ Code aéroport origine invalide: ${validatedData.origin}`);
      return NextResponse.json({
        success: false,
        error: `Code aéroport origine invalide: ${validatedData.origin}. Utilisez un code IATA valide (ex: CDG, JFK, LHR).`,
        data: []
      });
    }

    if (!isValidAirportCode(validatedData.destination)) {
      console.log(`❌ Code aéroport destination invalide: ${validatedData.destination}`);
      return NextResponse.json({
        success: false,
        error: `Code aéroport destination invalide: ${validatedData.destination}. Utilisez un code IATA valide (ex: PEK, DXB, NRT).`,
        data: []
      });
    }

    console.log("🔍 Recherche de vols demandée:", validatedData);
    console.log(`🌍 Origine: ${getAirportDisplayName(validatedData.origin)}`);
    console.log(`🌍 Destination: ${getAirportDisplayName(validatedData.destination)}`);

    // Utiliser directement l'API Amadeus au lieu du UnifiedSearch
    const amadeusAPI = new AmadeusAPI();

    try {
      const flights = await amadeusAPI.searchFlights({
        origin: validatedData.origin,
        destination: validatedData.destination,
        departureDate: validatedData.departDate,
        returnDate: validatedData.returnDate ?? undefined,
        passengers: validatedData.adults,
        cabinClass: validatedData.cabin,
        currency: validatedData.currency,
      });

      console.log(`✅ Vols trouvés via Amadeus: ${flights.length}`);

      // DÉDUPLICATION: Filtrer les doublons exacts (mêmes segments, mêmes horaires, même prix)
      const uniqueFlights = flights.reduce((acc: any[], current) => {
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

      console.log(`✅ Vols uniques après déduplication: ${uniqueFlights.length}`);

      // Convertir le format Amadeus en format FlightResult
      const directFlights = uniqueFlights.map((flight, index) => ({
        id: `amadeus-${index}`,
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        price: {
          amount: flight.price.amount,
          currency: flight.price.currency
        },
        stops: flight.stops || 0,
        segments: flight.segments
      }));

      return NextResponse.json({
        success: true,
        data: {
          directFlights,
          viaAlgiersFlights: [] // Pas de vols via Alger pour l'instant
        },
        message: `Recherche de vols terminée avec succès: ${directFlights.length} vols trouvés`,
      });
    } catch (amadeusError) {
      console.error("❌ Erreur Amadeus:", amadeusError);

      return NextResponse.json({
        success: false,
        error: `Erreur API Amadeus: ${amadeusError instanceof Error ? amadeusError.message : 'Erreur inconnue'}`,
        data: {
          directFlights: [],
          viaAlgiersFlights: []
        },
        message: "Impossible de récupérer les vols depuis l'API Amadeus",
      }, { status: 503 });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la recherche:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          message: "Erreur lors de la recherche de vols",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur inconnue",
        message: "Erreur lors de la recherche de vols",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const date = searchParams.get("date");

    if (!origin || !destination || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres manquants",
          message: "Les paramètres origin, destination et date sont requis",
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Recherche GET: ${origin} → ${destination} le ${date}`);

    // Utiliser directement l'API Amadeus
    const amadeusAPI = new AmadeusAPI();

    try {
      const flights = await amadeusAPI.searchFlights({
        origin,
        destination,
        departureDate: date,
        passengers: 1,
        cabinClass: "ECONOMY",
        currency: "EUR",
      });

      const directFlights = flights.map((flight, index) => ({
        id: `amadeus-${index}`,
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        price: {
          amount: flight.price.amount,
          currency: flight.price.currency
        },
        stops: flight.stops || 0
      }));

      return NextResponse.json({
        success: true,
        data: {
          directFlights,
          viaAlgiersFlights: []
        },
        message: `Recherche de vols terminée avec succès: ${directFlights.length} vols trouvés`,
      });
    } catch (amadeusError) {
      console.error("❌ Erreur Amadeus:", amadeusError);

      return NextResponse.json({
        success: false,
        error: `Erreur API Amadeus: ${amadeusError instanceof Error ? amadeusError.message : 'Erreur inconnue'}`,
        data: {
          directFlights: [],
          viaAlgiersFlights: []
        },
        message: "Impossible de récupérer les vols depuis l'API Amadeus",
      }, { status: 503 });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la recherche GET:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la recherche",
        message: "Impossible de récupérer les vols",
      },
      { status: 500 }
    );
  }
}
