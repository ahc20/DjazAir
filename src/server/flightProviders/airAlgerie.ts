import {
  FlightProvider,
  FlightSearchParams,
  FlightOption,
  FlightSearchResult,
} from "./types";

interface AirAlgerieFlightOffer {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  priceDZD: number;
  priceEUR: number;
  airline: string;
  flightNumber: string;
  stops: number;
  aircraft: string;
  cabin: string;
}

interface AirAlgerieSearchResponse {
  success: boolean;
  data: AirAlgerieFlightOffer[];
  error?: string;
}

export class AirAlgerieProvider implements FlightProvider {
  private baseUrl = "https://www.airalgerie.dz";
  private searchUrl = "https://www.airalgerie.dz/api/search";

  getProviderName(): string {
    return "Air Algérie";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async searchRoundTrip(
    params: FlightSearchParams
  ): Promise<FlightSearchResult> {
    if (!this.isAvailable()) {
      throw new Error("Fournisseur Air Algérie non disponible");
    }

    try {
      // Recherche de vols aller
      const outboundFlights = await this.searchOneWay({
        ...params,
        direction: "outbound",
      });

      // Recherche de vols retour (si demandé)
      let returnFlights: FlightOption[] = [];
      if (params.returnDate) {
        returnFlights = await this.searchOneWay({
          ...params,
          origin: params.destination,
          destination: params.origin,
          departDate: params.returnDate,
          direction: "return",
        });
      }

      // Combinaison des vols aller-retour
      const roundTripOptions = this.combineRoundTripOptions(
        outboundFlights,
        returnFlights
      );

      // Recherche de vols "via Alger" si ce n'est pas déjà la destination
      let viaAlgiersOptions: FlightOption[] = [];
      if (params.destination !== "ALG" && params.origin !== "ALG") {
        try {
          viaAlgiersOptions = await this.searchViaAlgiers(params);
        } catch (error) {
          console.warn("Impossible de rechercher des vols via Alger:", error);
        }
      }

      return {
        directFlights: roundTripOptions,
        viaAlgiersFlights: viaAlgiersOptions,
        bestDirectPriceEUR:
          roundTripOptions.length > 0
            ? Math.min(...roundTripOptions.map((opt) => opt.priceEUR))
            : null,
        bestViaAlgiersPriceEUR:
          viaAlgiersOptions.length > 0
            ? Math.min(...viaAlgiersOptions.map((opt) => opt.priceEUR))
            : null,
        searchParams: params,
        provider: "Air Algérie",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Erreur lors de la recherche Air Algérie:", error);
      throw new Error("Impossible de rechercher des vols sur Air Algérie");
    }
  }

  private async searchOneWay(
    params: FlightSearchParams & { direction: "outbound" | "return" }
  ): Promise<FlightOption[]> {
    try {
      const searchData = {
        origin: params.origin,
        destination: params.destination,
        date: params.departDate,
        adults: params.adults,
        children: params.children || 0,
        infants: params.infants || 0,
        cabin: params.cabin || "ECONOMY",
        currency: "DZD",
      };

      const response = await fetch(this.searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; DjazAir/1.0)",
          Accept: "application/json",
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        throw new Error(`Erreur API Air Algérie: ${response.status}`);
      }

      const data: AirAlgerieSearchResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Aucun vol trouvé");
      }

      // Conversion en format FlightOption
      return data.data.map((offer) => ({
        carrier: offer.airline,
        priceEUR: offer.priceEUR,
        priceDZD: offer.priceDZD,
        duration: offer.duration,
        departureTime: offer.departureTime,
        arrivalTime: offer.arrivalTime,
        stops: offer.stops,
        flightNumber: offer.flightNumber,
        aircraft: offer.aircraft,
        cabin: offer.cabin,
        provider: "Air Algérie",
      }));
    } catch (error) {
      console.error(`Erreur recherche ${params.direction}:`, error);
      return [];
    }
  }

  private async searchViaAlgiers(
    params: FlightSearchParams
  ): Promise<FlightOption[]> {
    try {
      // Recherche Paris → Alger
      const parisToAlgiers = await this.searchOneWay({
        ...params,
        destination: "ALG",
        direction: "outbound",
      });

      // Recherche Alger → Dubai
      const algiersToDubai = await this.searchOneWay({
        ...params,
        origin: "ALG",
        destination: params.destination,
        direction: "outbound",
      });

      // Combinaison des vols avec calcul du prix total
      const viaAlgiersOptions: FlightOption[] = [];

      for (const outbound of parisToAlgiers) {
        for (const inbound of algiersToDubai) {
          const totalPriceEUR = outbound.priceEUR + inbound.priceEUR;
          const totalPriceDZD =
            (outbound.priceDZD || 0) + (inbound.priceDZD || 0);

          viaAlgiersOptions.push({
            carrier: `${outbound.carrier} + ${inbound.carrier}`,
            priceEUR: totalPriceEUR,
            priceDZD: totalPriceDZD,
            duration: this.calculateTotalDuration(
              outbound.duration,
              inbound.duration
            ),
            departureTime: outbound.departureTime,
            arrivalTime: inbound.arrivalTime,
            stops: (outbound.stops || 0) + (inbound.stops || 0) + 1, // +1 pour l'escale à Alger
            flightNumber: `${outbound.flightNumber} + ${inbound.flightNumber}`,
            aircraft: `${outbound.aircraft} + ${inbound.aircraft}`,
            cabin: params.cabin || "ECONOMY",
            provider: "Air Algérie (Via Alger)",
            viaAlgiers: true,
            outboundFlight: outbound,
            inboundFlight: inbound,
          });
        }
      }

      return viaAlgiersOptions;
    } catch (error) {
      console.error("Erreur recherche via Alger:", error);
      return [];
    }
  }

  private combineRoundTripOptions(
    outbound: FlightOption[],
    returnFlights: FlightOption[]
  ): FlightOption[] {
    if (returnFlights.length === 0) {
      return outbound;
    }

    const roundTripOptions: FlightOption[] = [];

    for (const out of outbound) {
      for (const ret of returnFlights) {
        const totalPriceEUR = out.priceEUR + ret.priceEUR;
        const totalPriceDZD = (out.priceDZD || 0) + (ret.priceDZD || 0);

        roundTripOptions.push({
          ...out,
          priceEUR: totalPriceEUR,
          priceDZD: totalPriceDZD,
          duration: `${out.duration} + ${ret.duration}`,
          returnFlight: ret,
        });
      }
    }

    return roundTripOptions;
  }

  private calculateTotalDuration(duration1: string, duration2: string): string {
    // Conversion des durées en minutes et addition
    const minutes1 = this.parseDuration(duration1);
    const minutes2 = this.parseDuration(duration2);
    const totalMinutes = minutes1 + minutes2;

    return this.formatDuration(totalMinutes);
  }

  private parseDuration(duration: string): number {
    // Parse "2h 30m" en minutes
    const hours = duration.match(/(\d+)h/)?.[1] || "0";
    const minutes = duration.match(/(\d+)m/)?.[1] || "0";
    return parseInt(hours) * 60 + parseInt(minutes);
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
