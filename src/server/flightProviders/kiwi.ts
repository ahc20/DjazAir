import type {
  FlightProvider,
  FlightSearchParams,
  FlightSearchResult,
  FlightOption,
  KiwiFlight,
} from "./types";

export class KiwiProvider implements FlightProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.KIWI_API_KEY || "";
    this.baseUrl = "https://tequila-api.kiwi.com";
  }

  getProviderName(): string {
    return "Kiwi Tequila";
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async searchRoundTrip(
    params: FlightSearchParams
  ): Promise<FlightSearchResult> {
    if (!this.isAvailable()) {
      throw new Error("Fournisseur Kiwi non configuré");
    }

    try {
      // Construire les paramètres de recherche pour Kiwi
      const searchParams = new URLSearchParams({
        fly_from: params.origin,
        fly_to: params.destination,
        date_from: this.formatDateForKiwi(params.departDate),
        date_to: this.formatDateForKiwi(params.departDate),
        adults: params.adults.toString(),
        curr: params.currency,
        max_stopovers: "2",
        limit: "50",
        sort: "price",
        locale: "fr",
      });

      if (params.returnDate) {
        searchParams.append(
          "return_from",
          this.formatDateForKiwi(params.returnDate)
        );
        searchParams.append(
          "return_to",
          this.formatDateForKiwi(params.returnDate)
        );
      }

      if (params.children && params.children > 0) {
        searchParams.append("children", params.children.toString());
      }

      if (params.infants && params.infants > 0) {
        searchParams.append("infants", params.infants.toString());
      }

      // Kiwi ne supporte pas directement les classes de cabine, on filtre après
      const response = await fetch(
        `${this.baseUrl}/v2/search?${searchParams.toString()}`,
        {
          headers: {
            apikey: this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur API Kiwi: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const flights: KiwiFlight[] = data.data || [];

      // Traiter les vols et filtrer par classe de cabine si nécessaire
      const options: FlightOption[] = flights
        .filter((flight) => this.matchesCabinClass(flight, params.cabin))
        .map((flight) => this.convertKiwiFlightToOption(flight));

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
      console.error("Erreur lors de la recherche Kiwi:", error);
      throw new Error(
        `Erreur de recherche Kiwi: ${error instanceof Error ? error.message : "Erreur inconnue"}`
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

  private formatDateForKiwi(dateString: string): string {
    // Convertir YYYY-MM-DD en DD/MM/YYYY pour Kiwi
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private matchesCabinClass(
    flight: KiwiFlight,
    requestedCabin?: string
  ): boolean {
    // Kiwi ne fournit pas d'information sur la classe de cabine
    // On accepte tous les vols par défaut
    // En production, on pourrait implémenter une logique de filtrage basée sur le prix
    return true;
  }

  private convertKiwiFlightToOption(flight: KiwiFlight): FlightOption {
    // Calculer la durée totale du vol
    const totalDuration = flight.route.reduce(
      (total, route) => total + route.duration,
      0
    );

    // Trouver le premier et dernier segment
    const firstRoute = flight.route[0];
    const lastRoute = flight.route[flight.route.length - 1];

    return {
      carrier: firstRoute.airline,
      priceEUR: flight.price,
      duration: this.formatDuration(totalDuration),
      bookingUrl: flight.deep_link,
      departureTime: new Date(firstRoute.departureTime * 1000).toISOString(),
      arrivalTime: new Date(lastRoute.arrivalTime * 1000).toISOString(),
      stops: Math.max(0, flight.route.length - 1),
      flightNumber: firstRoute.flight_no,
    };
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
}
