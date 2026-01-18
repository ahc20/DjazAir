import { FlightSearchParams } from "../scrapers/types";

export interface AmadeusFlightResult {
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
  segments: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    airline: string;
    flightNumber: string;
    duration: string;
  }[];
}

export class AmadeusAPI {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = "https://test.api.amadeus.com/v2";
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID || "";
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || "";
  }

  /**
   * Vérifie si l'API est disponible
   */
  isAvailable(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Obtient un token d'accès Amadeus
   */
  private async getAccessToken(): Promise<string> {
    // Vérifier si le token actuel est encore valide
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log("🔑 Obtention du token Amadeus...");

      const response = await fetch(
        "https://test.api.amadeus.com/v1/security/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: this.clientId,
            client_secret: this.clientSecret,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur authentification Amadeus: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // 1 minute de marge

      console.log("✅ Token Amadeus obtenu avec succès");
      return this.accessToken!;
    } catch (error) {
      console.error("❌ Erreur obtention token Amadeus:", error);
      throw new Error(`Erreur d'authentification Amadeus: ${error}`);
    }
  }

  /**
   * Recherche de vols via Amadeus API
   */
  async searchFlights(
    params: FlightSearchParams
  ): Promise<AmadeusFlightResult[]> {
    if (!this.isAvailable()) {
      throw new Error("Amadeus API non configurée");
    }

    try {
      console.log(
        `🔍 Recherche Amadeus: ${params.origin} → ${params.destination}`
      );

      const token = await this.getAccessToken();

      // Recherche de vols
      const flightOffers = await this.searchFlightOffers(params, token);

      // Recherche des prix
      const pricing = await this.searchPricing(flightOffers, token);

      return this.parseFlightResults(flightOffers, pricing, params);
    } catch (error) {
      console.error("❌ Erreur Amadeus API:", error);
      throw new Error(`Erreur de recherche Amadeus: ${error}`);
    }
  }

  /**
   * Recherche des offres de vols
   */
  private async searchFlightOffers(
    params: FlightSearchParams,
    token: string
  ): Promise<any[]> {
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: (params.passengers || 1).toString(),
      currencyCode: "EUR",
      max: "20",
      nonStop: "false",
    });

    if (params.returnDate) {
      searchParams.append("returnDate", params.returnDate);
    }

    const response = await fetch(
      `${this.baseUrl}/shopping/flight-offers?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erreur recherche vols Amadeus: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Recherche des prix
   */
  private async searchPricing(
    flightOffers: any[],
    token: string
  ): Promise<any[]> {
    if (flightOffers.length === 0) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/shopping/flight-offers/pricing`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              type: "flight-offers-pricing",
              flightOffers: flightOffers.slice(0, 5), // Limiter à 5 pour éviter les timeouts
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn("⚠️ Erreur pricing Amadeus, utilisation des prix de base");
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn(
        "⚠️ Erreur pricing Amadeus, utilisation des prix de base:",
        error
      );
      return [];
    }
  }

  /**
   * Parse les résultats de vols
   */
  private parseFlightResults(
    flightOffers: any[],
    pricing: any[],
    params: FlightSearchParams
  ): AmadeusFlightResult[] {
    const results: AmadeusFlightResult[] = [];

    flightOffers.forEach((offer, index) => {
      try {
        const result = this.parseFlightOffer(offer, pricing[index], params);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn(`Erreur parsing offre ${index}:`, error);
      }
    });

    return results;
  }

  /**
   * Parse une offre de vol individuelle
   */
  private parseFlightOffer(
    offer: any,
    pricing: any,
    params: FlightSearchParams
  ): AmadeusFlightResult | null {
    try {
      if (
        !offer.itineraries ||
        !offer.itineraries[0] ||
        !offer.itineraries[0].segments
      ) {
        return null;
      }

      const segments = offer.itineraries[0].segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      // Informations de base
      const airline = firstSegment.carrierCode;
      const flightNumber = `${airline}${firstSegment.number}`;
      const origin = firstSegment.departure.iataCode;
      const destination = lastSegment.arrival.iataCode;
      const departureTime = firstSegment.departure.at;
      const arrivalTime = lastSegment.arrival.at;

      // Calcul de la durée
      const duration = this.calculateDuration(departureTime, arrivalTime);

      // Calcul du nombre d'escales
      const stops = segments.length - 1;

      // Prix
      const price = this.extractPrice(offer, pricing);

      // Bagages
      const baggage = this.extractBaggage(offer);

      // Type d'avion
      const aircraft = firstSegment.aircraft?.code || "Non spécifié";

      return {
        id: `amadeus-${offer.id}`,
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
        provider: "Amadeus",
        direct: stops === 0,
        baggage,
        segments: segments.map((seg: any) => ({
          origin: seg.departure.iataCode,
          destination: seg.arrival.iataCode,
          departureTime: seg.departure.at,
          arrivalTime: seg.arrival.at,
          airline: this.getAirlineName(seg.carrierCode),
          flightNumber: `${seg.carrierCode}${seg.number}`,
          duration: seg.duration.replace("PT", "").replace("H", "h ").replace("M", "m")
        }))
      };
    } catch (error) {
      console.warn("Erreur parsing offre Amadeus:", error);
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
   * Extrait le prix
   */
  private extractPrice(
    offer: any,
    pricing: any
  ): { amount: number; currency: string } {
    try {
      // Essayer d'abord le pricing
      if (pricing && pricing.pricingOptions && pricing.pricingOptions[0]) {
        const price = pricing.pricingOptions[0].price;
        return {
          amount: Math.round(parseFloat(price.total) * 100) / 100,
          currency: price.currency,
        };
      }

      // Fallback sur le prix de base
      if (offer.price) {
        return {
          amount: Math.round(parseFloat(offer.price.total) * 100) / 100,
          currency: offer.price.currency || "EUR",
        };
      }

      return {
        amount: 0,
        currency: "EUR",
      };
    } catch {
      return {
        amount: 0,
        currency: "EUR",
      };
    }
  }

  /**
   * Extrait les informations de bagage
   */
  private extractBaggage(offer: any): {
    included: boolean;
    weight?: string;
    details?: string;
  } {
    try {
      if (offer.travelerPricings && offer.travelerPricings[0]) {
        const baggage =
          offer.travelerPricings[0].fareDetailsBySegment[0]
            ?.includedCheckedBags;
        if (baggage) {
          return {
            included: true,
            weight: `${baggage.weight}kg`,
            details: "Bagage en soute inclus",
          };
        }
      }

      return {
        included: false,
        details: "Bagage non inclus",
      };
    } catch {
      return {
        included: false,
        details: "Information non disponible",
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

}
