import { AirlineScraper, FlightSearchParams, ScrapingResult, ScrapedFlightData } from "../scrapers/types";

export class VolzScraper implements AirlineScraper {
    name = "Volz.app";
    baseUrl = "https://api.volz.app/v1";

    async isAvailable(): Promise<boolean> {
        return true;
    }

    async searchFlights(params: FlightSearchParams): Promise<ScrapingResult> {
        try {
            console.log(`🚀 [Volz] Recherche ${params.origin} → ${params.destination} (${params.departureDate})`);

            const payload = {
                trip_type: params.returnDate ? "RT" : "OW",
                adults: params.passengers || 1,
                children: 0,
                held_infants: 0,
                seated_infants: 0,
                max_connections: 2,
                refundable: 0,
                luggage_included: 0,
                cabin: params.cabinClass?.toUpperCase() || "ECONOMY",
                destinations: [
                    {
                        origin: params.origin,
                        destination: params.destination,
                        departure_date: params.departureDate,
                        ...(params.returnDate ? { return_date: params.returnDate } : {})
                    }
                ],
                sort: "price",
                desc: false,
                itinerary_stops: {},
                currency: "DZD",
                locale: "fr"
            };

            const response = await fetch(`${this.baseUrl}/flight/availability`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://volz.app",
                    "Referer": "https://volz.app/"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur Volz API: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const results = this.parseResults(data, params);

            return {
                success: true,
                data: results,
                provider: this.name,
                timestamp: new Date()
            };

        } catch (error: any) {
            console.error("❌ Erreur Volz Scraper:", error);
            return {
                success: false,
                error: error.message,
                provider: this.name,
                timestamp: new Date()
            };
        }
    }

    private parseResults(data: any, params: FlightSearchParams): ScrapedFlightData[] {
        const offers = data.data || [];
        if (offers.length === 0) return [];

        return offers.map((offer: any) => {
            const firstLeg = offer.itineraries?.[0];
            if (!firstLeg) return null;

            return {
                origin: params.origin,
                destination: params.destination,
                departureDate: params.departureDate,
                returnDate: params.returnDate,
                flights: offer.itineraries.flatMap((it: any) => it.segments.map((seg: any) => ({
                    flightNumber: seg.marketing_flight_number || seg.flight_number,
                    airline: seg.marketing_carrier_name || seg.operating_carrier_name || "Air Algérie",
                    airlineCode: seg.marketing_carrier || seg.operating_carrier || "AH",
                    origin: seg.origin,
                    destination: seg.destination,
                    departureTime: seg.departure_at,
                    arrivalTime: seg.arrival_at,
                    duration: `${Math.floor(seg.duration / 60)}h ${seg.duration % 60}m`,
                    cabinClass: params.cabinClass || "Economy"
                }))),
                totalPrice: {
                    amount: offer.price?.total || 0,
                    currency: "DZD",
                    originalCurrency: "DZD"
                },
                searchTimestamp: new Date(),
                provider: this.name,
                direct: offer.itineraries.every((it: any) => it.segments.length === 1),
                stops: offer.itineraries.reduce((acc: number, it: any) => acc + it.segments.length - 1, 0),
                duration: offer.itineraries[0].duration_text || "N/A",
                cabinClass: params.cabinClass || "Economy"
            };
        }).filter(Boolean);
    }

    async getExchangeRates(): Promise<Record<string, number>> {
        return { "DZD": 1 };
    }
}
