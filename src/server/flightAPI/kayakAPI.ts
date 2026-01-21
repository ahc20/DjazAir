/**
 * Kayak Flight API via Piloterr
 * Documentation: https://www.piloterr.com/api-library/kayak-flight
 */

import { AmadeusFlightResult } from "../flightSearch/amadeusAPI";

interface KayakFlightResponse {
    flights: KayakFlight[];
}

interface KayakFlight {
    departure: string;
    arrival: string;
    airline: string;
    flight_number: string;
    duration: string;
    price: string;
    aircraft?: string;
    stopovers: number;
    segments?: KayakSegment[];
}

interface KayakSegment {
    departure: string;
    arrival: string;
    airline: string;
    flight_number: string;
    origin: string;
    destination: string;
    duration: string;
}

export class KayakAPI {
    private apiKey: string;
    private baseUrl = "https://piloterr.com/api/v2/kayak/flight";

    constructor() {
        this.apiKey = process.env.PILOTERR_API_KEY || "";
    }

    /**
     * Vérifie si l'API est disponible
     */
    isAvailable(): boolean {
        return !!this.apiKey;
    }

    /**
     * Recherche de vols via Kayak/Piloterr
     */
    async searchFlights(params: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengers?: number;
        cabinClass?: string;
    }): Promise<AmadeusFlightResult[]> {
        if (!this.isAvailable()) {
            throw new Error("Kayak/Piloterr API non configurée");
        }

        try {
            console.log(`🔍 Recherche Kayak: ${params.origin} → ${params.destination}`);

            // Construire la query pour Kayak
            // Format: "PAR-JED, 2026-02-12, 1 passager, économique"
            const query = this.buildQuery(params);

            const response = await fetch(`${this.baseUrl}?query=${encodeURIComponent(query)}`, {
                method: "GET",
                headers: {
                    "x-api-key": this.apiKey,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Kayak API Error: ${response.status} - ${errorText}`);
                throw new Error(`Kayak API Error: ${response.status}`);
            }

            const data: KayakFlightResponse = await response.json();
            console.log(`✅ Kayak: ${data.flights?.length || 0} vols trouvés`);

            return this.parseResults(data, params);
        } catch (error) {
            console.error("❌ Erreur Kayak API:", error);
            throw error;
        }
    }

    /**
     * Construit la query de recherche au format Kayak
     */
    private buildQuery(params: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengers?: number;
        cabinClass?: string;
    }): string {
        const parts = [
            `${params.origin}-${params.destination}`,
            params.departureDate,
        ];

        if (params.returnDate) {
            parts.push(params.returnDate);
        }

        parts.push(`${params.passengers || 1} passenger${(params.passengers || 1) > 1 ? 's' : ''}`);
        parts.push(params.cabinClass || 'economy');

        return parts.join(', ');
    }

    /**
     * Parse les résultats Kayak vers le format AmadeusFlightResult
     */
    private parseResults(
        data: KayakFlightResponse,
        params: { origin: string; destination: string; departureDate: string; cabinClass?: string }
    ): AmadeusFlightResult[] {
        if (!data.flights || !Array.isArray(data.flights)) {
            return [];
        }

        return data.flights.map((flight, index) => {
            // Extraire le prix (format: "€150" ou "$200")
            const priceMatch = flight.price?.match(/[\d,.]+/);
            const priceAmount = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;

            // Extraire le code compagnie du numéro de vol
            const airlineCode = flight.flight_number?.substring(0, 2) || 'XX';

            // Parser la durée
            const duration = flight.duration || 'N/A';

            // Construire les segments si disponibles
            const segments = flight.segments?.map(seg => ({
                origin: seg.origin || params.origin,
                destination: seg.destination || params.destination,
                departureTime: seg.departure || flight.departure,
                arrivalTime: seg.arrival || flight.arrival,
                airline: seg.airline || flight.airline,
                flightNumber: seg.flight_number || flight.flight_number,
                duration: seg.duration || duration,
            })) || [{
                origin: params.origin,
                destination: params.destination,
                departureTime: flight.departure,
                arrivalTime: flight.arrival,
                airline: flight.airline,
                flightNumber: flight.flight_number,
                duration: duration,
            }];

            return {
                id: `kayak-${index}-${Date.now()}`,
                airline: flight.airline || 'Unknown',
                airlineCode: airlineCode,
                flightNumber: flight.flight_number || `${airlineCode}${index}`,
                origin: params.origin,
                destination: params.destination,
                departureTime: flight.departure,
                arrivalTime: flight.arrival,
                duration: duration,
                stops: flight.stopovers || 0,
                price: {
                    amount: priceAmount,
                    currency: flight.price?.startsWith('€') ? 'EUR' : 'USD',
                },
                aircraft: flight.aircraft || 'N/A',
                cabinClass: params.cabinClass || 'Economy',
                provider: 'Kayak',
                direct: (flight.stopovers || 0) === 0,
                baggage: {
                    included: false,
                    details: 'Vérifier sur le site de la compagnie',
                },
                segments: segments,
            };
        });
    }
}

// Instance singleton
export const kayakAPI = new KayakAPI();
