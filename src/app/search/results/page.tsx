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
          currency: "EUR",
        };

        console.log("📤 Données envoyées à l'API:", requestBody);

        const response = await fetch("/api/unified-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data.allFlights || []);
        } else {
          setError(data.error || "Erreur lors de la recherche");
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
        console.error("❌ Erreur:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (origin && destination && departDate) {
      searchFlights();
    }
  }, [
    origin,
    destination,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    cabin,
  ]);

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

        {/* Liste des vols */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchResults.length} vol{searchResults.length > 1 ? "s" : ""}{" "}
                trouvé{searchResults.length > 1 ? "s" : ""}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Source: Amadeus API + DjazAir
              </span>
            </div>

            {/* Option DjazAir en premier et très visible */}
            {(() => {
              const djazAirFlight = searchResults.find(f => f.viaAlgiers && f.searchSource === "djazair");
              if (djazAirFlight) {
                return (
                  <div className="mb-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-blue-600 mb-2">
                        🎯 Solution DjazAir Recommandée
                      </h3>
                      <p className="text-gray-600">
                        Économies garanties avec escale en Algérie
                      </p>
                    </div>
                    <DjazAirOptionCard
                      option={djazAirFlight}
                      onBook={(optionId) => {
                        console.log("Réserver DjazAir:", optionId);
                        // Ici vous pouvez ajouter la logique de réservation
                      }}
                    />
                  </div>
                );
              }
              return null;
            })()}

            {/* Séparateur Vols Directs vs DjazAir */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  Autres Options de Vols
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            </div>

            <div className="space-y-4">
              {searchResults
                .filter(flight => !flight.viaAlgiers || flight.searchSource !== "djazair")
                .map((flight) => (
                <Card
                  key={flight.id}
                  className={`hover:shadow-md transition-shadow ${
                    flight.viaAlgiers
                      ? "border-2 border-green-200 bg-green-50"
                      : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Plane className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">
                              {flight.airline}
                            </span>
                            <span className="text-gray-500">
                              {flight.flightNumber}
                            </span>
                          </div>

                          {/* Badge DjazAir si applicable */}
                          {flight.viaAlgiers && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              🚀 DjazAir via Alger
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              flight.searchSource === "amadeus"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {flight.searchSource === "amadeus"
                              ? "Amadeus"
                              : flight.searchSource}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Départ</div>
                            <div className="font-semibold">
                              {formatDate(flight.departureTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.origin}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Durée</div>
                            <div className="font-semibold">{flight.duration}</div>
                            <div className="text-sm text-gray-500">
                              {flight.stops === 0
                                ? "Vol direct"
                                : `${flight.stops} escale${flight.stops > 1 ? "s" : ""}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">Arrivée</div>
                            <div className="font-semibold">
                              {formatDate(flight.arrivalTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.destination}
                            </div>
                          </div>
                        </div>

                        {/* Informations sur les escales */}
                        {flight.connection && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>
                                Escale à {flight.connection.airport} (
                                {flight.connection.duration})
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Économies DjazAir */}
                        {flight.savings && flight.savings.amount > 0 && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">
                                  💰 Économies DjazAir
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  -{flight.savings.amount}€
                                </div>
                                <div className="text-sm text-green-600">
                                  ({flight.savings.percentage.toFixed(1)}%)
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {formatPrice(flight.price.amount, flight.price.currency)}
                        </div>
                        {flight.price.originalDZD && (
                          <div className="text-sm text-gray-500">
                            {flight.price.originalDZD.toLocaleString()} DZD
                          </div>
                        )}
                        <Button className="mt-2">Réserver</Button>
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
