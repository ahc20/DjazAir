"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FlightResult } from "@/types/flight";
import { DjazAirFlight } from "@/types/djazair";

interface SearchResults {
  djazairFlights: DjazAirFlight[];
  classicFlights: FlightResult[];
  loading: boolean;
  error: string | null;
  savings: {
    best: number;
    total: number;
  } | null;
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResults>({
    djazairFlights: [],
    classicFlights: [],
    loading: true,
    error: null,
    savings: null
  });

  // Extraction des paramètres de recherche
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departDate = searchParams.get("departDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const infants = parseInt(searchParams.get("infants") || "0");
  const cabin = searchParams.get("cabin") || "ECONOMY";

  useEffect(() => {
    if (origin && destination && departDate) {
      searchDjazAir();
    }
  }, [origin, destination, departDate, returnDate, adults, children, infants, cabin]);

  const searchDjazAir = async () => {
    try {
      console.log("🔍 Recherche des vols DjazAir...");
      
      const response = await fetch("/api/djazair-flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          departureDate: departDate,
          returnDate,
          adults,
          children,
          infants,
          cabin,
          maxResults: 10,
          policy: "DZ_ONLY",
          dzdEurRate: 260
        })
      });

      console.log("🔍 Statut de la réponse:", response.status, response.statusText);
      
      if (!response.ok) {
        console.error("❌ Erreur HTTP:", response.status, response.statusText);
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🔍 Réponse API DjazAir:", data);
      
      if (data.success && data.data && data.data.length > 0) {
        console.log("✅ Vols DjazAir trouvés:", data.data.length);
        
        // Rechercher les vols classiques pour comparaison
        await searchClassicFlights(data.data);
      } else {
        console.log("❌ Aucun vol DjazAir trouvé. Réponse complète:", data);
        const errorMessage = data.error || data.message || "Aucun vol DjazAir trouvé";
        console.log("❌ Message d'erreur:", errorMessage);
        setSearchResults(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
    } catch (error) {
      console.error("❌ Erreur recherche DjazAir:", error);
      setSearchResults(prev => ({
        ...prev,
        loading: false,
        error: "Erreur lors de la recherche DjazAir"
      }));
    }
  };

  const searchClassicFlights = async (djazairFlights: DjazAirFlight[]) => {
    try {
      console.log("🔍 Recherche des vols classiques...");
      
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          departDate,
          returnDate,
          adults,
          children,
          infants,
          cabin
        })
      });

      const data = await response.json();
      console.log("🔍 Réponse API classique:", data);
      
      if (data.success && data.data) {
        // L'API retourne {directFlights: [], viaAlgiersFlights: []}
        const directFlights = data.data.directFlights || [];
        const viaAlgiersFlights = data.data.viaAlgiersFlights || [];
        
        // Combiner tous les vols classiques
        const allClassicFlights = [...directFlights, ...viaAlgiersFlights];
        
        if (allClassicFlights.length > 0) {
          console.log("✅ Vols classiques trouvés:", allClassicFlights.length);
          console.log("   - Vols directs:", directFlights.length);
          console.log("   - Vols via Alger:", viaAlgiersFlights.length);
          
          // Calculer les économies
          const cheapestClassic = Math.min(...allClassicFlights.map((f: FlightResult) => f.price.amount));
          const cheapestDjazair = Math.min(...djazairFlights.map(f => f.totalPriceEUR));
          
          const bestSavings = cheapestClassic - cheapestDjazair;
          const totalSavings = djazairFlights.reduce((total, flight) => {
            const savings = cheapestClassic - flight.totalPriceEUR;
            return total + Math.max(0, savings);
          }, 0);

          setSearchResults({
            djazairFlights,
            classicFlights: allClassicFlights,
            loading: false,
            error: null,
            savings: {
              best: bestSavings,
              total: totalSavings
            }
          });
        } else {
          console.log("❌ Aucun vol classique trouvé dans la réponse");
          setSearchResults({
            djazairFlights,
            classicFlights: [],
            loading: false,
            error: null,
            savings: null
          });
        }
      } else {
        console.log("❌ Réponse API invalide:", data);
        setSearchResults({
          djazairFlights,
          classicFlights: [],
          loading: false,
          error: null,
          savings: null
        });
      }
    } catch (error) {
      console.error("❌ Erreur recherche classique:", error);
      setSearchResults({
        djazairFlights,
        classicFlights: [],
        loading: false,
        error: "Erreur lors de la recherche des vols classiques",
        savings: null
      });
    }
  };

  const handleBookFlight = (flight: FlightResult | string) => {
    if (typeof flight === "string") {
      // C'est un ID DjazAir, stocker les détails et rediriger vers la page de détails
      const djazairFlight = searchResults.djazairFlights.find(f => f.id === flight);
      if (djazairFlight) {
        // Stocker les détails du vol dans le localStorage
        localStorage.setItem(`djazair-flight-${flight}`, JSON.stringify(djazairFlight));
        // Rediriger vers la page de détails
        window.location.href = `/djazair-details/${flight}`;
      }
    } else {
      // C'est un vol classique, rediriger vers la compagnie
      console.log("✈️ Réserver vol classique:", flight);
      // Ici vous pouvez implémenter la redirection vers la compagnie
      // Pour l'instant, ouvrir dans un nouvel onglet
      window.open(`https://www.google.com/search?q=${flight.airline}+${flight.flightNumber}+reservation`, '_blank');
    }
  };

  if (searchResults.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">🔍 Recherche des vols DjazAir...</p>
          <p className="text-sm text-gray-500 mt-2">Recherche en cours via l'API Amadeus</p>
        </div>
      </div>
    );
  }

  if (searchResults.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur de recherche</h1>
          <p className="text-gray-600 mb-4">{searchResults.error}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 lg:px-4">
        {/* Header avec économies */}
        {searchResults.savings && searchResults.savings.best > 0 && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8">
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold text-green-700 mb-2">
                🚀 Économies DjazAir Détectées !
              </h1>
              <p className="text-base lg:text-lg text-green-600 mb-4">
                Nous avons trouvé des alternatives moins chères en transitant à Alger
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-green-700">
                    {searchResults.djazairFlights.length} Options DjazAir
                  </div>
                  <div className="text-xs lg:text-sm text-green-600">Solutions disponibles</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-green-700">
                    {searchResults.savings.best.toFixed(2)}€ Meilleure économie
                  </div>
                  <div className="text-xs lg:text-sm text-green-600">Comparé au vol direct</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-green-700">
                    {searchResults.savings.total.toFixed(2)}€ Total économies
                  </div>
                  <div className="text-xs lg:text-sm text-green-600">Toutes options confondues</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout responsive : 2 colonnes sur desktop, 1 colonne sur mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
          {/* Section DjazAir - GAUCHE */}
          <div className="min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-blue-600 mb-4">
              ✈️ Solution DjazAir - {returnDate ? 'Aller-Retour (AR)' : 'Aller Simple (AS)'} avec Escale en Algérie
            </h2>
            <p className="text-sm lg:text-base text-gray-600 mb-4">
              {returnDate ? 'Vol aller-retour' : 'Vol aller simple'} avec escale à Alger pour des économies garanties
            </p>
            
            {searchResults.djazairFlights.length > 0 ? (
              <div className="space-y-4">
                {searchResults.djazairFlights.slice(0, 3).map((flight) => (
                  <div key={flight.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header du vol */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">✈️</span>
                          <div>
                            <h3 className="text-lg font-bold">DjazAir - Escale en Algérie</h3>
                            <p className="text-blue-100">{flight.origin} → {flight.destination}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{flight.totalPriceEUR}€</div>
                          <div className="text-blue-100 text-sm">
                            {flight.totalPriceDZD && `${flight.totalPriceDZD.toLocaleString()} DZD`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Détails du vol */}
                    <div className="p-4">
                      <div className="text-center mb-4">
                        <div className="text-lg font-bold text-gray-800 mb-1">
                          {flight.origin} → {flight.destination}
                        </div>
                        <div className="text-gray-600">
                          {new Date(flight.departureDate).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })} • {flight.totalDuration}
                        </div>
                      </div>

                      {/* Segments */}
                      <div className="space-y-4">
                        {flight.segments.map((segment, index) => {
                          const isReturnSegment = index >= 2;
                          const segmentType = isReturnSegment ? 'Retour' : 'Aller';
                          const segmentNumber = isReturnSegment ? index - 1 : index + 1;
                          
                          return (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">
                                  {segmentType} {segmentNumber} : {segment.origin} → {segment.destination}
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                  {segment.priceEUR.toFixed(2)} EUR
                                </span>
                              </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <strong>Vol:</strong> {segment.airline} {segment.flightNumber}
                              </div>
                              <div>
                                <strong>Prix:</strong> {segment.priceDZD ? `${segment.priceDZD.toFixed(0)} DZD` : `${segment.priceEUR.toFixed(2)} EUR`}
                                {segment.priceDZD && segment.priceEUR && (
                                  <span className="text-gray-500">
                                    {" "}({segment.priceEUR.toFixed(2)} EUR)
                                  </span>
                                )}
                              </div>
                              <div>
                                <strong>Départ:</strong> {new Date(segment.departureTime).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} {segment.origin}
                              </div>
                              <div>
                                <strong>Arrivée:</strong> {new Date(segment.arrivalTime).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} {segment.destination}
                              </div>
                              <div>
                                <strong>Durée:</strong> {segment.duration}
                              </div>
                              <div>
                                <strong>Devise:</strong> EUR
                                {segment.priceDZD && (
                                  <span className="text-gray-500">
                                    {" "}(+ {segment.priceDZD.toFixed(0)} DZD local)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                        })}
                      </div>

                      {/* Escale */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-center space-x-4">
                          <span className="text-blue-600">✈️</span>
                          <div className="text-center">
                            <div className="font-semibold text-blue-700">
                              Escale à {flight.layover.airport} ({flight.layover.duration})
                            </div>
                            <div className="text-sm text-blue-600">{flight.layover.location}</div>
                          </div>
                          <span className="text-blue-600">✈️</span>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex space-x-3 mt-4">
                        <button 
                          onClick={() => handleBookFlight(flight.id)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          🎯 Réserver avec les Compagnies Réelles
                        </button>
                        <button 
                          onClick={() => handleBookFlight(flight.id)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          💰 Voir les Détails DjazAir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 text-6xl mb-4">✈️</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune solution DjazAir</h3>
                <p className="text-gray-500">Aucune combinaison de vols avec escale en Algérie disponible.</p>
              </div>
            )}
          </div>

          {/* Section Vols Classiques - DROITE */}
          <div className="min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-700 mb-4">
              🛫 Vols Classiques
            </h2>
            <p className="text-sm lg:text-base text-gray-600 mb-4">
              Vols directs et avec escales traditionnels
            </p>
            
            {/* FORCER l'affichage des vols classiques même s'ils sont vides */}
            <div className="space-y-4">
              {searchResults.classicFlights.length > 0 ? (
                searchResults.classicFlights.slice(0, 5).map((flight) => (
                  <div key={flight.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-2">
                          <div className="text-center">
                            <div className="font-semibold text-lg">
                              {new Date(flight.departureTime).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-sm text-gray-500">{flight.origin}</div>
                          </div>
                          
                          <div className="flex-1 text-center">
                            <div className="text-sm text-gray-500">{flight.duration}</div>
                            <div className="text-xs text-gray-400">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} escale${flight.stops > 1 ? 's' : ''}`}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-semibold text-lg">
                              {new Date(flight.arrivalTime).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-sm text-gray-500">{flight.destination}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 text-center sm:text-left">
                          {flight.airline} {flight.flightNumber}
                        </div>
                      </div>
                      
                      <div className="text-center sm:text-right w-full sm:w-auto">
                        <div className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
                          {flight.price.amount}€
                        </div>
                        <button 
                          onClick={() => handleBookFlight(flight)}
                          className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          Réserver
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-3">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Recherche en cours...</h3>
                    <p className="text-gray-500 text-sm mb-4">Nous cherchons des vols classiques pour comparer</p>
                    
                    {/* Debug info */}
                    <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                      <div><strong>Paramètres de recherche :</strong></div>
                      <div>De : {origin} → Vers : {destination}</div>
                      <div>Date : {departDate}</div>
                      <div>Passagers : {adults} adulte(s)</div>
                      <div>Classe : {cabin}</div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                      <strong>💡 Conseil :</strong> Si aucun vol classique n'apparaît, essayez de modifier vos critères de recherche ou contactez le support.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informations sur l'API */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-blue-800 mb-3">ℹ️ Informations Techniques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm text-blue-700">
            <div>
              <strong>API DjazAir:</strong> /api/djazair-flights
            </div>
            <div>
              <strong>Source des données:</strong> API Amadeus
            </div>
            <div>
              <strong>Logique:</strong> Recherche en deux segments via ALG
            </div>
            <div>
              <strong>Devises:</strong> EUR (origine) + DZD (Algérie)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
