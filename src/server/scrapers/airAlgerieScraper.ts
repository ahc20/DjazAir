import { BaseScraper } from './baseScraper';
import { AirlineScraper, ScrapingResult, FlightSearchParams, ScrapedFlightData, ScrapedFlight } from './types';
import { sleep, sanitizeText, extractNumber, extractCurrency, parseDuration, formatDuration } from '@/lib/scrapingUtils';

export class AirAlgerieScraper extends BaseScraper implements AirlineScraper {
  constructor() {
    super('Air Algérie', 'https://www.airalgerie.dz', {
      timeout: 45000,
      retries: 3,
      delay: 2000,
      maxConcurrent: 1
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
      console.log(`🔍 Recherche Air Algérie: ${params.origin} → ${params.destination} le ${params.departureDate}`);
      
      // Simulation de recherche avec délai réaliste
      await sleep(2000 + Math.random() * 3000);
      
      const results = await this.simulateSearchResults(params);
      
      return this.createSuccessResult(results);
    } catch (error) {
      console.error(`❌ Erreur Air Algérie: ${error}`);
      return this.createErrorResult(`Erreur de recherche: ${error}`);
    }
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    // Taux de change simulés basés sur des données réalistes
    return {
      'EUR': 1.0,
      'DZD': 145.5, // Taux officiel approximatif
      'USD': 1.08,
      'GBP': 0.86
    };
  }

  private async simulateSearchResults(params: FlightSearchParams): Promise<ScrapedFlightData[]> {
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
          currency: directFlights[0].price?.currency || 'EUR',
          originalCurrency: 'DZD',
          exchangeRate: 145.5
        },
        searchTimestamp: new Date(),
        provider: this.name,
        direct: true,
        stops: 0,
        duration: directFlights[0].duration,
        cabinClass: 'Economy'
      });
    }

    // Recherche via Alger (si applicable)
    if (params.origin !== 'ALG' && params.destination !== 'ALG') {
      const viaAlgiersFlights = this.generateViaAlgiersFlights(params);
      if (viaAlgiersFlights.length > 0) {
        results.push({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          flights: viaAlgiersFlights,
          totalPrice: {
            amount: viaAlgiersFlights[0].price?.amount || 0,
            currency: viaAlgiersFlights[0].price?.currency || 'EUR',
            originalCurrency: 'DZD',
            exchangeRate: 145.5
          },
          searchTimestamp: new Date(),
          provider: this.name,
          direct: false,
          stops: 1,
          duration: this.calculateTotalDuration(viaAlgiersFlights),
          cabinClass: 'Economy'
        });
      }
    }

    return results;
  }

  private generateDirectFlights(params: FlightSearchParams): ScrapedFlight[] {
    const flights: ScrapedFlight[] = [];
    
    // Vols directs simulés
    const basePrice = this.getBasePrice(params.origin, params.destination);
    const departureTimes = ['08:00', '14:30', '21:15'];
    
    departureTimes.forEach((time, index) => {
      const priceVariation = 1 + (index * 0.1) + (Math.random() * 0.2 - 0.1);
      const price = basePrice * priceVariation;
      
      flights.push({
        flightNumber: `AH${1000 + index}`,
        airline: 'Air Algérie',
        airlineCode: 'AH',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T${time}:00`,
        arrivalTime: this.calculateArrivalTime(params.origin, params.destination, time),
        duration: this.calculateFlightDuration(params.origin, params.destination),
        aircraft: 'Airbus A330-200',
        cabinClass: 'Economy',
        price: {
          amount: Math.round(price * 100) / 100,
          currency: 'EUR'
        }
      });
    });

    return flights.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
  }

  private generateViaAlgiersFlights(params: FlightSearchParams): ScrapedFlight[] {
    const flights: ScrapedFlight[] = [];
    
    // Vols via Alger
    const originToAlgiers = this.generateDirectFlights({
      ...params,
      destination: 'ALG'
    });
    
    const algiersToDestination = this.generateDirectFlights({
      ...params,
      origin: 'ALG'
    });

    if (originToAlgiers.length > 0 && algiersToDestination.length > 0) {
      const outbound = originToAlgiers[0];
      const inbound = algiersToDestination[0];
      
      // Calcul du prix total et de la durée
      const totalPrice = (outbound.price?.amount || 0) + (inbound.price?.amount || 0);
      const totalDuration = this.addDurations(outbound.duration, inbound.duration);
      
      flights.push({
        flightNumber: `${outbound.flightNumber}+${inbound.flightNumber}`,
        airline: 'Air Algérie',
        airlineCode: 'AH',
        origin: params.origin,
        destination: params.destination,
        departureTime: outbound.departureTime,
        arrivalTime: inbound.arrivalTime,
        duration: totalDuration,
        aircraft: 'Airbus A330-200',
        cabinClass: 'Economy',
        price: {
          amount: Math.round(totalPrice * 100) / 100,
          currency: 'EUR'
        }
      });
    }

    return flights;
  }

  private getBasePrice(origin: string, destination: string): number {
    // Prix de base simulés basés sur la distance
    const routes: Record<string, number> = {
      'CDG-DXB': 450, // Paris-Dubai
      'CDG-ALG': 180, // Paris-Alger
      'ALG-DXB': 320, // Alger-Dubai
      'CDG-IST': 280, // Paris-Istanbul
      'CDG-CAI': 350, // Paris-Le Caire
      'CDG-BEY': 380, // Paris-Beyrouth
    };
    
    const route = `${origin}-${destination}`;
    return routes[route] || 300;
  }

  private calculateArrivalTime(origin: string, destination: string, departureTime: string): string {
    const duration = this.calculateFlightDuration(origin, destination);
    const [hours, minutes] = duration.split('h').map(s => parseInt(s) || 0);
    
    const [depHour, depMin] = departureTime.split(':').map(s => parseInt(s));
    let arrHour = depHour + hours;
    let arrMin = depMin + minutes;
    
    if (arrMin >= 60) {
      arrHour += Math.floor(arrMin / 60);
      arrMin %= 60;
    }
    
    if (arrHour >= 24) {
      arrHour -= 24;
    }
    
    return `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;
  }

  private calculateFlightDuration(origin: string, destination: string): string {
    const durations: Record<string, string> = {
      'CDG-DXB': '6h 45m',
      'CDG-ALG': '2h 15m',
      'ALG-DXB': '4h 30m',
      'CDG-IST': '3h 20m',
      'CDG-CAI': '4h 15m',
      'CDG-BEY': '4h 45m',
    };
    
    const route = `${origin}-${destination}`;
    return durations[route] || '3h 00m';
  }

  private calculateTotalDuration(flights: ScrapedFlight[]): string {
    let totalMinutes = 0;
    
    flights.forEach(flight => {
      totalMinutes += parseDuration(flight.duration);
    });
    
    return formatDuration(totalMinutes);
  }

  private addDurations(duration1: string, duration2: string): string {
    const minutes1 = parseDuration(duration1);
    const minutes2 = parseDuration(duration2);
    const totalMinutes = minutes1 + minutes2 + 120; // +2h pour la correspondance
    
    return formatDuration(totalMinutes);
  }
}
