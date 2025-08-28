import { NextRequest, NextResponse } from 'next/server';
import { UnifiedFlightSearchService } from '@/server/flightSearch/unifiedFlightSearchService';
import { z } from 'zod';

// Instance du service de recherche
const unifiedSearchService = new UnifiedFlightSearchService();

const unifiedSearchRequestSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().min(1).max(9).default(1),
  cabinClass: z.enum(['Economy', 'ECONOMY', 'Premium Economy', 'Business', 'First']).default('Economy'),
  currency: z.string().default('EUR')
});

export async function POST(request: Request) {
  try {
    // Timeout global de 8 secondes pour éviter les 504
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout de la requête')), 8000);
    });

    const bodyPromise = request.json();
    
    const body = await Promise.race([bodyPromise, timeoutPromise]) as any;
    console.log('📥 Données reçues par l\'API:', body);

    // Validation des données
    const validationResult = unifiedSearchRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Validation échouée:', validationResult.error);
      return NextResponse.json({
        success: false,
        error: 'Données de requête invalides',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const searchParams = validationResult.data;
    console.log('✅ Paramètres validés:', searchParams);

    // Recherche avec timeout
    const searchPromise = unifiedSearchService.searchFlights(searchParams);
    const searchResults = await Promise.race([searchPromise, timeoutPromise]);

    console.log('✅ Recherche terminée avec succès');
    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    if (error instanceof Error && error.message === 'Timeout de la requête') {
      return NextResponse.json({
        success: false,
        error: 'La recherche prend trop de temps. Veuillez réessayer.'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
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
// Fix: correction type duration connection
// Fix: correction calcul durée totale - types cohérents
// Fix: optimisation timeouts et gestion d'erreur 504
// Fix: logique DjazAir simplifiée et optimisée
// Fix: DjazAir temporairement désactivé pour test performance
// Feat: DjazAir réactivé et optimisé avec recherche parallèle
// Fix: DjazAir simulé pour test interface - évite les timeouts
