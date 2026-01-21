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
    baggage?: {
      included: boolean;
      weight?: string;
    };
    leg?: "ALLER" | "RETOUR";
    stops?: number;  // Nombre d'escales dans ce segment
    bookingUrl?: string; // Lien de réservation pour ce segment via Kayak/Partenaire
    subSegments?: {  // Détails des sous-segments (escales)
      origin: string;
      destination: string;
      airline: string;
      flightNumber: string;
      departureTime: string;
      arrivalTime: string;
      duration: string;
    }[];
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
  bookingUrl?: string;
}
