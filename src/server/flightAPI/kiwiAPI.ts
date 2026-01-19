/**
 * Kiwi.com Tequila API Client
 * 
 * Documentation: https://tequila.kiwi.com/portal/docs/tequila_api
 * Endpoint: https://tequila-api.kiwi.com/v2/search
 */

import { FlightResult } from "@/types/flight";

interface KiwiSearchParams {
    origin: string;          // IATA code
    destination: string;     // IATA code
    departureDate: string;   // YYYY-MM-DD format
    returnDate?: string;     // YYYY-MM-DD format (optional for round-trip)
    passengers: number;
    cabinClass?: string;
    currency?: string;
    maxStopovers?: number;
}

interface KiwiFlightSegment {
    flyFrom: string;
    flyTo: string;
    cityFrom: string;
    cityTo: string;
    airline: string;
    flight_no: number;
    operating_carrier: string;
    local_departure: string;
    local_arrival: string;
    utc_departure: string;
    utc_arrival: string;
}

interface KiwiFlightResult {
    id: string;
    flyFrom: string;
    flyTo: string;
    cityFrom: string;
    cityTo: string;
    price: number;
    airlines: string[];
    route: KiwiFlightSegment[];
    duration: {
        departure: number;  // seconds
        return: number;     // seconds
        total: number;      // seconds
    };
    deep_link: string;
    local_departure: string;
    local_arrival: string;
    bags_price?: { [key: string]: number };
}

interface KiwiSearchResponse {
    search_id: string;
    data: KiwiFlightResult[];
    currency: string;
    fx_rate: number;
    _results: number;
}

export class KiwiAPI {
    private apiKey: string;
    private baseUrl = "https://tequila-api.kiwi.com";

    constructor() {
        this.apiKey = process.env.KIWI_API_KEY || "";
    }

    /**
     * Check if API key is configured
     */
    isAvailable(): boolean {
        return this.apiKey.length > 0;
    }

    /**
     * Convert date from YYYY-MM-DD to dd/mm/YYYY (Kiwi format)
     */
    private formatDate(date: string): string {
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
    }

    /**
     * Convert duration in seconds to human readable format
     */
    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    /**
     * Map Kiwi cabin class to standard format
     */
    private mapCabinClass(cabin?: string): string {
        const mapping: Record<string, string> = {
            "ECONOMY": "M",
            "PREMIUM_ECONOMY": "W",
            "BUSINESS": "C",
            "FIRST": "F"
        };
        return mapping[cabin || "ECONOMY"] || "M";
    }

    /**
     * Search flights using Kiwi Tequila API
     */
    async searchFlights(params: KiwiSearchParams): Promise<FlightResult[]> {
        if (!this.isAvailable()) {
            console.log("⚠️ Kiwi API: Clé API non configurée");
            return [];
        }

        try {
            console.log("🔍 Kiwi API: Recherche de vols...", params);

            const queryParams = new URLSearchParams({
                fly_from: params.origin,
                fly_to: params.destination,
                date_from: this.formatDate(params.departureDate),
                date_to: this.formatDate(params.departureDate),
                adults: params.passengers.toString(),
                curr: params.currency || "EUR",
                selected_cabins: this.mapCabinClass(params.cabinClass),
                partner: "picky",
                max_stopovers: (params.maxStopovers ?? 2).toString(),
                limit: "20"
            });

            // Add return date for round-trip
            if (params.returnDate) {
                queryParams.append("return_from", this.formatDate(params.returnDate));
                queryParams.append("return_to", this.formatDate(params.returnDate));
            }

            const response = await fetch(
                `${this.baseUrl}/v2/search?${queryParams.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "apikey": this.apiKey,
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip"
                    }
                }
            );

            if (!response.ok) {
                console.error("❌ Kiwi API Error:", response.status, response.statusText);
                const errorText = await response.text();
                console.error("   Details:", errorText);
                return [];
            }

            const data: KiwiSearchResponse = await response.json();
            console.log(`✅ Kiwi API: ${data._results} vols trouvés`);

            return this.parseResults(data);

        } catch (error) {
            console.error("❌ Kiwi API Exception:", error);
            return [];
        }
    }

    /**
     * Parse Kiwi results to standard FlightResult format
     */
    private parseResults(response: KiwiSearchResponse): FlightResult[] {
        return response.data.map((flight) => {
            // Build segments from route
            const segments = flight.route.map((leg) => ({
                origin: leg.flyFrom,
                destination: leg.flyTo,
                departureTime: leg.local_departure,
                arrivalTime: leg.local_arrival,
                airline: leg.operating_carrier || leg.airline,
                flightNumber: `${leg.airline}${leg.flight_no}`,
                duration: this.formatDuration(
                    (new Date(leg.local_arrival).getTime() - new Date(leg.local_departure).getTime()) / 1000
                )
            }));

            // Calculate total stops
            const stops = flight.route.length - 1;

            return {
                id: `kiwi-${flight.id}`,
                origin: flight.flyFrom,
                destination: flight.flyTo,
                departureTime: flight.local_departure,
                arrivalTime: flight.local_arrival,
                duration: this.formatDuration(flight.duration.departure || flight.duration.total),
                stops,
                airline: flight.airlines[0] || "Unknown",
                flightNumber: segments[0]?.flightNumber || "",
                price: {
                    amount: flight.price,
                    currency: response.currency
                },
                segments,
                cabinClass: "Economy",
                aircraft: "",
                provider: "Kiwi.com",
                bookingLink: flight.deep_link
            } as FlightResult;
        });
    }

    /**
     * Get airline name from IATA code
     */
    async getAirlineName(code: string): Promise<string> {
        // Simple mapping for common airlines
        const airlines: Record<string, string> = {
            "AH": "Air Algérie",
            "AF": "Air France",
            "KQ": "Kenya Airways",
            "TK": "Turkish Airlines",
            "EK": "Emirates",
            "QR": "Qatar Airways",
            "ET": "Ethiopian Airlines",
            "LH": "Lufthansa",
            "BA": "British Airways",
            "IB": "Iberia"
        };
        return airlines[code] || code;
    }
}

// Singleton instance
let kiwiAPIInstance: KiwiAPI | null = null;

export function getKiwiAPI(): KiwiAPI {
    if (!kiwiAPIInstance) {
        kiwiAPIInstance = new KiwiAPI();
    }
    return kiwiAPIInstance;
}
