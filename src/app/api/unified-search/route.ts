import { NextRequest, NextResponse } from 'next/server';
import { UnifiedFlightSearchService } from '@/server/flightSearch/unifiedFlightSearchService';
import { z } from 'zod';

const unifiedSearchRequestSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().min(1).max(9).default(1),
  cabinClass: z.enum(['Economy', 'ECONOMY', 'Premium Economy', 'Business', 'First']).default('Economy'),
  currency: z.string().default('EUR')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Données reçues par l\'API:', body);
    
    const validatedData = unifiedSearchRequestSchema.parse(body);

    console.log(`🚀 Recherche unifiée pour ${validatedData.origin} → ${validatedData.destination}`);

    const searchService = new UnifiedFlightSearchService();
    const results = await searchService.searchFlights(validatedData);

    // Ajout des statistiques de recherche
    const stats = searchService.getSearchStats(results);

    return NextResponse.json({
      success: true,
      data: results,
      stats,
      message: `Recherche terminée avec succès. ${results.totalResults} vols trouvés.`
    });

  } catch (error) {
    console.error('❌ Erreur API recherche unifiée:', error);
    
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

    const validatedData = unifiedSearchRequestSchema.parse({
      origin,
      destination,
      departureDate,
      passengers: 1,
      cabinClass: 'Economy',
      currency: 'EUR'
    });

    console.log(`🔍 GET recherche unifiée: ${validatedData.origin} → ${validatedData.destination}`);

    const searchService = new UnifiedFlightSearchService();
    const results = await searchService.searchFlights(validatedData);
    const stats = searchService.getSearchStats(results);

    return NextResponse.json({
      success: true,
      data: results,
      stats,
      message: `Recherche terminée avec succès. ${results.totalResults} vols trouvés.`
    });

  } catch (error) {
    console.error('❌ Erreur API recherche unifiée GET:', error);
    
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
// Force redeploy Wed Aug 27 16:34:36 CEST 2025
// Test
// Test redéploiement après correction clé Amadeus
// Test: implémentation DjazAir via Alger
// Redéploiement final DjazAir
// Fix: correction interface FlightResult
