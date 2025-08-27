import { NextRequest, NextResponse } from 'next/server';
import { UnifiedFlightSearch } from '@/server/flightSearch/unifiedSearch';
import { searchFormSchema } from '@/lib/zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = searchFormSchema.parse(body);

    console.log('🔍 Recherche de vols demandée:', validatedData);

    const searchService = new UnifiedFlightSearch();
    const results = await searchService.searchFlights(validatedData);

    console.log(`✅ Recherche terminée: ${results.directFlights.length} vols directs, ${results.viaAlgiersFlights.length} vols via Alger`);

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Recherche de vols terminée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Erreur lors de la recherche de vols'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur inconnue',
      message: 'Erreur lors de la recherche de vols'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');

    if (!origin || !destination || !date) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants',
        message: 'Les paramètres origin, destination et date sont requis'
      }, { status: 400 });
    }

    console.log(`🔍 Recherche GET: ${origin} → ${destination} le ${date}`);

    const searchService = new UnifiedFlightSearch();
    const results = await searchService.searchSpecificRoute(origin, destination, date);

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Recherche de vols terminée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la recherche GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la recherche',
      message: 'Impossible de récupérer les vols'
    }, { status: 500 });
  }
}
