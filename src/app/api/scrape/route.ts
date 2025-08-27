import { NextRequest, NextResponse } from 'next/server';
import { UnifiedScraper } from '@/server/scrapers/unifiedScraper';
import { z } from 'zod';

const scrapeRequestSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().min(1).max(9).default(1),
  cabinClass: z.enum(['Economy', 'Premium Economy', 'Business', 'First']).default('Economy'),
  currency: z.string().default('EUR')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scrapeRequestSchema.parse(body);

    console.log(`🚀 Démarrage du scraping pour ${validatedData.origin} → ${validatedData.destination}`);

    const scraper = new UnifiedScraper();
    const results = await scraper.searchFlights(validatedData);

    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: 'Aucun résultat trouvé',
        details: results.errors
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: results.data,
      errors: results.errors,
      searchParams: results.searchParams
    });

  } catch (error) {
    console.error('❌ Erreur API scraping:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Données de requête invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    
    if (!origin || !destination || !departureDate) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants: origin, destination, departureDate requis'
      }, { status: 400 });
    }

    const validatedData = scrapeRequestSchema.parse({
      origin,
      destination,
      departureDate,
      passengers: 1,
      cabinClass: 'Economy',
      currency: 'EUR'
    });

    console.log(`🔍 GET scraping: ${validatedData.origin} → ${validatedData.destination}`);

    const scraper = new UnifiedScraper();
    const results = await scraper.searchFlights(validatedData);

    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: 'Aucun résultat trouvé',
        details: results.errors
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: results.data,
      errors: results.errors,
      searchParams: results.searchParams
    });

  } catch (error) {
    console.error('❌ Erreur API scraping GET:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres de requête invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
