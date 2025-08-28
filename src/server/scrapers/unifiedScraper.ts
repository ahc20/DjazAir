import {
  AirlineScraper,
  ScrapingResult,
  FlightSearchParams,
  ScrapedFlightData,
} from "./types";
import { AirAlgerieScraper } from "./airAlgerieScraper";
import { AirFranceScraper } from "./airFranceScraper";
import { EmiratesScraper } from "./emiratesScraper";
import { sleep, chunkArray } from "@/lib/scrapingUtils";

export interface UnifiedScrapingResult {
  success: boolean;
  data: {
    direct: ScrapedFlightData[];
    viaAlgiers: ScrapedFlightData[];
    allResults: ScrapedFlightData[];
    bestPrices: {
      direct: { amount: number; currency: string; provider: string } | null;
      viaAlgiers: { amount: number; currency: string; provider: string } | null;
      overall: { amount: number; currency: string; provider: string } | null;
    };
    providers: string[];
    searchTimestamp: Date;
    totalResults: number;
  };
  errors: string[];
  searchParams: FlightSearchParams;
}

export class UnifiedScraper {
  private scrapers: AirlineScraper[] = [
    new AirAlgerieScraper(),
    new AirFranceScraper(),
    new EmiratesScraper(),
  ];

  async searchFlights(
    params: FlightSearchParams
  ): Promise<UnifiedScrapingResult> {
    console.log(
      `🚀 Démarrage de la recherche unifiée: ${params.origin} → ${params.destination}`
    );

    const startTime = Date.now();
    const results: ScrapedFlightData[] = [];
    const errors: string[] = [];
    const successfulProviders: string[] = [];

    try {
      // Vérification de la disponibilité des scrapers
      const availableScrapers = await this.getAvailableScrapers();
      console.log(
        `✅ ${availableScrapers.length}/${this.scrapers.length} scrapers disponibles`
      );

      if (availableScrapers.length === 0) {
        throw new Error("Aucun scraper disponible");
      }

      // Recherche parallèle avec limitation de concurrence
      const searchPromises = availableScrapers.map((scraper) =>
        this.searchWithScraper(scraper, params)
      );

      const searchResults = await Promise.allSettled(searchPromises);

      // Traitement des résultats
      searchResults.forEach((result, index) => {
        const scraper = availableScrapers[index];

        if (
          result.status === "fulfilled" &&
          result.value.success &&
          result.value.data
        ) {
          results.push(...result.value.data);
          successfulProviders.push(scraper.name);
          console.log(
            `✅ ${scraper.name}: ${result.value.data.length} résultats`
          );
        } else {
          const error =
            result.status === "rejected"
              ? result.reason?.message || "Erreur inconnue"
              : result.value?.error || "Erreur de recherche";

          errors.push(`${scraper.name}: ${error}`);
          console.log(`❌ ${scraper.name}: ${error}`);
        }
      });

      // Tri et catégorisation des résultats
      const categorizedResults = this.categorizeResults(results, params);

      const searchDuration = Date.now() - startTime;
      console.log(`⏱️ Recherche terminée en ${searchDuration}ms`);

      return {
        success: results.length > 0,
        data: {
          ...categorizedResults,
          providers: successfulProviders,
          searchTimestamp: new Date(),
          totalResults: results.length,
        },
        errors,
        searchParams: params,
      };
    } catch (error) {
      console.error(`💥 Erreur critique: ${error}`);
      return {
        success: false,
        data: {
          direct: [],
          viaAlgiers: [],
          allResults: [],
          bestPrices: { direct: null, viaAlgiers: null, overall: null },
          providers: [],
          searchTimestamp: new Date(),
          totalResults: 0,
        },
        errors: [error instanceof Error ? error.message : "Erreur inconnue"],
        searchParams: params,
      };
    }
  }

  private async getAvailableScrapers(): Promise<AirlineScraper[]> {
    const availabilityChecks = this.scrapers.map(async (scraper) => {
      try {
        const isAvailable = await scraper.isAvailable();
        return { scraper, isAvailable };
      } catch {
        return { scraper, isAvailable: false };
      }
    });

    const results = await Promise.allSettled(availabilityChecks);
    const availableScrapers: AirlineScraper[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.isAvailable) {
        availableScrapers.push(result.value.scraper);
      }
    });

    return availableScrapers;
  }

  private async searchWithScraper(
    scraper: AirlineScraper,
    params: FlightSearchParams
  ): Promise<ScrapingResult> {
    try {
      // Délai aléatoire pour éviter la détection
      const randomDelay = Math.random() * 2000;
      await sleep(randomDelay);

      return await scraper.searchFlights(params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        provider: scraper.name,
        timestamp: new Date(),
      };
    }
  }

  private categorizeResults(
    results: ScrapedFlightData[],
    params: FlightSearchParams
  ) {
    const direct: ScrapedFlightData[] = [];
    const viaAlgiers: ScrapedFlightData[] = [];
    const allResults = [...results].sort(
      (a, b) => (a.totalPrice.amount || 0) - (b.totalPrice.amount || 0)
    );

    // Catégorisation des résultats
    results.forEach((result) => {
      if (result.direct) {
        direct.push(result);
      } else if (this.isViaAlgiersRoute(result, params)) {
        viaAlgiers.push(result);
      }
    });

    // Tri par prix
    direct.sort(
      (a, b) => (a.totalPrice.amount || 0) - (b.totalPrice.amount || 0)
    );
    viaAlgiers.sort(
      (a, b) => (a.totalPrice.amount || 0) - (b.totalPrice.amount || 0)
    );

    // Calcul des meilleurs prix
    const bestPrices = {
      direct:
        direct.length > 0
          ? {
              amount: direct[0].totalPrice.amount || 0,
              currency: direct[0].totalPrice.currency || "EUR",
              provider: direct[0].provider,
            }
          : null,
      viaAlgiers:
        viaAlgiers.length > 0
          ? {
              amount: viaAlgiers[0].totalPrice.amount || 0,
              currency: viaAlgiers[0].totalPrice.currency || "EUR",
              provider: viaAlgiers[0].provider,
            }
          : null,
      overall:
        allResults.length > 0
          ? {
              amount: allResults[0].totalPrice.amount || 0,
              currency: allResults[0].totalPrice.currency || "EUR",
              provider: allResults[0].provider,
            }
          : null,
    };

    return {
      direct,
      viaAlgiers,
      allResults,
      bestPrices,
    };
  }

  private isViaAlgiersRoute(
    result: ScrapedFlightData,
    params: FlightSearchParams
  ): boolean {
    // Vérifie si l'itinéraire passe par Alger
    if (params.origin === "ALG" || params.destination === "ALG") {
      return false; // Déjà à Alger
    }

    // Vérifie si les vols passent par Alger
    return result.flights.some(
      (flight) => flight.origin === "ALG" || flight.destination === "ALG"
    );
  }

  async searchSpecificRoute(
    origin: string,
    destination: string,
    date: string
  ): Promise<UnifiedScrapingResult> {
    return this.searchFlights({
      origin,
      destination,
      departureDate: date,
      passengers: 1,
      cabinClass: "Economy",
      currency: "EUR",
    });
  }

  async searchParisDubaiViaAlgiers(
    date: string
  ): Promise<UnifiedScrapingResult> {
    return this.searchSpecificRoute("CDG", "DXB", date);
  }

  async getExchangeRates(): Promise<Record<string, Record<string, number>>> {
    const rates: Record<string, Record<string, number>> = {};

    for (const scraper of this.scrapers) {
      try {
        rates[scraper.name] = await scraper.getExchangeRates();
      } catch (error) {
        console.error(`Erreur taux de change ${scraper.name}: ${error}`);
        rates[scraper.name] = {};
      }
    }

    return rates;
  }
}
