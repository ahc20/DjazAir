export interface ScrapedFlightData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  flights: ScrapedFlight[];
  totalPrice: {
    amount: number;
    currency: string;
    originalCurrency?: string;
    exchangeRate?: number;
  };
  searchTimestamp: Date;
  provider: string;
  direct: boolean;
  stops: number;
  duration: string;
  cabinClass: string;
}

export interface ScrapedFlight {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft?: string;
  cabinClass: string;
  price?: {
    amount: number;
    currency: string;
  };
}

export interface ScrapingResult {
  success: boolean;
  data?: ScrapedFlightData[];
  error?: string;
  provider: string;
  timestamp: Date;
}

export interface ScrapingConfig {
  userAgent: string;
  timeout: number;
  retries: number;
  delay: number;
  maxConcurrent: number;
}

export interface AirlineScraper {
  name: string;
  baseUrl: string;
  isAvailable(): Promise<boolean>;
  searchFlights(params: FlightSearchParams): Promise<ScrapingResult>;
  getExchangeRates(): Promise<Record<string, number>>;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
  currency?: string;
}

export interface ScrapingSession {
  id: string;
  searchParams: FlightSearchParams;
  startTime: Date;
  status: "pending" | "running" | "completed" | "failed";
  results: ScrapingResult[];
  error?: string;
}
