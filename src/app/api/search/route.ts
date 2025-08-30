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
        returnDate: validatedData.returnDate,
        passengers: validatedData.adults,
        cabinClass: validatedData.cabin,
        currency: validatedData.currency,
      });

      console.log(`✅ Vols trouvés via Amadeus: ${flights.length}`);

      // Convertir le format Amadeus en format FlightResult
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
          viaAlgiersFlights: [] // Pas de vols via Alger pour l'instant
        },
        message: `Recherche de vols terminée avec succès: ${directFlights.length} vols trouvés`,
      });
    } catch (amadeusError) {
      console.error("❌ Erreur Amadeus:", amadeusError);
      
      // Retourner des vols simulés en cas d'erreur Amadeus
      const simulatedFlights = [
        {
          id: "simulated-1",
          origin: validatedData.origin,
          destination: validatedData.destination,
          departureTime: new Date(validatedData.departDate + "T10:00:00").toISOString(),
          arrivalTime: new Date(validatedData.departDate + "T16:00:00").toISOString(),
          duration: "6h 00m",
          airline: "Air France",
          flightNumber: "AF123",
          price: {
            amount: 386.12,
            currency: "EUR"
          },
          stops: 0
        },
        {
          id: "simulated-2",
          origin: validatedData.origin,
          destination: validatedData.destination,
          departureTime: new Date(validatedData.departDate + "T12:00:00").toISOString(),
          arrivalTime: new Date(validatedData.departDate + "T01:10:00").toISOString(),
          duration: "13h 10m",
          airline: "Saudia",
          flightNumber: "SV144",
          price: {
            amount: 386.12,
            currency: "EUR"
          },
          stops: 1
        },
        {
          id: "simulated-3",
          origin: validatedData.origin,
          destination: validatedData.destination,
          departureTime: new Date(validatedData.departDate + "T15:55:00").toISOString(),
          arrivalTime: new Date(validatedData.departDate + "T04:35:00").toISOString(),
          duration: "12h 40m",
          airline: "Saudia",
          flightNumber: "SV126",
          price: {
            amount: 386.12,
            currency: "EUR"
          },
          stops: 1
        },
        {
          id: "simulated-4",
          origin: validatedData.origin,
          destination: validatedData.destination,
          departureTime: new Date(validatedData.departDate + "T08:30:00").toISOString(),
          arrivalTime: new Date(validatedData.departDate + "T18:45:00").toISOString(),
          duration: "10h 15m",
          airline: "Emirates",
          flightNumber: "EK071",
          price: {
            amount: 412.50,
            currency: "EUR"
          },
          stops: 0
        },
        {
          id: "simulated-5",
          origin: validatedData.origin,
          destination: validatedData.destination,
          departureTime: new Date(validatedData.departDate + "T22:15:00").toISOString(),
          arrivalTime: new Date(validatedData.departDate + "T08:30:00").toISOString(),
          duration: "10h 15m",
          airline: "Qatar Airways",
          flightNumber: "QR039",
          price: {
            amount: 398.75,
            currency: "EUR"
          },
          stops: 1
        }
      ];

      return NextResponse.json({
        success: true,
        data: {
          directFlights: simulatedFlights,
          viaAlgiersFlights: []
        },
        message: `Vols simulés retournés (erreur Amadeus): ${simulatedFlights.length} vols`,
      });
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
      
      // Retourner des vols simulés en cas d'erreur
      const simulatedFlights = [
        {
          id: "simulated-1",
          origin,
          destination,
          departureTime: new Date(date + "T10:00:00").toISOString(),
          arrivalTime: new Date(date + "T16:00:00").toISOString(),
          duration: "6h 00m",
          airline: "Air France",
          flightNumber: "AF123",
          price: {
            amount: 450,
            currency: "EUR"
          },
          stops: 0
        }
      ];

      return NextResponse.json({
        success: true,
        data: {
          directFlights: simulatedFlights,
          viaAlgiersFlights: []
        },
        message: `Vols simulés retournés (erreur Amadeus): ${simulatedFlights.length} vols`,
      });
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
