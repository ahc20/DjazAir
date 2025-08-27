import { FlightSearchParams } from '../scrapers/types';
import { GoogleFlightsAPI, GoogleFlightResult } from './googleFlightsAPI';
import { AirAlgerieScraper, AirAlgerieFlightResult } from './airAlgerieScraper';

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
  searchSource: 'google' | 'airalgerie';
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

  constructor() {
    this.googleFlightsAPI = new GoogleFlightsAPI();
    this.airAlgerieScraper = new AirAlgerieScraper();
  }

  /**
   * Recherche unifiée de vols combinant Google Flights et Air Algérie
   */
  async searchFlights(params: FlightSearchParams): Promise<SearchResults> {
    console.log(`🚀 Recherche unifiée pour ${params.origin} → ${params.destination}`);

    try {
      // Recherche parallèle des deux sources
      const [googleResults, airAlgerieResults] = await Promise.allSettled([
        this.searchGoogleFlights(params),
        this.searchAirAlgerieFlights(params)
      ]);

      // Traitement des résultats
      const directFlights = this.processGoogleResults(googleResults);
      const viaAlgiersFlights = this.processAirAlgerieResults(airAlgerieResults);

      // Calcul des économies pour les vols via Alger
      const viaAlgiersWithSavings = this.calculateSavings(viaAlgiersFlights, directFlights);

      // Combinaison et tri de tous les résultats
      const allFlights = [...directFlights, ...viaAlgiersWithSavings]
        .sort((a, b) => a.price.amount - b.price.amount);

      // Détermination des meilleures économies
      const bestSavings = this.findBestSavings(viaAlgiersWithSavings);

      const results: SearchResults = {
        directFlights,
        viaAlgiersFlights: viaAlgiersWithSavings,
        allFlights,
        searchParams: params,
        searchTimestamp: new Date(),
        totalResults: allFlights.length,
        bestSavings
      };

      console.log(`✅ Recherche terminée: ${results.totalResults} vols trouvés`);
      return results;

    } catch (error) {
      console.error('❌ Erreur recherche unifiée:', error);
      throw new Error(`Erreur de recherche unifiée: ${error}`);
    }
  }

  /**
   * Recherche Google Flights avec gestion d'erreur
   */
  private async searchGoogleFlights(params: FlightSearchParams): Promise<GoogleFlightResult[]> {
    try {
      if (this.googleFlightsAPI.isAvailable()) {
        return await this.googleFlightsAPI.searchFlightsWithFallback(params);
      } else {
        console.warn('⚠️ Google Flights API non disponible, utilisation du fallback');
        return this.googleFlightsAPI.getFallbackResults(params);
      }
    } catch (error) {
      console.warn('⚠️ Erreur Google Flights, utilisation du fallback:', error);
      return this.googleFlightsAPI.getFallbackResults(params);
    }
  }

  /**
   * Recherche Air Algérie avec gestion d'erreur
   */
  private async searchAirAlgerieFlights(params: FlightSearchParams): Promise<AirAlgerieFlightResult[]> {
    try {
      if (this.airAlgerieScraper.isAvailable()) {
        return await this.airAlgerieScraper.searchFlightsWithFallback(params);
      } else {
        console.warn('⚠️ Scraper Air Algérie non disponible');
        return [];
      }
    } catch (error) {
      console.warn('⚠️ Erreur Air Algérie, utilisation du fallback:', error);
      return await this.airAlgerieScraper.simulateRealSearch(params);
    }
  }

  /**
   * Traite les résultats Google Flights
   */
  private processGoogleResults(result: PromiseSettledResult<GoogleFlightResult[]>): UnifiedFlightResult[] {
    if (result.status === 'fulfilled') {
      return result.value.map(flight => ({
        ...flight,
        searchSource: 'google' as const,
        viaAlgiers: false
      }));
    } else {
      console.warn('❌ Google Flights échoué:', result.reason);
      return [];
    }
  }

  /**
   * Traite les résultats Air Algérie
   */
  private processAirAlgerieResults(result: PromiseSettledResult<AirAlgerieFlightResult[]>): UnifiedFlightResult[] {
    if (result.status === 'fulfilled') {
      return result.value.map(flight => ({
        ...flight,
        searchSource: 'airalgerie' as const,
        viaAlgiers: true
      }));
    } else {
      console.warn('❌ Air Algérie échoué:', result.reason);
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
    const referencePrice = Math.min(...directFlights.map(f => f.price.amount));

    return viaAlgiersFlights.map(flight => {
      const savings = referencePrice - flight.price.amount;
      const percentage = (savings / referencePrice) * 100;

      return {
        ...flight,
        savings: {
          amount: Math.round(savings * 100) / 100,
          percentage: Math.round(percentage * 100) / 100
        }
      };
    });
  }

  /**
   * Trouve les meilleures économies
   */
  private findBestSavings(viaAlgiersFlights: UnifiedFlightResult[]): SearchResults['bestSavings'] {
    const flightsWithSavings = viaAlgiersFlights.filter(f => f.savings && f.savings.amount > 0);
    
    if (flightsWithSavings.length === 0) {
      return undefined;
    }

    const bestFlight = flightsWithSavings.reduce((best, current) => {
      if (!best.savings || !current.savings) return best;
      return current.savings.amount > best.savings.amount ? current : best;
    });

    return bestFlight.savings ? {
      amount: bestFlight.savings.amount,
      percentage: bestFlight.savings.percentage,
      flight: bestFlight
    } : undefined;
  }

  /**
   * Obtient les statistiques de recherche
   */
  getSearchStats(results: SearchResults) {
    const totalDirect = results.directFlights.length;
    const totalViaAlgiers = results.viaAlgiersFlights.length;
    const totalSavings = results.viaAlgiersFlights.filter(f => f.savings && f.savings.amount > 0).length;
    const avgSavings = results.viaAlgiersFlights
      .filter(f => f.savings && f.savings.amount > 0)
      .reduce((sum, f) => sum + (f.savings?.amount || 0), 0) / Math.max(totalSavings, 1);

    return {
      totalDirect,
      totalViaAlgiers,
      totalSavings,
      averageSavings: Math.round(avgSavings * 100) / 100,
      bestSavings: results.bestSavings
    };
  }

  /**
   * Filtre les résultats selon des critères
   */
  filterResults(results: SearchResults, filters: {
    maxPrice?: number;
    maxStops?: number;
    airlines?: string[];
    directOnly?: boolean;
    viaAlgiersOnly?: boolean;
  }): UnifiedFlightResult[] {
    let filtered = results.allFlights;

    if (filters.maxPrice) {
      filtered = filtered.filter(f => f.price.amount <= filters.maxPrice!);
    }

    if (filters.maxStops !== undefined) {
      filtered = filtered.filter(f => f.stops <= filters.maxStops!);
    }

    if (filters.airlines && filters.airlines.length > 0) {
      filtered = filtered.filter(f => filters.airlines!.includes(f.airlineCode));
    }

    if (filters.directOnly) {
      filtered = filtered.filter(f => f.direct);
    }

    if (filters.viaAlgiersOnly) {
      filtered = filtered.filter(f => f.viaAlgiers);
    }

    return filtered;
  }

  /**
   * Met à jour le taux de change parallèle
   */
  updateParallelRate(newRate: number): void {
    this.airAlgerieScraper.updateParallelRate(newRate);
    console.log(`🔄 Taux parallèle mis à jour dans le service unifié: 1€ = ${newRate} DZD`);
  }

  /**
   * Obtient le taux de change parallèle actuel
   */
  getCurrentParallelRate(): number {
    return this.airAlgerieScraper.getCurrentParallelRate();
  }
}
