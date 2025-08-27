'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Plane, Clock, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { formatPrice, formatDate } from '@/lib/utils';
import { getAirportName } from '@/lib/iata';

interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: { amount: number; currency: string };
  airline: string;
  flightNumber: string;
  stops: number;
  baggage: { included: boolean; weight?: string; details?: string };
  searchSource: 'amadeus' | 'google' | 'airalgerie';
  viaAlgiers?: boolean;
  savings?: { amount: number; percentage: number };
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les paramètres de recherche
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departDate = searchParams.get('departDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');
  const infants = parseInt(searchParams.get('infants') || '0');
  const cabin = searchParams.get('cabin') || 'ECONOMY';

  useEffect(() => {
    // Recherche réelle via l'API unifiée
    const searchFlights = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const requestBody = {
          origin,
          destination,
          departureDate: departDate,
          returnDate,
          passengers: adults + children + infants,
          cabinClass: cabin,
          currency: 'EUR'
        };
        
        console.log('📤 Données envoyées à l\'API:', requestBody);
        
        const response = await fetch('/api/unified-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.data.allFlights || []);
        } else {
          setError(data.error || 'Erreur lors de la recherche');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
        console.error('❌ Erreur:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (origin && destination && departDate) {
      searchFlights();
    }
  }, [origin, destination, departDate, returnDate, adults, children, infants, cabin]);

  const handleBookFlight = (flight: FlightResult) => {
    // Redirection vers un site de réservation
    window.open('https://www.google.com/travel/flights', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Recherche en cours...</p>
          <p className="text-sm text-gray-500">Interrogation de l'API Amadeus en temps réel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Résultats de recherche
                </h1>
                <p className="text-sm text-gray-600">
                  {getAirportName(origin)} → {getAirportName(destination)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(departDate)}
              {returnDate && ` - ${formatDate(returnDate)}`}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Résumé de la recherche */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Détails de votre recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Départ:</span>
                <p className="text-gray-900">{getAirportName(origin)} ({origin})</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Arrivée:</span>
                <p className="text-gray-900">{getAirportName(destination)} ({destination})</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Date:</span>
                <p className="text-gray-900">{formatDate(departDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Passagers:</span>
                <p className="text-gray-900">
                  {adults} adulte{adults > 1 ? 's' : ''}
                  {children > 0 && `, ${children} enfant${children > 1 ? 's' : ''}`}
                  {infants > 0 && `, ${infants} nourrisson${infants > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résultats de recherche */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-700">
                <p className="font-medium">Erreur lors de la recherche</p>
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des vols */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchResults.length} vol{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Source: Amadeus API
              </span>
            </div>

            <div className="space-y-4">
              {searchResults.map((flight) => (
                <Card key={flight.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Informations du vol */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Plane className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">{flight.airline}</span>
                            <span className="text-gray-500">{flight.flightNumber}</span>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            flight.searchSource === 'amadeus' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {flight.searchSource === 'amadeus' ? 'Amadeus' : flight.searchSource}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Horaires */}
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {new Date(flight.departureTime).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-sm text-gray-600">{flight.origin}</div>
                          </div>

                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">{flight.duration}</div>
                            <div className="w-full h-0.5 bg-gray-300 relative">
                              <div className="absolute inset-0 bg-blue-500"></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} escale${flight.stops > 1 ? 's' : ''}`}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {new Date(flight.arrivalTime).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-sm text-gray-600">{flight.destination}</div>
                          </div>
                        </div>

                        {/* Détails supplémentaires */}
                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {flight.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {flight.stops === 0 ? 'Direct' : `${flight.stops} escale${flight.stops > 1 ? 's' : ''}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {adults + children + infants} passager{adults + children + infants > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Prix et réservation */}
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {flight.price.amount} {flight.price.currency}
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                          {flight.baggage.included ? 'Bagages inclus' : 'Bagages en supplément'}
                        </div>
                        <Button 
                          onClick={() => handleBookFlight(flight)}
                          className="w-full"
                        >
                          Réserver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Aucun résultat */}
        {!isLoading && searchResults.length === 0 && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun vol trouvé</h3>
              <p className="text-gray-600">
                Aucun vol disponible pour cette recherche. Essayez de modifier vos critères.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
