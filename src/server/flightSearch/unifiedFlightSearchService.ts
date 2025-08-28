import { FlightSearchParams } from "../scrapers/types";
import { GoogleFlightsAPI, GoogleFlightResult } from "./googleFlightsAPI";
import { AirAlgerieScraper, AirAlgerieFlightResult } from "./airAlgerieScraper";
import { AmadeusAPI, AmadeusFlightResult } from "./amadeusAPI";

export interface UnifiedFlightResult {
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
    originalDZD?: number;
  };
  aircraft?: string;
  cabinClass: string;
  provider: string;
  direct: boolean;
  viaAlgiers?: boolean;
  baggage: {
    included: boolean;
    weight?: string;
    details?: string;
  };
  connection?: {
    airport: string;
    duration: string;
    flightNumber?: string;
  };
  savings?: {
    amount: number;
    percentage: number;
  };
  searchSource: "google" | "airalgerie" | "amadeus";
}

export interface SearchResults {
  directFlights: UnifiedFlightResult[];
  viaAlgiersFlights: UnifiedFlightResult[];
  allFlights: UnifiedFlightResult[];
  searchParams: FlightSearchParams;
  searchTimestamp: Date;
  totalResults: number;
  bestSavings?: {
    amount: number;
    percentage: number;
    flight: UnifiedFlightResult;
  };
}

export class UnifiedFlightSearchService {
  private googleFlightsAPI: GoogleFlightsAPI;
  private airAlgerieScraper: AirAlgerieScraper;
  private amadeusAPI: AmadeusAPI;

  constructor() {
    this.googleFlightsAPI = new GoogleFlightsAPI();
    this.airAlgerieScraper = new AirAlgerieScraper();
    this.amadeusAPI = new AmadeusAPI();
  }

  /**
   * Recherche unifiée de vols via Amadeus (source principale)
   */
  async searchFlights(params: FlightSearchParams): Promise<SearchResults> {
    console.log(
      `🚀 Recherche Amadeus pour ${params.origin} → ${params.destination}`
    );

    try {
      // Recherche principale via Amadeus
      const amadeusResults = await this.searchAmadeusFlights(params);

      // Traitement des résultats Amadeus
      const allFlights = this.processAmadeusResults({
        status: "fulfilled",
        value: amadeusResults,
      });

      // Recherche DjazAir via API séparée
      let viaAlgiersFlights: UnifiedFlightResult[] = [];
      try {
        const djazairResponse = await fetch("/api/djazair-calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (djazairResponse.ok) {
          const djazairData = await djazairResponse.json();
          if (djazairData.success) {
            const djazairOption = this.createDjazAirOptionFromAPI(
              djazairData.data,
              params
            );
            if (djazairOption) {
              viaAlgiersFlights = [djazairOption];
              console.log("✅ Option DjazAir trouvée via API séparée");
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Erreur API DjazAir:", error);
      }

      // Calcul des économies pour l'option DjazAir
      const viaAlgiersWithSavings = this.calculateSavings(
        viaAlgiersFlights,
        allFlights
      );

      // Combinaison et tri de tous les résultats
      const combinedFlights = [...allFlights, ...viaAlgiersWithSavings].sort(
        (a, b) => a.price.amount - b.price.amount
      );

      // Détermination des meilleures économies
      const bestSavings = this.findBestSavings(viaAlgiersWithSavings);

      const results: SearchResults = {
        directFlights: allFlights,
        viaAlgiersFlights: viaAlgiersWithSavings,
        allFlights: combinedFlights,
        searchParams: params,
        searchTimestamp: new Date(),
        totalResults: combinedFlights.length,
        bestSavings,
      };

      console.log(
        `✅ Recherche terminée: ${results.totalResults} vols trouvés (${viaAlgiersFlights.length} DjazAir)`
      );
      return results;
    } catch (error) {
      console.error("❌ Erreur recherche unifiée:", error);
      throw new Error(`Erreur de recherche unifiée: ${error}`);
    }
  }

  /**
   * Recherche Google Flights avec gestion d'erreur
   */
  private async searchGoogleFlights(
    params: FlightSearchParams
  ): Promise<GoogleFlightResult[]> {
    try {
      if (this.googleFlightsAPI.isAvailable()) {
        return await this.googleFlightsAPI.searchFlightsWithFallback(params);
      } else {
        console.warn(
          "⚠️ Google Flights API non disponible, utilisation du fallback"
        );
        return this.googleFlightsAPI.getFallbackResults(params);
      }
    } catch (error) {
      console.warn("⚠️ Erreur Google Flights, utilisation du fallback:", error);
      return this.googleFlightsAPI.getFallbackResults(params);
    }
  }

  /**
   * Recherche Air Algérie avec gestion d'erreur
   */
  private async searchAirAlgerieFlights(
    params: FlightSearchParams
  ): Promise<AirAlgerieFlightResult[]> {
    try {
      if (this.airAlgerieScraper.isAvailable()) {
        return await this.airAlgerieScraper.searchFlightsWithFallback(params);
      } else {
        console.warn("⚠️ Scraper Air Algérie non disponible");
        return [];
      }
    } catch (error) {
      console.warn("⚠️ Erreur Air Algérie, utilisation du fallback:", error);
      return await this.airAlgerieScraper.simulateRealSearch(params);
    }
  }

  /**
   * Recherche Amadeus avec gestion d'erreur
   */
  private async searchAmadeusFlights(
    params: FlightSearchParams
  ): Promise<AmadeusFlightResult[]> {
    try {
      if (this.amadeusAPI.isAvailable()) {
        return await this.amadeusAPI.searchFlightsWithFallback(params);
      } else {
        console.warn("⚠️ API Amadeus non disponible");
        return [];
      }
    } catch (error) {
      console.warn("⚠️ Erreur Amadeus, utilisation du fallback:", error);
      return this.amadeusAPI.getFallbackResults(params);
    }
  }

  /**
   * Crée une option DjazAir à partir des données de l'API séparée
   */
  private createDjazAirOptionFromAPI(
    djazairData: any,
    params: FlightSearchParams
  ): UnifiedFlightResult | null {
    try {
      const djazairOption: UnifiedFlightResult = {
        id: `djazair-${Date.now()}`,
        airline: "DjazAir (via Alger)",
        airlineCode: "DJZ",
        flightNumber: `${djazairData.segments.toAlgiers.flight} + ${djazairData.segments.fromAlgiers.flight}`,
        origin: params.origin,
        destination: params.destination,
        departureTime: "08:00", // Heure simulée
        arrivalTime: "22:00", // Heure simulée
        duration: "16h 00m", // Durée simulée
        stops: 1,
        price: {
          amount: djazairData.totalPriceEURConverted,
          currency: "EUR",
          originalDZD: djazairData.totalPriceDZD,
        },
        aircraft: "N/A",
        cabinClass: params.cabinClass || "Economy",
        provider: "DjazAir",
        direct: false,
        viaAlgiers: true,
        baggage: {
          included: true,
          weight: "23kg",
          details: "Via Alger: Bagages inclus",
        },
        connection: {
          airport: "ALG",
          duration: "2h 00m",
          flightNumber: djazairData.segments.fromAlgiers.flight,
        },
        searchSource: "amadeus",
      };

      return djazairOption;
    } catch (error) {
      console.warn("⚠️ Erreur création option DjazAir:", error);
      return null;
    }
  }

  /**
   * Parse une durée au format "Xh Ym" en minutes
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)h\s*(\d+)?m?/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      return hours * 60 + minutes;
    }
    return 0;
  }

  /**
   * Calcule le temps de connexion entre deux vols
   */
  private calculateConnectionTime(
    toAlgiers: AmadeusFlightResult,
    fromAlgiers: AmadeusFlightResult
  ): string {
    // Logique simple : 2h de connexion par défaut
    return "2h 00m"; // Retourne une string formatée
  }

  /**
   * Traite les résultats Google Flights
   */
  private processGoogleResults(
    result: PromiseSettledResult<GoogleFlightResult[]>
  ): UnifiedFlightResult[] {
    if (result.status === "fulfilled") {
      return result.value.map((flight) => ({
        ...flight,
        searchSource: "google" as const,
        viaAlgiers: false,
      }));
    } else {
      console.warn("❌ Google Flights échoué:", result.reason);
      return [];
    }
  }

  /**
   * Traite les résultats Air Algérie
   */
  private processAirAlgerieResults(
    result: PromiseSettledResult<AirAlgerieFlightResult[]>
  ): UnifiedFlightResult[] {
    if (result.status === "fulfilled") {
      return result.value.map((flight) => ({
        ...flight,
        searchSource: "airalgerie" as const,
        viaAlgiers: true,
      }));
    } else {
      console.warn("❌ Air Algérie échoué:", result.reason);
      return [];
    }
  }

  /**
   * Traite les résultats Amadeus
   */
  private processAmadeusResults(
    result: PromiseSettledResult<AmadeusFlightResult[]>
  ): UnifiedFlightResult[] {
    if (result.status === "fulfilled") {
      return result.value.map((flight) => ({
        ...flight,
        searchSource: "amadeus" as const,
        viaAlgiers: false,
      }));
    } else {
      console.warn("❌ Amadeus échoué:", result.reason);
      return [];
    }
  }

  /**
   * Calcule les économies pour les vols via Alger
   */
  private calculateSavings(
    viaAlgiersFlights: UnifiedFlightResult[],
    directFlights: UnifiedFlightResult[]
  ): UnifiedFlightResult[] {
    if (directFlights.length === 0) {
      return viaAlgiersFlights;
    }

    // Prix de référence (meilleur prix direct)
    const referencePrice = Math.min(
      ...directFlights.map((f) => f.price.amount)
    );

    return viaAlgiersFlights.map((flight) => {
      const savings = referencePrice - flight.price.amount;
      const percentage = (savings / referencePrice) * 100;

      return {
        ...flight,
        savings: {
          amount: Math.round(savings * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
        },
      };
    });
  }

  /**
   * Trouve les meilleures économies
   */
  private findBestSavings(
    viaAlgiersFlights: UnifiedFlightResult[]
  ): SearchResults["bestSavings"] {
    const flightsWithSavings = viaAlgiersFlights.filter(
      (f) => f.savings && f.savings.amount > 0
    );

    if (flightsWithSavings.length === 0) {
      return undefined;
    }

    const bestFlight = flightsWithSavings.reduce((best, current) => {
      if (!best.savings || !current.savings) return best;
      return current.savings.amount > best.savings.amount ? current : best;
    });

    return bestFlight.savings
      ? {
          amount: bestFlight.savings.amount,
          percentage: bestFlight.savings.percentage,
          flight: bestFlight,
        }
      : undefined;
  }

  /**
   * Obtient les statistiques de recherche
   */
  getSearchStats(results: SearchResults) {
    const totalDirect = results.directFlights.length;
    const totalViaAlgiers = results.viaAlgiersFlights.length;
    const totalSavings = results.viaAlgiersFlights.filter(
      (f) => f.savings && f.savings.amount > 0
    ).length;
    const avgSavings =
      results.viaAlgiersFlights
        .filter((f) => f.savings && f.savings.amount > 0)
        .reduce((sum, f) => sum + (f.savings?.amount || 0), 0) /
      Math.max(totalSavings, 1);

    return {
      totalDirect,
      totalViaAlgiers,
      totalSavings,
      averageSavings: Math.round(avgSavings * 100) / 100,
      bestSavings: results.bestSavings,
    };
  }

  /**
   * Filtre les résultats selon des critères
   */
  filterResults(
    results: SearchResults,
    filters: {
      maxPrice?: number;
      maxStops?: number;
      airlines?: string[];
      directOnly?: boolean;
      viaAlgiersOnly?: boolean;
    }
  ): UnifiedFlightResult[] {
    let filtered = results.allFlights;

    if (filters.maxPrice) {
      filtered = filtered.filter((f) => f.price.amount <= filters.maxPrice!);
    }

    if (filters.maxStops !== undefined) {
      filtered = filtered.filter((f) => f.stops <= filters.maxStops!);
    }

    if (filters.airlines && filters.airlines.length > 0) {
      filtered = filtered.filter((f) =>
        filters.airlines!.includes(f.airlineCode)
      );
    }

    if (filters.directOnly) {
      filtered = filtered.filter((f) => f.direct);
    }

    if (filters.viaAlgiersOnly) {
      filtered = filtered.filter((f) => f.viaAlgiers);
    }

    return filtered;
  }

  /**
   * Met à jour le taux de change parallèle
   */
  updateParallelRate(newRate: number): void {
    this.airAlgerieScraper.updateParallelRate(newRate);
    console.log(
      `🔄 Taux parallèle mis à jour dans le service unifié: 1€ = ${newRate} DZD`
    );
  }

  /**
   * Obtient le taux de change parallèle actuel
   */
  getCurrentParallelRate(): number {
    return this.airAlgerieScraper.getCurrentParallelRate();
  }
}
