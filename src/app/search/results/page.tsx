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
    // Recherche DjazAir RÉELLE via l'API Quote
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
          maxResults: 20,
          policy: "DZ_ONLY",
          dzdEurRate: 260,
          airlinesWhitelist: "AH,AF,ET,TK,MS,QR,EK", // Compagnies principales
        };

        console.log("📤 Recherche de vrais vols DjazAir via l'API Quote:", requestBody);

        // Appel à l'API DjazAir Quote pour de vrais vols
        const djazairResponse = await fetch("/api/djazair/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (djazairResponse.ok) {
          const djazairData = await djazairResponse.json();
          if (djazairData.success) {
            console.log("✅ Vrais vols DjazAir trouvés:", djazairData.data);
            
            // Recherche aussi des vols directs pour comparaison
            let directFlights: FlightResult[] = [];
            try {
              const directResponse = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  origin,
                  destination,
                  departureDate: departDate,
                  returnDate,
                  adults: adults + children + infants,
                  cabin,
                  maxResults: 5,
                }),
              });
              
              if (directResponse.ok) {
                const directData = await directResponse.json();
                if (directData.success && directData.data.length > 0) {
                  directFlights = directData.data.slice(0, 3).map((flight: any) => ({
                    ...flight,
                    searchSource: "amadeus" as const,
                    viaAlgiers: false,
                  }));
                }
              }
            } catch (directError) {
              console.warn("⚠️ Impossible de récupérer les vols directs pour comparaison:", directError);
            }
            
            // Créer un résultat de vol avec les vrais segments DjazAir
            const djazairFlight: FlightResult = {
              id: `djazair-${Date.now()}`,
              origin,
              destination,
              departureTime: djazairData.data.originToAlgiers.departureTime,
              arrivalTime: djazairData.data.algiersToDestination.arrivalTime,
              duration: `${djazairData.data.originToAlgiers.duration} + ${djazairData.data.algiersToDestination.duration}`,
              price: {
                amount: djazairData.data.totalEUR,
                currency: "EUR",
                originalDZD: djazairData.data.totalDZD,
              },
              airline: "DjazAir",
              flightNumber: `${djazairData.data.originToAlgiers.flightNumber} + ${djazairData.data.algiersToDestination.flightNumber}`,
              stops: 1,
              baggage: { included: true, weight: "23kg" },
              searchSource: "djazair",
              viaAlgiers: true,
              savings: calculateSavings(djazairData.data.totalEUR, directFlights),
              connection: {
                airport: "ALG",
                duration: "4h 30m",
                flightNumber: "Connexion",
              },
              segments: {
                toAlgiers: {
                  flight: djazairData.data.originToAlgiers.flightNumber,
                  price: djazairData.data.originToAlgiers.priceEUR,
                  currency: djazairData.data.originToAlgiers.currency,
                  airline: djazairData.data.originToAlgiers.airline,
                },
                fromAlgiers: {
                  flight: djazairData.data.algiersToDestination.flightNumber,
                  price: djazairData.data.algiersToDestination.priceEUR,
                  currency: djazairData.data.algiersToDestination.currency,
                  airline: djazairData.data.algiersToDestination.airline,
                },
              },
            };

            // Combiner les résultats : DjazAir en premier, puis vols directs
            setSearchResults([djazairFlight, ...directFlights]);
          } else {
            console.warn("⚠️ Aucun vol DjazAir trouvé:", djazairData.error);
            setError("Aucune option DjazAir disponible pour cette recherche");
          }
        } else {
          console.error("❌ Erreur API DjazAir Quote:", djazairResponse.status);
          setError("Erreur lors de la recherche DjazAir");
        }
      } catch (error) {
        console.error("❌ Erreur recherche DjazAir:", error);
        setError("Erreur de connexion au serveur DjazAir");
      } finally {
        setIsLoading(false);
      }
    };

    if (origin && destination && departDate) {
      searchDjazAir();
    }
  }, [origin, destination, departDate, returnDate, adults, children, infants, cabin]);

  // Fonction pour calculer les économies
  const calculateSavings = (djazairPrice: number, directFlights: FlightResult[]) => {
    if (directFlights.length === 0) return { amount: 0, percentage: 0 };
    
    const cheapestDirect = Math.min(...directFlights.map(f => f.price.amount));
    const savings = cheapestDirect - djazairPrice;
    const percentage = Math.round((savings / cheapestDirect) * 100);
    
    return { amount: Math.max(0, savings), percentage: Math.max(0, percentage) };
  };

  const handleBookFlight = (flight: FlightResult) => {
    // Redirection vers un site de réservation
    window.open("https://www.google.com/travel/flights", "_blank");
  };

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

        {/* Option DjazAir en premier et très visible */}
        {searchResults.length > 0 && searchResults[0].viaAlgiers && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">
                🎯 Solution DjazAir Recommandée
              </h2>
              <p className="text-xl text-gray-600">
                Économies garanties avec escale en Algérie
              </p>
            </div>
            
            <DjazAirOptionCard
              option={searchResults[0]}
              onBook={(optionId) => {
                console.log("Réserver DjazAir:", optionId);
                alert(`Réservation DjazAir ${optionId} !`);
              }}
            />
          </div>
        )}

        {/* Statistiques DjazAir */}
        {searchResults.length > 0 && searchResults[0].viaAlgiers && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-green-700">
                  💰 Avantages DjazAir
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {searchResults[0].savings?.amount || 0}€
                  </div>
                  <div className="text-sm text-green-700">
                    Économies garanties
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {searchResults[0].savings?.percentage || 0}%
                  </div>
                  <div className="text-sm text-green-700">
                    Pourcentage d'économies
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ALG
                  </div>
                  <div className="text-sm text-green-700">
                    Escale optimisée
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Aucun résultat */}
        {!isLoading && searchResults.length === 0 && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun vol trouvé
              </h3>
              <p className="text-gray-600">
                Aucun vol disponible pour cette recherche. Essayez de modifier
                vos critères.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
