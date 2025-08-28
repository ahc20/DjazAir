import { FlightSearchParams } from "../scrapers/types";

export interface GoogleFlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
  aircraft?: string;
  cabinClass: string;
  provider: string;
  direct: boolean;
  baggage: {
    included: boolean;
    weight?: string;
    details?: string;
  };
}

export class GoogleFlightsAPI {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/qpxExpress/v1/trips/search";

  constructor() {
    this.apiKey = process.env.GOOGLE_FLIGHTS_API_KEY || "";
  }

  /**
   * Vérifie si l'API est disponible
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Recherche de vols via Google Flights API
   */
  async searchFlights(
    params: FlightSearchParams
  ): Promise<GoogleFlightResult[]> {
    if (!this.isAvailable()) {
      throw new Error("Google Flights API non configurée");
    }

    try {
      console.log(
        `🔍 Recherche Google Flights: ${params.origin} → ${params.destination}`
      );

      const requestBody = this.buildRequestBody(params);

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Erreur Google Flights API: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.parseGoogleFlightsResponse(data, params);
    } catch (error) {
      console.error("❌ Erreur Google Flights API:", error);
      throw new Error(`Erreur de recherche Google Flights: ${error}`);
    }
  }

  /**
   * Construit le corps de la requête pour l'API Google Flights
   */
  private buildRequestBody(params: FlightSearchParams) {
    return {
      request: {
        passengers: {
          adultCount: params.passengers || 1,
          childCount: 0,
          infantCount: 0,
        },
        slice: [
          {
            origin: params.origin,
            destination: params.destination,
            date: params.departureDate,
            preferredCabin: this.mapCabinClass(params.cabinClass || "Economy"),
          },
        ],
        solutions: 20, // Nombre de solutions à retourner
        refundable: false,
        maxPrice: "USD10000", // Prix maximum en USD
      },
    };
  }

  /**
   * Mappe les classes de cabine vers le format Google Flights
   */
  private mapCabinClass(cabinClass: string): string {
    const mapping: Record<string, string> = {
      Economy: "COACH",
      "Premium Economy": "PREMIUM_COACH",
      Business: "BUSINESS",
      First: "FIRST",
    };
    return mapping[cabinClass] || "COACH";
  }

  /**
   * Parse la réponse de l'API Google Flights
   */
  private parseGoogleFlightsResponse(
    data: any,
    params: FlightSearchParams
  ): GoogleFlightResult[] {
    const results: GoogleFlightResult[] = [];

    try {
      if (!data.tripOption || !Array.isArray(data.tripOption)) {
        console.warn("Aucun résultat trouvé dans la réponse Google Flights");
        return results;
      }

      data.tripOption.forEach((trip: any, index: number) => {
        try {
          const result = this.parseTripOption(trip, params, index);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.warn(`Erreur parsing option ${index}:`, error);
        }
      });
    } catch (error) {
      console.error("Erreur parsing réponse Google Flights:", error);
    }

    return results;
  }

  /**
   * Parse une option de vol individuelle
   */
  private parseTripOption(
    trip: any,
    params: FlightSearchParams,
    index: number
  ): GoogleFlightResult | null {
    try {
      if (!trip.slice || !trip.slice[0] || !trip.pricing) {
        return null;
      }

      const slice = trip.slice[0];
      const pricing = trip.pricing[0];
      const segment = slice.segment[0];

      // Extraction des informations de base
      const airline = segment.flight.carrier;
      const flightNumber = `${airline}${segment.flight.number}`;
      const origin = segment.leg[0].origin;
      const destination = segment.leg[0].destination;
      const departureTime = segment.leg[0].departureTime;
      const arrivalTime = segment.leg[0].arrivalTime;

      // Calcul de la durée
      const duration = this.calculateDuration(departureTime, arrivalTime);

      // Calcul du nombre d'escales
      const stops = this.calculateStops(slice.segment);

      // Prix
      const price = this.extractPrice(pricing);

      // Bagages (par défaut inclus pour Google Flights)
      const baggage = {
        included: true,
        weight: "23kg",
        details: "Bagage en soute inclus",
      };

      // Type d'avion
      const aircraft = segment.leg[0].aircraft || "Non spécifié";

      return {
        id: `google-${index}`,
        airline: this.getAirlineName(airline),
        airlineCode: airline,
        flightNumber,
        origin,
        destination,
        departureTime,
        arrivalTime,
        duration,
        stops,
        price,
        aircraft,
        cabinClass: params.cabinClass || "Economy",
        provider: "Google Flights",
        direct: stops === 0,
        baggage,
      };
    } catch (error) {
      console.warn(`Erreur parsing option ${index}:`, error);
      return null;
    }
  }

  /**
   * Calcule la durée du vol
   */
  private calculateDuration(
    departureTime: string,
    arrivalTime: string
  ): string {
    try {
      const departure = new Date(departureTime);
      const arrival = new Date(arrivalTime);
      const diffMs = arrival.getTime() - departure.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return `${diffHours}h ${diffMinutes}m`;
    } catch {
      return "Durée non disponible";
    }
  }

  /**
   * Calcule le nombre d'escales
   */
  private calculateStops(segments: any[]): number {
    if (!segments || segments.length <= 1) {
      return 0;
    }
    return segments.length - 1;
  }

  /**
   * Extrait le prix de la réponse
   */
  private extractPrice(pricing: any): { amount: number; currency: string } {
    try {
      const saleTotal = pricing.saleTotal;
      const currency = saleTotal.substring(0, 3);
      const amount = parseFloat(saleTotal.substring(3));

      return {
        amount: Math.round(amount * 100) / 100,
        currency,
      };
    } catch {
      return {
        amount: 0,
        currency: "EUR",
      };
    }
  }

  /**
   * Obtient le nom complet de la compagnie aérienne
   */
  private getAirlineName(code: string): string {
    const airlines: Record<string, string> = {
      AF: "Air France",
      EK: "Emirates",
      TK: "Turkish Airlines",
      QR: "Qatar Airways",
      ET: "Ethiopian Airlines",
      MS: "EgyptAir",
      RJ: "Royal Jordanian",
      ME: "Middle East Airlines",
      AH: "Air Algérie",
      AT: "Royal Air Maroc",
      TU: "Tunisair",
      LY: "El Al",
      SU: "Aeroflot",
      LH: "Lufthansa",
      BA: "British Airways",
      IB: "Iberia",
      AZ: "ITA Airways",
      KL: "KLM",
      LX: "Swiss",
      OS: "Austrian Airlines",
    };

    return airlines[code] || code;
  }

  /**
   * Recherche de vols avec fallback vers des données simulées
   */
  async searchFlightsWithFallback(
    params: FlightSearchParams
  ): Promise<GoogleFlightResult[]> {
    try {
      return await this.searchFlights(params);
    } catch (error) {
      console.warn(
        "Google Flights API échouée, utilisation du fallback:",
        error
      );
      return this.getFallbackResults(params);
    }
  }

  /**
   * Résultats de fallback (simulation) quand l'API échoue
   */
  public getFallbackResults(params: FlightSearchParams): GoogleFlightResult[] {
    console.log("🔄 Utilisation des résultats de fallback Google Flights");

    const basePrices: Record<string, number> = {
      "CDG-DXB": 354,
      "CDG-IST": 280,
      "CDG-CAI": 350,
      "CDG-BEY": 380,
      "CDG-AMM": 420,
      "ORY-DXB": 380,
      "ORY-IST": 300,
      "ORY-CAI": 370,
      "ORY-BEY": 400,
      "ORY-AMM": 440,
    };

    const route = `${params.origin}-${params.destination}`;
    const basePrice = basePrices[route] || 400;

    return [
      {
        id: "google-fallback-1",
        airline: "Air France",
        airlineCode: "AF",
        flightNumber: "AF1001",
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T08:00:00`,
        arrivalTime: `${params.departureDate}T14:30:00`,
        duration: "6h 30m",
        stops: 0,
        price: {
          amount: basePrice,
          currency: "EUR",
        },
        aircraft: "Airbus A350-900",
        cabinClass: params.cabinClass || "Economy",
        provider: "Google Flights (Fallback)",
        direct: true,
        baggage: {
          included: true,
          weight: "23kg",
          details: "Bagage en soute inclus",
        },
      },
      {
        id: "google-fallback-2",
        airline: "Emirates",
        airlineCode: "EK",
        flightNumber: "EK2001",
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T10:30:00`,
        arrivalTime: `${params.departureDate}T17:15:00`,
        duration: "6h 45m",
        stops: 0,
        price: {
          amount: basePrice * 0.95,
          currency: "EUR",
        },
        aircraft: "Boeing 777-300ER",
        cabinClass: params.cabinClass || "Economy",
        provider: "Google Flights (Fallback)",
        direct: true,
        baggage: {
          included: true,
          weight: "30kg",
          details: "Bagage en soute + bagage à main inclus",
        },
      },
    ];
  }
}
