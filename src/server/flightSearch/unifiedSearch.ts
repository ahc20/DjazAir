import { FlightProvider, FlightSearchParams, FlightSearchResult, FlightOption } from '../flightProviders/types';
import { AmadeusProvider } from '../flightProviders/amadeus';
import { KiwiProvider } from '../flightProviders/kiwi';
import { AirAlgerieProvider } from '../flightProviders/airAlgerie';

export interface UnifiedSearchResult {
  directFlights: FlightOption[];
  viaAlgiersFlights: FlightOption[];
  bestDirectPriceEUR: number | null;
  bestViaAlgiersPriceEUR: number | null;
  searchParams: FlightSearchParams;
  providers: string[];
  timestamp: string;
  priceBreakdown: {
    direct: {
      totalEUR: number;
      totalDZD?: number;
      breakdown: FlightOption[];
    };
    viaAlgiers: {
      totalEUR: number;
      totalDZD: number;
      breakdown: {
        outbound: FlightOption;
        inbound: FlightOption;
        total: number;
      }[];
    };
  };
}

export class UnifiedFlightSearch {
  private providers: FlightProvider[] = [
    new AirAlgerieProvider(),
    new AmadeusProvider(),
    new KiwiProvider()
  ];

  async searchFlights(params: FlightSearchParams): Promise<UnifiedSearchResult> {
    console.log(`🔍 Recherche de vols: ${params.origin} → ${params.destination} le ${params.departDate}`);
    
    const results: FlightSearchResult[] = [];
    const errors: string[] = [];

    // Recherche parallèle sur tous les fournisseurs disponibles
    const searchPromises = this.providers.map(async (provider) => {
      try {
        if (await provider.isAvailable()) {
          console.log(`✅ ${provider.constructor.name} disponible`);
          const result = await provider.searchRoundTrip(params);
          results.push(result);
          return result;
        } else {
          console.log(`❌ ${provider.constructor.name} non disponible`);
          return null;
        }
      } catch (error) {
        const errorMsg = `Erreur ${provider.constructor.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        return null;
      }
    });

    await Promise.allSettled(searchPromises);

    // Combinaison des résultats
    const allDirectFlights: FlightOption[] = [];
    const allViaAlgiersFlights: FlightOption[] = [];

    results.forEach(result => {
      if (result.directFlights) {
        allDirectFlights.push(...result.directFlights);
      }
      if (result.viaAlgiersFlights) {
        allViaAlgiersFlights.push(...result.viaAlgiersFlights);
      }
    });

    // Tri par prix
    allDirectFlights.sort((a, b) => a.priceEUR - b.priceEUR);
    allViaAlgiersFlights.sort((a, b) => a.priceEUR - b.priceEUR);

    // Calcul des prix de décomposition
    const priceBreakdown = this.calculatePriceBreakdown(allDirectFlights, allViaAlgiersFlights);

    return {
      directFlights: allDirectFlights,
      viaAlgiersFlights: allViaAlgiersFlights,
      bestDirectPriceEUR: allDirectFlights.length > 0 ? allDirectFlights[0].priceEUR : null,
      bestViaAlgiersPriceEUR: allViaAlgiersFlights.length > 0 ? allViaAlgiersFlights[0].priceEUR : null,
      searchParams: params,
      providers: results.map(r => r.provider || 'Unknown'),
      timestamp: new Date().toISOString(),
      priceBreakdown
    };
  }

  private calculatePriceBreakdown(directFlights: FlightOption[], viaAlgiersFlights: FlightOption[]) {
    const direct = {
      totalEUR: directFlights.length > 0 ? directFlights[0].priceEUR : 0,
      totalDZD: directFlights.length > 0 ? directFlights[0].priceDZD : undefined,
      breakdown: directFlights.slice(0, 3) // Top 3 options
    };

    const viaAlgiers = {
      totalEUR: viaAlgiersFlights.length > 0 ? viaAlgiersFlights[0].priceEUR : 0,
      totalDZD: viaAlgiersFlights.length > 0 ? (viaAlgiersFlights[0].priceDZD || 0) : 0,
      breakdown: viaAlgiersFlights.slice(0, 3).map(flight => ({
        outbound: flight.outboundFlight!,
        inbound: flight.inboundFlight!,
        total: flight.priceEUR
      }))
    };

    return { direct, viaAlgiers };
  }

  async searchSpecificRoute(origin: string, destination: string, date: string): Promise<UnifiedSearchResult> {
    const params: FlightSearchParams = {
      origin,
      destination,
      departDate: date,
      adults: 1,
      children: 0,
      infants: 0,
      cabin: 'ECONOMY',
      currency: 'EUR'
    };

    return this.searchFlights(params);
  }

  // Recherche spécialisée Paris → Dubai via Alger
  async searchParisDubaiViaAlgiers(date: string): Promise<UnifiedSearchResult> {
    console.log(`🛫 Recherche spécialisée: Paris → Dubai via Alger le ${date}`);
    
    const params: FlightSearchParams = {
      origin: 'CDG',
      destination: 'DXB',
      departDate: date,
      adults: 1,
      children: 0,
      infants: 0,
      cabin: 'ECONOMY',
      currency: 'EUR'
    };

    return this.searchFlights(params);
  }
}
