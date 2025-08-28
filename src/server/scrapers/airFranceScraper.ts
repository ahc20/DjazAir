import { BaseScraper } from "./baseScraper";
import {
  AirlineScraper,
  ScrapingResult,
  FlightSearchParams,
  ScrapedFlightData,
  ScrapedFlight,
} from "./types";
import {
  sleep,
  sanitizeText,
  extractNumber,
  extractCurrency,
  parseDuration,
  formatDuration,
} from "@/lib/scrapingUtils";

export class AirFranceScraper extends BaseScraper implements AirlineScraper {
  constructor() {
    super("Air France", "https://www.airfrance.fr", {
      timeout: 40000,
      retries: 3,
      delay: 1500,
      maxConcurrent: 2,
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest(this.baseUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<ScrapingResult> {
    try {
      console.log(
        `🔍 Recherche Air France: ${params.origin} → ${params.destination} le ${params.departureDate}`
      );

      // Simulation de recherche avec délai réaliste
      await sleep(1500 + Math.random() * 2000);

      const results = await this.simulateSearchResults(params);

      return this.createSuccessResult(results);
    } catch (error) {
      console.error(`❌ Erreur Air France: ${error}`);
      return this.createErrorResult(`Erreur de recherche: ${error}`);
    }
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    return {
      EUR: 1.0,
      USD: 1.08,
      GBP: 0.86,
      CHF: 0.95,
    };
  }

  private async simulateSearchResults(
    params: FlightSearchParams
  ): Promise<ScrapedFlightData[]> {
    const results: ScrapedFlightData[] = [];

    // Recherche directe
    const directFlights = this.generateDirectFlights(params);
    if (directFlights.length > 0) {
      results.push({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        flights: directFlights,
        totalPrice: {
          amount: directFlights[0].price?.amount || 0,
          currency: directFlights[0].price?.currency || "EUR",
        },
        searchTimestamp: new Date(),
        provider: this.name,
        direct: true,
        stops: 0,
        duration: directFlights[0].duration,
        cabinClass: "Economy",
      });
    }

    // Recherche avec escales
    const connectingFlights = this.generateConnectingFlights(params);
    if (connectingFlights.length > 0) {
      results.push({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        flights: connectingFlights,
        totalPrice: {
          amount: connectingFlights[0].price?.amount || 0,
          currency: connectingFlights[0].price?.currency || "EUR",
        },
        searchTimestamp: new Date(),
        provider: this.name,
        direct: false,
        stops: 1,
        duration: this.calculateTotalDuration(connectingFlights),
        cabinClass: "Economy",
      });
    }

    return results;
  }

  private generateDirectFlights(params: FlightSearchParams): ScrapedFlight[] {
    const flights: ScrapedFlight[] = [];

    // Vols directs simulés
    const basePrice = this.getBasePrice(params.origin, params.destination);
    const departureTimes = ["07:30", "12:45", "18:20", "22:15"];

    departureTimes.forEach((time, index) => {
      const priceVariation = 1 + index * 0.05 + (Math.random() * 0.15 - 0.075);
      const price = basePrice * priceVariation;

      flights.push({
        flightNumber: `AF${2000 + index}`,
        airline: "Air France",
        airlineCode: "AF",
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T${time}:00`,
        arrivalTime: this.calculateArrivalTime(
          params.origin,
          params.destination,
          time
        ),
        duration: this.calculateFlightDuration(
          params.origin,
          params.destination
        ),
        aircraft: "Airbus A350-900",
        cabinClass: "Economy",
        price: {
          amount: Math.round(price * 100) / 100,
          currency: "EUR",
        },
      });
    });

    return flights.sort(
      (a, b) => (a.price?.amount || 0) - (b.price?.amount || 0)
    );
  }

  private generateConnectingFlights(
    params: FlightSearchParams
  ): ScrapedFlight[] {
    const flights: ScrapedFlight[] = [];

    // Vols avec escale via CDG ou ORY
    const hubs = ["CDG", "ORY"];
    const basePrice =
      this.getBasePrice(params.origin, params.destination) * 0.8; // Prix réduit pour les escales

    hubs.forEach((hub, index) => {
      if (params.origin !== hub && params.destination !== hub) {
        const priceVariation = 1 + index * 0.1 + (Math.random() * 0.2 - 0.1);
        const price = basePrice * priceVariation;

        flights.push({
          flightNumber: `AF${3000 + index}`,
          airline: "Air France",
          airlineCode: "AF",
          origin: params.origin,
          destination: params.destination,
          departureTime: `${params.departureDate}T${index === 0 ? "09:00" : "15:30"}:00`,
          arrivalTime: this.calculateArrivalTime(
            params.origin,
            params.destination,
            index === 0 ? "09:00" : "15:30"
          ),
          duration: this.calculateFlightDuration(
            params.origin,
            params.destination,
            true
          ),
          aircraft: "Airbus A320neo",
          cabinClass: "Economy",
          price: {
            amount: Math.round(price * 100) / 100,
            currency: "EUR",
          },
        });
      }
    });

    return flights.sort(
      (a, b) => (a.price?.amount || 0) - (b.price?.amount || 0)
    );
  }

  private getBasePrice(origin: string, destination: string): number {
    const routes: Record<string, number> = {
      "CDG-DXB": 520, // Paris-Dubai
      "CDG-IST": 310, // Paris-Istanbul
      "CDG-CAI": 380, // Paris-Le Caire
      "CDG-BEY": 420, // Paris-Beyrouth
      "CDG-AMM": 450, // Paris-Amman
      "CDG-RUH": 580, // Paris-Riyadh
      "CDG-DOH": 600, // Paris-Doha
      "CDG-AUH": 590, // Paris-Abu Dhabi
    };

    const route = `${origin}-${destination}`;
    return routes[route] || 400;
  }

  private calculateArrivalTime(
    origin: string,
    destination: string,
    departureTime: string
  ): string {
    const duration = this.calculateFlightDuration(origin, destination);
    const [hours, minutes] = duration.split("h").map((s) => parseInt(s) || 0);

    const [depHour, depMin] = departureTime.split(":").map((s) => parseInt(s));
    let arrHour = depHour + hours;
    let arrMin = depMin + minutes;

    if (arrMin >= 60) {
      arrHour += Math.floor(arrMin / 60);
      arrMin %= 60;
    }

    if (arrHour >= 24) {
      arrHour -= 24;
    }

    return `${arrHour.toString().padStart(2, "0")}:${arrMin.toString().padStart(2, "0")}`;
  }

  private calculateFlightDuration(
    origin: string,
    destination: string,
    withConnection: boolean = false
  ): string {
    const durations: Record<string, string> = {
      "CDG-DXB": "6h 30m",
      "CDG-IST": "3h 15m",
      "CDG-CAI": "4h 10m",
      "CDG-BEY": "4h 40m",
      "CDG-AMM": "4h 55m",
      "CDG-RUH": "6h 45m",
      "CDG-DOH": "6h 55m",
      "CDG-AUH": "6h 40m",
    };

    const route = `${origin}-${destination}`;
    let baseDuration = durations[route] || "4h 00m";

    if (withConnection) {
      const baseMinutes = parseDuration(baseDuration);
      return formatDuration(baseMinutes + 90); // +1h30 pour l'escale
    }

    return baseDuration;
  }

  private calculateTotalDuration(flights: ScrapedFlight[]): string {
    let totalMinutes = 0;

    flights.forEach((flight) => {
      totalMinutes += parseDuration(flight.duration);
    });

    return formatDuration(totalMinutes);
  }
}
