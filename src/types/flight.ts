export interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  airline: string;
  flightNumber: string;
  price: {
    amount: number;
    currency: string;
  };
  stops: number;
}
