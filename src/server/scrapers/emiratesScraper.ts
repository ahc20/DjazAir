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

export class EmiratesScraper extends BaseScraper implements AirlineScraper {
  constructor() {
    super("Emirates", "https://www.emirates.com", {
      timeout: 50000,
      retries: 3,
      delay: 1800,
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
        `🔍 Recherche Emirates: ${params.origin} → ${params.destination} le ${params.departureDate}`
      );

      // Simulation de recherche avec délai réaliste
      await sleep(1800 + Math.random() * 2500);

      const results = await this.simulateSearchResults(params);

      return this.createSuccessResult(results);
    } catch (error) {
      console.error(`❌ Erreur Emirates: ${error}`);
      return this.createErrorResult(`Erreur de recherche: ${error}`);
    }
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    return {
      EUR: 1.0,
      USD: 1.08,
      GBP: 0.86,
      AED: 4.02, // Dirham des Émirats
      SAR: 4.05, // Riyal saoudien
      QAR: 3.95, // Riyal qatari
      BHD: 0.41, // Dinar bahreïni
      KWD: 0.33, // Dinar koweïtien
      OMR: 0.42, // Rial omanais
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

    // Recherche avec escale via Dubai
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

    // Vols directs simulés (Emirates a beaucoup de vols directs)
    const basePrice = this.getBasePrice(params.origin, params.destination);
    const departureTimes = ["06:45", "11:20", "16:55", "23:30"];

    departureTimes.forEach((time, index) => {
      const priceVariation = 1 + index * 0.08 + (Math.random() * 0.12 - 0.06);
      const price = basePrice * priceVariation;

      flights.push({
        flightNumber: `EK${4000 + index}`,
        airline: "Emirates",
        airlineCode: "EK",
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
        aircraft: "Boeing 777-300ER",
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

    // Vols avec escale via Dubai (DXB)
    if (params.origin !== "DXB" && params.destination !== "DXB") {
      const basePrice =
        this.getBasePrice(params.origin, params.destination) * 0.75; // Prix réduit pour les escales
      const departureTimes = ["08:15", "14:45", "20:30"];

      departureTimes.forEach((time, index) => {
        const priceVariation =
          1 + index * 0.15 + (Math.random() * 0.25 - 0.125);
        const price = basePrice * priceVariation;

        flights.push({
          flightNumber: `EK${5000 + index}`,
          airline: "Emirates",
          airlineCode: "EK",
          origin: params.origin,
          destination: params.destination,
          departureTime: `${params.departureDate}T${time}:00`,
          arrivalTime: this.calculateArrivalTime(
            params.origin,
            params.destination,
            time,
            true
          ),
          duration: this.calculateFlightDuration(
            params.origin,
            params.destination,
            true
          ),
          aircraft: "Airbus A380-800",
          cabinClass: "Economy",
          price: {
            amount: Math.round(price * 100) / 100,
            currency: "EUR",
          },
        });
      });
    }

    return flights.sort(
      (a, b) => (a.price?.amount || 0) - (b.price?.amount || 0)
    );
  }

  private getBasePrice(origin: string, destination: string): number {
    const routes: Record<string, number> = {
      "CDG-DXB": 480, // Paris-Dubai
      "CDG-AUH": 520, // Paris-Abu Dhabi
      "CDG-DOH": 490, // Paris-Doha
      "CDG-RUH": 540, // Paris-Riyadh
      "CDG-JED": 530, // Paris-Jeddah
      "CDG-AMM": 420, // Paris-Amman
      "CDG-BEY": 450, // Paris-Beyrouth
      "CDG-CAI": 380, // Paris-Le Caire
      "CDG-IST": 320, // Paris-Istanbul
      "CDG-LHR": 180, // Paris-Londres
      "CDG-FRA": 150, // Paris-Francfort
      "CDG-AMS": 140, // Paris-Amsterdam
    };

    const route = `${origin}-${destination}`;
    return routes[route] || 400;
  }

  private calculateArrivalTime(
    origin: string,
    destination: string,
    departureTime: string,
    withConnection: boolean = false
  ): string {
    const duration = this.calculateFlightDuration(
      origin,
      destination,
      withConnection
    );
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
      "CDG-DXB": "6h 45m",
      "CDG-AUH": "6h 50m",
      "CDG-DOH": "6h 35m",
      "CDG-RUH": "6h 55m",
      "CDG-JED": "6h 40m",
      "CDG-AMM": "4h 45m",
      "CDG-BEY": "4h 50m",
      "CDG-CAI": "4h 15m",
      "CDG-IST": "3h 20m",
      "CDG-LHR": "1h 15m",
      "CDG-FRA": "1h 10m",
      "CDG-AMS": "1h 20m",
    };

    const route = `${origin}-${destination}`;
    let baseDuration = durations[route] || "4h 30m";

    if (withConnection) {
      const baseMinutes = parseDuration(baseDuration);
      return formatDuration(baseMinutes + 120); // +2h pour l'escale à Dubai
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
