import { NextRequest, NextResponse } from 'next/server';
import { RealFlightSearch } from '@/server/flightSearch/realFlightSearch';
import { z } from 'zod';

const realSearchRequestSchema = z.object({
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
    const validatedData = realSearchRequestSchema.parse(body);

    console.log(`🚀 Recherche réelle pour ${validatedData.origin} → ${validatedData.destination}`);

    const searchService = new RealFlightSearch();
    const results = await searchService.searchRealFlights(validatedData);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Erreur API recherche réelle:', error);
    
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

    const validatedData = realSearchRequestSchema.parse({
      origin,
      destination,
      departureDate,
      passengers: 1,
      cabinClass: 'Economy',
      currency: 'EUR'
    });

    console.log(`🔍 GET recherche réelle: ${validatedData.origin} → ${validatedData.destination}`);

    const searchService = new RealFlightSearch();
    const results = await searchService.searchRealFlights(validatedData);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Erreur API recherche réelle GET:', error);
    
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
