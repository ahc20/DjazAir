export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currency: 'EUR';
}

export interface FlightOption {
  carrier: string;
  priceEUR: number;
  duration: string;
  bookingUrl?: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: number;
  flightNumber?: string;
}

export interface FlightSearchResult {
  bestDirectPriceEUR: number | null;
  bestViaPriceEUR?: number;
  options: FlightOption[];
  provider: string;
  searchId?: string;
}

export interface FlightProvider {
  searchRoundTrip(params: FlightSearchParams): Promise<FlightSearchResult>;
  getProviderName(): string;
  isAvailable(): boolean;
}

export interface AmadeusToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export interface AmadeusFlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    segments: Array<{
      carrierCode: string;
      number: string;
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      duration: string;
    }>;
  }>;
  numberOfBookableSeats: number;
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
}

export interface KiwiFlight {
  id: string;
  price: number;
  currency: string;
  route: Array<{
    cityFrom: string;
    cityTo: string;
    cityCodeFrom: string;
    cityCodeTo: string;
    airline: string;
    flight_no: string;
    departureTime: number;
    arrivalTime: number;
    duration: number;
  }>;
  booking_token: string;
  deep_link: string;
}
