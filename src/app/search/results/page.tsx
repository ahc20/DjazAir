"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plane, Clock, MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DjazAirOptionCard } from "@/components/DjazAirOptionCard";

import { formatPrice, formatDate } from "@/lib/utils";
import { getAirportName } from "@/lib/iata";

interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: {
    amount: number;
    currency: string;
    originalDZD?: number;
  };
  airline: string;
  flightNumber: string;
  stops: number;
  baggage: { included: boolean; weight?: string; details?: string };
  searchSource: "amadeus" | "google" | "airalgerie" | "djazair";
  viaAlgiers?: boolean;
  savings?: { amount: number; percentage: number };
  connection?: {
    airport: string;
    duration: string;
    flightNumber?: string;
  };
  segments?: {
    toAlgiers: {
      flight: string;
      price: number;
      currency: string;
      airline: string;
    };
    fromAlgiers: {
      flight: string;
      price: number;
      currency: string;
      airline: string;
    };
  };
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les paramètres de recherche
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departDate = searchParams.get("departDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const infants = parseInt(searchParams.get("infants") || "0");
  const cabin = searchParams.get("cabin") || "ECONOMY";

  useEffect(() => {
    // Recherche DjazAir RÉELLE via l'API djazair-flights
    const searchDjazAir = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const requestBody = {
          origin,
          destination,
          departureDate: departDate,
          returnDate,
          adults: adults + children + infants,
          cabin: cabin,
          dzdEurRate: 260,
        };

        console.log("📤 Recherche de vrais vols DjazAir via l'API djazair-flights:", requestBody);

        // Appel à l'API DjazAir Flights pour de vrais vols avec escale en Algérie
        const djazairResponse = await fetch("/api/djazair-flights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (djazairResponse.ok) {
          const djazairData = await djazairResponse.json();
          if (djazairData.success) {
            console.log("✅ Vrais vols DjazAir trouvés:", djazairData.data.length);
            
            // Convertir les vols DjazAir au format FlightResult
            const djazairFlights: FlightResult[] = djazairData.data.map((flight: any) => ({
              id: flight.id,
              origin: flight.origin,
              destination: flight.destination,
              departureTime: flight.departureTime,
              arrivalTime: flight.arrivalTime,
              duration: flight.totalDuration,
              price: {
                amount: flight.totalPrice.amount,
                currency: flight.totalPrice.currency,
                originalDZD: flight.totalPrice.originalDZD,
              },
              airline: "DjazAir",
              flightNumber: `${flight.segments.toAlgiers.flightNumber} + ${flight.segments.fromAlgiers.flightNumber}`,
              stops: 1,
              baggage: { included: true, weight: "23kg" },
              searchSource: "djazair",
              viaAlgiers: true,
              savings: flight.savings || { amount: 0, percentage: 0 },
              connection: {
                airport: flight.connection.airport,
                duration: flight.connection.duration,
                flightNumber: flight.connection.type,
              },
              segments: {
                toAlgiers: {
                  flight: flight.segments.toAlgiers.flightNumber,
                  price: flight.segments.toAlgiers.price,
                  currency: flight.segments.toAlgiers.currency,
                  airline: flight.segments.toAlgiers.airline,
                },
                fromAlgiers: {
                  flight: flight.segments.fromAlgiers.flightNumber,
                  price: flight.segments.fromAlgiers.price,
                  currency: flight.segments.fromAlgiers.currency,
                  airline: flight.segments.fromAlgiers.airline,
                },
              },
            }));

            // Stocker les vols DjazAir
            setSearchResults(prev => {
              const withoutDjazair = prev.filter(f => f.searchSource !== "djazair");
              return [...djazairFlights, ...withoutDjazair];
            });

            // Maintenant rechercher les vols classiques pour comparaison
            await searchClassicFlights(Math.min(...djazairFlights.map(f => f.price.amount)));
          } else {
            console.warn("⚠️ Aucun vol DjazAir trouvé:", djazairData.error);
            setError("Aucune option DjazAir disponible pour cette recherche");
            // Même sans DjazAir, rechercher les vols classiques
            await searchClassicFlights(0);
          }
        } else {
          console.error("❌ Erreur API DjazAir Flights:", djazairResponse.status);
          setError("Erreur lors de la recherche DjazAir");
          // Même en cas d'erreur DjazAir, rechercher les vols classiques
          await searchClassicFlights(0);
        }
      } catch (error) {
        console.error("❌ Erreur recherche DjazAir:", error);
        setError("Erreur de connexion au serveur DjazAir");
        // Même en cas d'erreur, rechercher les vols classiques
        await searchClassicFlights(0);
      } finally {
        setIsLoading(false);
      }
    };

    // Recherche des vols classiques pour comparaison
    const searchClassicFlights = async (djazairPrice: number) => {
      try {
        console.log("🔍 Recherche de vols classiques pour comparaison...");

        const classicResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            departureDate: departDate,
            returnDate,
            adults: adults + children + infants,
            cabin,
            maxResults: 10,
          }),
        });
        
        if (classicResponse.ok) {
          const classicData = await classicResponse.json();
          if (classicData.success && classicData.data.length > 0) {
            console.log("✅ Vols classiques trouvés:", classicData.data.length);
            
            const classicFlights = classicData.data.slice(0, 5).map((flight: any) => ({
              ...flight,
              searchSource: "amadeus" as const,
              viaAlgiers: false,
              savings: djazairPrice > 0 ? calculateSavings(djazairPrice, flight.price.amount) : { amount: 0, percentage: 0 },
            }));

            // Ajouter les vols classiques aux résultats
            setSearchResults(prev => {
              const djazairFlights = prev.filter(f => f.searchSource === "djazair");
              const withoutClassic = prev.filter(f => f.searchSource !== "amadeus");
              return [...djazairFlights, ...classicFlights];
            });

            // Mettre à jour les économies DjazAir si disponible
            if (djazairPrice > 0) {
              setSearchResults(prev => {
                return prev.map(flight => {
                  if (flight.searchSource === "djazair") {
                    const cheapestClassic = Math.min(...classicFlights.map((f: FlightResult) => f.price.amount));
                    const savings = cheapestClassic - djazairPrice;
                    return {
                      ...flight,
                      savings: {
                        amount: Math.max(0, savings),
                        percentage: Math.max(0, Math.round((savings / cheapestClassic) * 100)),
                      },
                    };
                  }
                  return flight;
                });
              });
            }
          } else {
            console.warn("⚠️ Aucun vol classique trouvé");
          }
        } else {
          console.warn("⚠️ Erreur lors de la recherche de vols classiques:", classicResponse.status);
        }
      } catch (classicError) {
        console.warn("⚠️ Impossible de récupérer les vols classiques pour comparaison:", classicError);
      }
    };

    if (origin && destination && departDate) {
      searchDjazAir();
    }
  }, [origin, destination, departDate, returnDate, adults, children, infants, cabin]);

  // Fonction pour calculer les économies
  const calculateSavings = (djazairPrice: number, classicPrice: number) => {
    const savings = classicPrice - djazairPrice;
    const percentage = Math.round((savings / classicPrice) * 100);
    
    return { 
      amount: Math.max(0, savings), 
      percentage: Math.max(0, percentage) 
    };
  };

  const handleBookFlight = (flight: FlightResult | string) => {
    if (typeof flight === "string") {
      // Ancien format avec optionId
      console.log("Réserver vol avec ID:", flight);
      alert(`Réservation du vol ${flight} !`);
    } else {
      // Nouveau format avec FlightResult
      console.log("Réserver vol:", flight);
      alert(`Réservation du vol ${flight.airline} ${flight.flightNumber} de ${flight.origin} à ${flight.destination} !`);
    }
  };

  // Séparer les résultats par type
  const djazairFlights = searchResults.filter(flight => flight.searchSource === "djazair");
  const classicFlights = searchResults.filter(flight => flight.searchSource === "amadeus");

  // Calculer les statistiques de comparaison
  const cheapestClassic = classicFlights.length > 0 ? Math.min(...classicFlights.map(f => f.price.amount)) : 0;
  const cheapestDjazair = djazairFlights.length > 0 ? Math.min(...djazairFlights.map(f => f.price.amount)) : 0;
  const totalSavings = cheapestClassic > 0 && cheapestDjazair > 0 ? cheapestClassic - cheapestDjazair : 0;
  const savingsPercentage = cheapestClassic > 0 && cheapestDjazair > 0 ? Math.round((totalSavings / cheapestClassic) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Recherche en cours...</p>
          <p className="text-sm text-gray-500">
            Interrogation de l'API Amadeus en temps réel
          </p>
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
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Départ</div>
                <div className="font-semibold">{origin}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Arrivée</div>
                <div className="font-semibold">{destination}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-semibold">{departDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Passagers</div>
                <div className="font-semibold">
                  {adults + children + infants}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé des économies DjazAir */}
        {searchResults.some(
          (f) => f.viaAlgiers && f.savings && f.savings.amount > 0
        ) && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🚀 Économies DjazAir Détectées !
                </h3>
                <p className="text-green-700 mb-4">
                  Nous avons trouvé des alternatives moins chères via Alger en
                  utilisant le taux de change parallèle (260 DZD/€)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const djazAirFlights = searchResults.filter(
                      (f) => f.viaAlgiers && f.savings && f.savings.amount > 0
                    );
                    const bestSavings = djazAirFlights.reduce(
                      (best, current) =>
                        (current.savings?.amount || 0) >
                        (best.savings?.amount || 0)
                          ? current
                          : best
                    );
                    const totalSavings = djazAirFlights.reduce(
                      (sum, f) => sum + (f.savings?.amount || 0),
                      0
                    );

                    return (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {djazAirFlights.length}
                          </div>
                          <div className="text-sm text-green-700">
                            Options DjazAir
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {bestSavings.savings?.amount}€
                          </div>
                          <div className="text-sm text-green-700">
                            Meilleure économie
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {totalSavings.toFixed(0)}€
                          </div>
                          <div className="text-sm text-green-700">
                            Total économies
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats de recherche */}
        <div className="space-y-6">
          {/* Affichage des erreurs */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center text-red-700">
                  <p className="font-medium">Erreur lors de la recherche</p>
                  <p className="text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indicateur de chargement */}
          {isLoading && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center text-blue-700">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="font-medium">Recherche en cours...</p>
                  <p className="text-sm">Recherche de vols DjazAir et classiques</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section DjazAir */}
          {djazairFlights.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-600 mb-2">
                  ✈️ Solution DjazAir - Escale en Algérie
                </h2>
                <p className="text-gray-600">
                  Vols avec escale à Alger pour des économies garanties
                </p>
              </div>

              {/* Statistiques DjazAir */}
              {totalSavings > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      💰 Économies DjazAir Détectées !
                    </div>
                    <div className="text-lg text-green-600 mb-4">
                      Nous avons trouvé des alternatives moins chères via Alger en utilisant le taux de change parallèle (260 DZD/€)
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {djazairFlights.length}
                        </div>
                        <div className="text-sm text-green-600">Options DjazAir</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {totalSavings.toFixed(0)}€
                        </div>
                        <div className="text-sm text-green-600">Meilleure économie</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700">
                          {savingsPercentage}%
                        </div>
                        <div className="text-sm text-green-600">Économie relative</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Options DjazAir */}
              {djazairFlights.map((flight) => (
                <DjazAirOptionCard
                  key={flight.id}
                  option={flight}
                  onBook={handleBookFlight}
                />
              ))}
            </div>
          )}

          {/* Section Vols Classiques */}
          {classicFlights.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-2">
                  🛫 Vols Classiques - Comparaison
                </h2>
                <p className="text-gray-600">
                  Vols directs et avec escales traditionnelles
                </p>
              </div>

              {/* Statistiques de comparaison */}
              {djazairFlights.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700 mb-2">
                      📊 Comparaison des Prix
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Prix classique le moins cher :</span>
                        <div className="text-xl font-bold text-gray-800">
                          {cheapestClassic}€
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Prix DjazAir :</span>
                        <div className="text-xl font-bold text-blue-600">
                          {cheapestDjazair}€
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des vols classiques */}
              <div className="grid gap-4">
                {classicFlights.map((flight) => (
                  <Card key={flight.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="text-lg font-semibold text-gray-800">
                              {flight.origin} → {flight.destination}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.airline} {flight.flightNumber}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>🕐 {flight.duration}</span>
                            <span>🛫 {flight.stops} escale(s)</span>
                            {flight.savings && flight.savings.amount > 0 && (
                              <span className="text-green-600 font-medium">
                                💰 +{flight.savings.amount}€ plus cher que DjazAir
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">
                            {flight.price.amount}€
                          </div>
                          <Button
                            onClick={() => handleBookFlight(flight)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
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

          {/* Message si aucun résultat */}
          {searchResults.length === 0 && !isLoading && !error && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                Aucun vol trouvé pour cette recherche
              </div>
            </div>
          )}
        </div>

        {/* Informations sur DjazAir */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-blue-700 mb-4">
                🚀 Pourquoi choisir DjazAir ?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
                <div>
                  <h4 className="font-semibold mb-2">💎 Économies garanties</h4>
                  <p>Grâce à l'arbitrage des taux de change entre l'Euro et le Dinar algérien</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🛫 Escale optimisée</h4>
                  <p>Connexion de 4h30 à Alger, parfait pour se reposer et se restaurer</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🎒 Bagages inclus</h4>
                  <p>23kg de bagages en soute inclus dans le prix</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚡ Rapidité</h4>
                  <p>API ultra-rapide sans dépendances externes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
