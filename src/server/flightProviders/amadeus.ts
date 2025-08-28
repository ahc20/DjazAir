import type {
  FlightProvider,
  FlightSearchParams,
  FlightSearchResult,
  FlightOption,
  AmadeusToken,
  AmadeusFlightOffer,
} from "./types";

export class AmadeusProvider implements FlightProvider {
  private token: AmadeusToken | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;

  constructor() {
    this.clientId = process.env.AMAD_CLIENT_ID || "";
    this.clientSecret = process.env.AMAD_CLIENT_SECRET || "";
    this.baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://api.amadeus.com"
        : "https://test.api.amadeus.com";
  }

  getProviderName(): string {
    return "Amadeus";
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.clientId && this.clientSecret);
  }

  private async getAccessToken(): Promise<string> {
    // Vérifier si le token existe et n'est pas expiré
    if (this.token && Date.now() < this.token.expires_at) {
      return this.token!.access_token;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Erreur d'authentification Amadeus: ${response.status}`
        );
      }

      const tokenData = await response.json();
      this.token = {
        ...tokenData,
        expires_at: Date.now() + tokenData.expires_in * 1000,
      };

      return this.token!.access_token;
    } catch (error) {
      console.error("Erreur lors de l'obtention du token Amadeus:", error);
      throw new Error("Impossible d'obtenir l'accès à l'API Amadeus");
    }
  }

  async searchRoundTrip(
    params: FlightSearchParams
  ): Promise<FlightSearchResult> {
    if (!this.isAvailable()) {
      throw new Error("Fournisseur Amadeus non configuré");
    }

    try {
      const token = await this.getAccessToken();

      // Construire les paramètres de recherche
      const searchParams = new URLSearchParams({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departDate,
        adults: params.adults.toString(),
        currencyCode: params.currency,
        max: "50", // Limiter le nombre de résultats
      });

      if (params.returnDate) {
        searchParams.append("returnDate", params.returnDate);
      }

      if (params.children && params.children > 0) {
        searchParams.append("children", params.children.toString());
      }

      if (params.infants && params.infants > 0) {
        searchParams.append("infants", params.infants.toString());
      }

      if (params.cabin && params.cabin !== "ECONOMY") {
        searchParams.append("travelClass", params.cabin);
      }

      const response = await fetch(
        `${this.baseUrl}/v2/shopping/flight-offers?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur API Amadeus: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const offers: AmadeusFlightOffer[] = data.data || [];

      // Traiter les offres de vol
      const options: FlightOption[] = offers.map((offer) => {
        const totalDuration = offer.itineraries.reduce((total, itinerary) => {
          return (
            total +
            itinerary.segments.reduce((segTotal, segment) => {
              return segTotal + this.parseDuration(segment.duration);
            }, 0)
          );
        }, 0);

        const firstSegment = offer.itineraries[0]?.segments[0];
        const lastSegment =
          offer.itineraries[offer.itineraries.length - 1]?.segments[
            offer.itineraries[offer.itineraries.length - 1].segments.length - 1
          ];

        return {
          carrier: firstSegment?.carrierCode || "Unknown",
          priceEUR: parseFloat(offer.price.total),
          duration: this.formatDuration(totalDuration),
          departureTime: firstSegment?.departure.at,
          arrivalTime: lastSegment?.arrival.at,
          stops: this.calculateStops(offer.itineraries),
          flightNumber: firstSegment?.number,
        };
      });

      // Trouver le meilleur prix direct
      const bestDirectPrice =
        options.length > 0
          ? Math.min(...options.map((opt) => opt.priceEUR))
          : null;

      // Essayer de trouver des vols "via Alger" si ce n'est pas déjà la destination
      let bestViaPrice: number | undefined;
      if (params.destination !== "ALG" && params.origin !== "ALG") {
        try {
          const viaAlgiersResult = await this.searchViaAlgiers(params);
          bestViaPrice = viaAlgiersResult.bestDirectPriceEUR || undefined;
        } catch (error) {
          console.warn("Impossible de rechercher des vols via Alger:", error);
        }
      }

      return {
        directFlights: options,
        viaAlgiersFlights: [],
        bestDirectPriceEUR: bestDirectPrice,
        bestViaAlgiersPriceEUR: bestViaPrice,
        provider: this.getProviderName(),
      };
    } catch (error) {
      console.error("Erreur lors de la recherche Amadeus:", error);
      throw new Error(
        `Erreur de recherche Amadeus: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      );
    }
  }

  private async searchViaAlgiers(
    params: FlightSearchParams
  ): Promise<FlightSearchResult> {
    // Rechercher origin -> ALG
    const toAlgiersParams = { ...params, destination: "ALG" };
    const toAlgiersResult = await this.searchRoundTrip(toAlgiersParams);

    // Rechercher ALG -> destination
    const fromAlgiersParams = { ...params, origin: "ALG" };
    const fromAlgiersResult = await this.searchRoundTrip(fromAlgiersParams);

    // Calculer le prix total via Alger
    const toAlgiersPrice = toAlgiersResult.bestDirectPriceEUR || 0;
    const fromAlgiersPrice = fromAlgiersResult.bestDirectPriceEUR || 0;
    const totalViaPrice = toAlgiersPrice + fromAlgiersPrice;

    return {
      directFlights: [],
      viaAlgiersFlights: [],
      bestDirectPriceEUR: totalViaPrice > 0 ? totalViaPrice : null,
      bestViaAlgiersPriceEUR: totalViaPrice > 0 ? totalViaPrice : null,
      provider: this.getProviderName(),
    };
  }

  private parseDuration(duration: string): number {
    // Format Amadeus: "PT2H30M" -> minutes
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);

    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    return hours * 60 + minutes;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  private calculateStops(itineraries: any[]): number {
    let totalStops = 0;
    for (const itinerary of itineraries) {
      totalStops += Math.max(0, itinerary.segments.length - 1);
    }
    return totalStops;
  }
}
