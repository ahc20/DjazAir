'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plane, 
  Search, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Building2,
  ArrowUpRight,
  Clock,
  MapPin,
  AlertCircle,
  Info,
  Calendar,
  Users,
  Briefcase,
  Euro,
  TrendingUp
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface FlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
    originalDZD?: number; // Prix original en DZD si applicable
  };
  aircraft?: string;
  cabinClass: string;
  provider: string;
  direct: boolean;
  viaAlgiers?: boolean;
  baggage: {
    included: boolean;
    weight?: string;
    details?: string;
  };
  connection?: {
    airport: string;
    duration: string;
    flightNumber?: string;
  };
  savings?: {
    amount: number;
    percentage: number;
  };
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
  currency: string;
}

export function UnifiedFlightSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: '',
    passengers: 1,
    cabinClass: 'Economy',
    currency: 'EUR'
  });

  const searchFlights = async () => {
    // Validation des champs requis
    if (!searchParams.origin || !searchParams.destination) {
      setError('Veuillez remplir l\'origine et la destination');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      // Simulation de recherche avec vraies APIs (à remplacer)
      const mockResults = await simulateRealSearch(searchParams);
      setSearchResults(mockResults);
      
      console.log('✅ Résultats de recherche:', mockResults);
    } catch (err) {
      setError('Erreur de recherche. Veuillez réessayer.');
      console.error('❌ Erreur:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Simulation de recherche réelle (à remplacer par de vraies APIs)
  const simulateRealSearch = async (params: SearchParams): Promise<FlightResult[]> => {
    // Simuler un délai de recherche
    await new Promise(resolve => setTimeout(resolve, 2000));

    const basePrices: Record<string, number> = {
      'CDG-DXB': 354,
      'CDG-IST': 280,
      'CDG-CAI': 350,
      'CDG-BEY': 380,
      'CDG-AMM': 420,
      'ORY-DXB': 380,
      'ORY-IST': 300,
      'ORY-CAI': 370,
      'ORY-BEY': 400,
      'ORY-AMM': 440
    };

    const route = `${params.origin}-${params.destination}`;
    const basePrice = basePrices[route] || 400;

    // Vols directs internationaux
    const directFlights: FlightResult[] = [
      {
        id: 'af-direct-1',
        airline: 'Air France',
        airlineCode: 'AF',
        flightNumber: 'AF1001',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T08:00:00`,
        arrivalTime: `${params.departureDate}T14:30:00`,
        duration: '6h 30m',
        stops: 0,
        price: {
          amount: basePrice,
          currency: 'EUR'
        },
        aircraft: 'Airbus A350-900',
        cabinClass: params.cabinClass,
        provider: 'Air France',
        direct: true,
        baggage: {
          included: true,
          weight: '23kg',
          details: 'Bagage en soute inclus'
        }
      },
      {
        id: 'ek-direct-1',
        airline: 'Emirates',
        airlineCode: 'EK',
        flightNumber: 'EK2001',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T10:30:00`,
        arrivalTime: `${params.departureDate}T17:15:00`,
        duration: '6h 45m',
        stops: 0,
        price: {
          amount: basePrice * 0.95,
          currency: 'EUR'
        },
        aircraft: 'Boeing 777-300ER',
        cabinClass: params.cabinClass,
        provider: 'Emirates',
        direct: true,
        baggage: {
          included: true,
          weight: '30kg',
          details: 'Bagage en soute + bagage à main inclus'
        }
      }
    ];

    // Vols via Alger (avec conversion automatique DZD → EUR au taux parallèle)
    const viaAlgiersFlights: FlightResult[] = [
      {
        id: 'ah-via-alg-1',
        airline: 'Air Algérie',
        airlineCode: 'AH',
        flightNumber: 'AH1001 + AH1002',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T08:00:00`,
        arrivalTime: `${params.departureDate}T18:30:00`,
        duration: '8h 30m',
        stops: 1,
        price: {
          amount: 232.52, // Prix converti au taux parallèle (260 DZD/€)
          currency: 'EUR',
          originalDZD: 60455 // Prix original en DZD
        },
        aircraft: 'Airbus A330-200 + A320neo',
        cabinClass: params.cabinClass,
        provider: 'Air Algérie',
        direct: false,
        viaAlgiers: true,
        baggage: {
          included: true,
          weight: '23kg',
          details: 'Bagage en soute inclus'
        },
        connection: {
          airport: 'ALG',
          duration: '2h 15m',
          flightNumber: 'AH1002'
        },
        savings: {
          amount: basePrice - 232.52,
          percentage: ((basePrice - 232.52) / basePrice) * 100
        }
      },
      {
        id: 'ah-via-alg-2',
        airline: 'Air Algérie',
        airlineCode: 'AH',
        flightNumber: 'AH2001 + AH2002',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T22:05:00`,
        arrivalTime: `${params.departureDate}T07:50:00`,
        duration: '7h 45m',
        stops: 1,
        price: {
          amount: 200.00,
          currency: 'EUR',
          originalDZD: 52000
        },
        aircraft: 'Airbus A320neo + A330-200',
        cabinClass: params.cabinClass,
        provider: 'Air Algérie',
        direct: false,
        viaAlgiers: true,
        baggage: {
          included: true,
          weight: '20kg',
          details: 'Bagage en soute inclus'
        },
        connection: {
          airport: 'ALG',
          duration: '1h 45m',
          flightNumber: 'AH2002'
        },
        savings: {
          amount: basePrice - 200.00,
          percentage: ((basePrice - 200.00) / basePrice) * 100
        }
      }
    ];

    // Combiner et trier par prix
    const allFlights = [...directFlights, ...viaAlgiersFlights];
    return allFlights.sort((a, b) => a.price.amount - b.price.amount);
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  const getFlightTypeColor = (flight: FlightResult) => {
    if (flight.viaAlgiers) return 'border-green-200 bg-green-50';
    if (flight.direct) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getFlightTypeIcon = (flight: FlightResult) => {
    if (flight.viaAlgiers) return <Building2 className="h-5 w-5 text-green-600" />;
    if (flight.direct) return <Plane className="h-5 w-5 text-blue-600" />;
    return <Plane className="h-5 w-5 text-gray-600" />;
  };

  const getFlightTypeLabel = (flight: FlightResult) => {
    if (flight.viaAlgiers) return 'Via Alger';
    if (flight.direct) return 'Direct';
    return 'Avec Escale';
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de Vols avec Comparaison "Via Alger"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Recherchez vos vols et découvrez automatiquement les opportunités d'économies via l'escale à Alger
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Aéroport de départ</Label>
              <Input
                id="origin"
                value={searchParams.origin}
                onChange={(e) => setSearchParams(prev => ({ ...prev, origin: e.target.value.toUpperCase() }))}
                placeholder="CDG, ORY, LHR..."
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="destination">Aéroport d'arrivée</Label>
              <Input
                id="destination"
                value={searchParams.destination}
                onChange={(e) => setSearchParams(prev => ({ ...prev, destination: e.target.value.toUpperCase() }))}
                placeholder="DXB, IST, CAI..."
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departureDate">Date de départ</Label>
              <Input
                type="date"
                value={searchParams.departureDate}
                onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="returnDate">Date de retour (optionnel)</Label>
              <Input
                type="date"
                value={searchParams.returnDate}
                onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cabinClass">Classe</Label>
              <Select
                value={searchParams.cabinClass}
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, cabinClass: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Économique</SelectItem>
                  <SelectItem value="Premium Economy">Premium Économique</SelectItem>
                  <SelectItem value="Business">Affaires</SelectItem>
                  <SelectItem value="First">Première</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={searchFlights} 
              disabled={isSearching || !searchParams.origin || !searchParams.destination} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Rechercher des Vols
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Résultats de Recherche
              <span className="text-sm text-gray-500 font-normal">
                ({searchResults.length} vols trouvés)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((flight) => (
                <div 
                  key={flight.id} 
                  className={`p-4 border rounded-lg ${getFlightTypeColor(flight)}`}
                >
                  {/* En-tête du vol */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {getFlightTypeIcon(flight)}
                      <div>
                        <div className="font-semibold text-lg">
                          {flight.airline} {flight.flightNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          {getFlightTypeLabel(flight)}
                          {flight.viaAlgiers && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Économies: {flight.savings?.amount.toFixed(0)}€ ({flight.savings?.percentage.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(flight.price.amount, flight.price.currency)}
                      </div>
                      {flight.price.originalDZD && (
                        <div className="text-sm text-gray-600">
                          {flight.price.originalDZD.toLocaleString()} DZD
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Détails du vol */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Départ</div>
                        <div className="font-medium">{formatDateTime(flight.departureTime)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Arrivée</div>
                        <div className="font-medium">{formatDateTime(flight.arrivalTime)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Durée</div>
                        <div className="font-medium">{flight.duration}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Escales</div>
                        <div className="font-medium">{flight.stops}</div>
                      </div>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                         <div className="flex items-center gap-2">
                       <Briefcase className="h-4 w-4 text-gray-500" />
                       <div>
                         <div className="text-sm text-gray-600">Bagages</div>
                         <div className="font-medium">{flight.baggage.included ? 'Inclus' : 'Non inclus'}</div>
                         {flight.baggage.weight && (
                           <div className="text-xs text-gray-500">{flight.baggage.weight}</div>
                         )}
                       </div>
                     </div>
                    
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Avion</div>
                        <div className="font-medium">{flight.aircraft || 'Non spécifié'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Classe</div>
                        <div className="font-medium">{flight.cabinClass}</div>
                      </div>
                    </div>
                  </div>

                  {/* Détails de correspondance */}
                  {flight.connection && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Correspondance à {flight.connection.airport}</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <div>Durée d'attente: {flight.connection.duration}</div>
                        {flight.connection.flightNumber && (
                          <div>Vol de correspondance: {flight.connection.flightNumber}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bouton de réservation */}
                  <div className="mt-4">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Réserver via canal officiel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note sur la conversion des prix */}
      {searchResults.length > 0 && searchResults.some(f => f.viaAlgiers) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <Info className="h-5 w-5" />
              <div>
                <div className="font-medium">Conversion automatique des prix DZD</div>
                <div className="text-sm text-green-600">
                  Les prix Air Algérie en DZD sont automatiquement convertis au taux parallèle (1€ = 260 DZD) 
                  pour vous permettre de comparer facilement avec les prix internationaux en euros.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
