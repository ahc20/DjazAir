import { NextRequest, NextResponse } from 'next/server';
import { googleFlightsScraper } from '@/server/scrapers/googleFlightsDZDScraper';

export const maxDuration = 60; // Allow 60 seconds for scraping

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { origin, destination, departureDate, returnDate } = body;

        if (!origin || !destination || !departureDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        console.log(`🕵️‍♂️ Checking real DZD price for ${origin}-${destination} on ${departureDate}`);

        // Call the scraper
        const result = await googleFlightsScraper.searchDZDPrice(
            origin,
            destination,
            departureDate,
            returnDate
        );

        if (result) {
            return NextResponse.json({
                success: true,
                data: result
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not find price' },
                { status: 404 }
            );
        }
    } catch (error: any) {
        console.error('❌ Error checking real price:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
