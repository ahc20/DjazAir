export interface DjazAirFlight {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  totalDuration: string;
  totalPriceEUR: number;
  totalPriceDZD?: number;
  segments: {
    origin: string;
    destination: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    priceEUR: number;
    priceDZD?: number;
    currency: string;
  }[];
  layover: {
    airport: string;
    duration: string;
    location: string;
  };
  savings: {
    amount: number;
    percentage: number;
    comparedTo: number;
  };
}
