/**
 * Duffel API Client
 * 
 * Documentation: https://duffel.com/docs/api/overview
 * Endpoint: https://api.duffel.com
 */

import { FlightResult } from "@/types/flight";

interface DuffelSearchParams {
    origin: string;          // IATA code
    destination: string;     // IATA code
    departureDate: string;   // YYYY-MM-DD format
    returnDate?: string;     // YYYY-MM-DD format (optional for round-trip)
    passengers: number;
    cabinClass?: string;
    currency?: string;
}

interface DuffelSlice {
    origin: { iata_code: string; name: string; city_name: string };
    destination: { iata_code: string; name: string; city_name: string };
    departure_date: string;
    segments: DuffelSegment[];
    duration: string;  // ISO 8601 duration (e.g., "PT2H30M")
}

interface DuffelSegment {
    origin: { iata_code: string; name: string };
    destination: { iata_code: string; name: string };
    departing_at: string;
    arriving_at: string;
    operating_carrier: { iata_code: string; name: string; logo_symbol_url: string };
    marketing_carrier: { iata_code: string; name: string };
    marketing_carrier_flight_number: string;
    aircraft: { name: string };
    duration: string;
}

interface DuffelOffer {
    id: string;
    total_amount: string;
    total_currency: string;
    base_amount: string;
    slices: DuffelSlice[];
    owner: { iata_code: string; name: string; logo_symbol_url: string };
    passengers: any[];
    payment_requirements: any;
}

interface DuffelOfferRequestResponse {
    data: {
        id: string;
        offers: DuffelOffer[];
        slices: any[];
        passengers: any[];
    };
}

export class DuffelAPI {
    private apiKey: string;
    private baseUrl = "https://api.duffel.com";

    constructor() {
        this.apiKey = process.env.DUFFEL_API_KEY || "";
    }

    /**
     * Check if API key is configured
     */
    isAvailable(): boolean {
        return this.apiKey.length > 0;
    }

    /**
     * Parse ISO 8601 duration to human readable format
     * e.g., "PT2H30M" -> "2h 30m"
     */
    private formatDuration(isoDuration: string): string {
        if (!isoDuration) return "N/A";
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return isoDuration;
        const hours = match[1] || "0";
        const minutes = match[2] || "0";
        return `${hours}h ${minutes}m`;
    }

    /**
     * Map cabin class to Duffel format
     */
    private mapCabinClass(cabin?: string): string {
        const mapping: Record<string, string> = {
            "ECONOMY": "economy",
            "PREMIUM_ECONOMY": "premium_economy",
            "BUSINESS": "business",
            "FIRST": "first"
        };
        return mapping[cabin || "ECONOMY"] || "economy";
    }

    /**
     * Search flights using Duffel Offer Requests API
     */
    async searchFlights(params: DuffelSearchParams): Promise<FlightResult[]> {
        if (!this.isAvailable()) {
            console.log("⚠️ Duffel API: Clé API non configurée");
            return [];
        }

        try {
            console.log("🔍 Duffel API: Recherche de vols...", params);

            // Build slices (one for one-way, two for round-trip)
            const slices: any[] = [
                {
                    origin: params.origin,
                    destination: params.destination,
                    departure_date: params.departureDate
                }
            ];

            // Add return slice for round-trip
            if (params.returnDate) {
                slices.push({
                    origin: params.destination,
                    destination: params.origin,
                    departure_date: params.returnDate
                });
            }

            // Build passengers array
            const passengers: any[] = [];
            for (let i = 0; i < params.passengers; i++) {
                passengers.push({ type: "adult" });
            }

            const requestBody = {
                data: {
                    slices,
                    passengers,
                    cabin_class: this.mapCabinClass(params.cabinClass),
                    return_offers: true
                }
            };

            const response = await fetch(
                `${this.baseUrl}/air/offer_requests`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Duffel-Version": "v2"
                    },
                    body: JSON.stringify(requestBody)
                }
            );

            if (!response.ok) {
                console.error("❌ Duffel API Error:", response.status, response.statusText);
                const errorText = await response.text();
                console.error("   Details:", errorText);
                return [];
            }

            const data: DuffelOfferRequestResponse = await response.json();
            console.log(`✅ Duffel API: ${data.data.offers?.length || 0} offres trouvées`);

            return this.parseOffers(data.data.offers || []);

        } catch (error) {
            console.error("❌ Duffel API Exception:", error);
            return [];
        }
    }

    /**
     * Parse Duffel offers to standard FlightResult format
     */
    private parseOffers(offers: DuffelOffer[]): FlightResult[] {
        return offers.slice(0, 20).map((offer) => {
            // Get first slice for outbound info
            const outboundSlice = offer.slices[0];
            const segments = outboundSlice?.segments || [];

            // Build segments array
            const parsedSegments = segments.map((seg) => ({
                origin: seg.origin.iata_code,
                destination: seg.destination.iata_code,
                departureTime: seg.departing_at,
                arrivalTime: seg.arriving_at,
                airline: seg.operating_carrier.name,
                flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
                duration: this.formatDuration(seg.duration),
                aircraft: seg.aircraft?.name || ""
            }));

            // Calculate total stops
            const stops = segments.length - 1;

            // Get first and last segment times
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            return {
                id: `duffel-${offer.id}`,
                origin: outboundSlice?.origin?.iata_code || "",
                destination: outboundSlice?.destination?.iata_code || "",
                departureTime: firstSegment?.departing_at || "",
                arrivalTime: lastSegment?.arriving_at || "",
                duration: this.formatDuration(outboundSlice?.duration || ""),
                stops,
                airline: offer.owner?.name || segments[0]?.operating_carrier?.name || "Unknown",
                flightNumber: parsedSegments[0]?.flightNumber || "",
                price: {
                    amount: parseFloat(offer.total_amount),
                    currency: offer.total_currency
                },
                segments: parsedSegments,
                cabinClass: "Economy",
                aircraft: parsedSegments[0]?.aircraft || "",
                provider: "Duffel",
                airlineLogo: offer.owner?.logo_symbol_url || ""
            } as FlightResult;
        });
    }
}

// Singleton instance
let duffelAPIInstance: DuffelAPI | null = null;

export function getDuffelAPI(): DuffelAPI {
    if (!duffelAPIInstance) {
        duffelAPIInstance = new DuffelAPI();
    }
    return duffelAPIInstance;
}
