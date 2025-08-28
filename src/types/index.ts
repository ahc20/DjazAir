export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabin?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currency: "EUR";
}

export interface FlightOption {
  carrier: string;
  priceEUR: number;
  duration: string;
  bookingUrl?: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: number;
}

export interface FlightSearchResult {
  bestDirectPriceEUR: number | null;
  bestViaPriceEUR?: number;
  options: FlightOption[];
}

export interface ArbitrageResult {
  directPriceEUR: number;
  viaAlgiersPriceEUR: number;
  savingsEUR: number;
  savingsPercent: number;
  isDeal: boolean;
  viaBreakdown: {
    originToAlgiersEUR: number;
    algiersToDestinationDZD: number;
    algiersToDestinationEUR: number;
    totalViaAlgiersEUR: number;
  };
  risks: {
    separateTickets: boolean;
    visaRequired: boolean;
    connectionRisk: boolean;
  };
}

export interface LocalFareAssumption {
  id: string;
  routeKey: string;
  dateFrom: Date;
  dateTo: Date;
  carrier?: string;
  fareDzdMin: number;
  fareDzdMax: number;
  notes?: string;
}

export interface AppConfig {
  eurToDzdCustomRate: number;
  showViaAlgiers: boolean;
  minSavingsPercent: number;
  riskBufferMinutes: number;
  legalDisclaimer: string;
}

export type ExchangeRateMode = "official" | "custom";

export interface User {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
}
