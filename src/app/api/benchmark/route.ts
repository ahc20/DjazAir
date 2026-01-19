import { NextResponse } from 'next/server';
import { googleFlightsScraper } from '@/server/scrapers/googleFlightsDZDScraper';
import { AmadeusAPI } from '@/server/flightSearch/amadeusAPI';

const amadeus = new AmadeusAPI(
    process.env.AMADEUS_CLIENT_ID || '',
    process.env.AMADEUS_CLIENT_SECRET || ''
);

const DESTINATIONS = [
    { code: 'PEK', name: 'Pékin' },
    { code: 'YUL', name: 'Montréal' },
    { code: 'JNB', name: 'Johannesburg' },
    { code: 'ADD', name: 'Addis Ababa' },
    { code: 'DJG', name: 'Djanet' },
    { code: 'DSS', name: 'Dakar' },
    { code: 'BKO', name: 'Bamako' }
];

// Fixed test date: ~2 months out
const DEPARTURE_DATE = '2026-03-10'; // Using a reasonable future date

export async function GET() {
    const results = [];

    // 1. Get Base Leg Cost (CDG -> ALG)
    // We assume a standard low cost or DZD optimized price for this leg
    // Real check via scraper
    let baseLegPriceEUR = 100; // Fallback
    try {
        const baseLeg = await googleFlightsScraper.searchDZDPrice('CDG', 'ALG', DEPARTURE_DATE);
        if (baseLeg) baseLegPriceEUR = baseLeg.priceEUR;
    } catch (e) {
        console.error("Error fetching base leg", e);
    }

    for (const dest of DESTINATIONS) {
        try {
            console.log(`Testing ${dest.name} (${dest.code})...`);

            // A. Classic Price (Direct or Standard connection)
            // We can simulate this using Amadeus search from CDG -> DEST
            let classicPrice = 0;
            try {
                if (amadeus.isAvailable()) {
                    const classicSearch = await amadeus.searchFlights({
                        origin: 'CDG',
                        destination: dest.code,
                        departureDate: DEPARTURE_DATE,
                        passengers: 1,
                        currency: 'EUR'
                    });
                    if (classicSearch && classicSearch.length > 0) {
                        classicPrice = classicSearch[0].price.amount;
                    }
                }
            } catch (e) { console.error("Amadeus error", e) }


            // B. DjazAir Price (via ALG)
            // Check ALG -> DEST price in DZD
            const leg2 = await googleFlightsScraper.searchDZDPrice('ALG', dest.code, DEPARTURE_DATE);

            if (leg2) {
                const totalDjazAir = baseLegPriceEUR + leg2.priceEUR;

                results.push({
                    destination: dest.name,
                    code: dest.code,
                    classicPrice: classicPrice || 'N/A',
                    djazAirPrice: totalDjazAir,
                    savings: classicPrice ? (classicPrice - totalDjazAir) : 0,
                    details: {
                        baseLeg: baseLegPriceEUR,
                        leg2DZD: leg2.priceDZD,
                        leg2EUR: leg2.priceEUR
                    }
                });
            }

        } catch (error) {
            console.error(`Error benchmarking ${dest.code}`, error);
        }
    }

    // Sort by highest savings
    results.sort((a: any, b: any) => b.savings - a.savings);

    return NextResponse.json({
        success: true,
        date: DEPARTURE_DATE,
        results
    });
}
