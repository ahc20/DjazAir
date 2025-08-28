"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  airline: string;
  flightNumber: string;
  price: {
    amount: number;
    currency: string;
  };
  stops: number;
}

interface DjazAirFlight {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  totalDuration: string;
  totalPriceEUR: number;
  totalPriceDZD?: number;
  segments: {
    origin: string;
    destination: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    priceEUR: number;
    priceDZD?: number;
    currency: string;
  }[];
  layover: {
    airport: string;
    duration: string;
    location: string;
  };
  savings: {
    amount: number;
    percentage: number;
    comparedTo: number;
  };
}

interface ComparisonResult {
  djazairFlights: DjazAirFlight[];
  classicFlights: FlightResult[];
  loading: boolean;
  error: string | null;
  analysis: {
    hasSavings: boolean;
    bestSavings: number;
    totalSavings: number;
    cheapestClassic: number;
    cheapestDjazair: number;
    savingsPercentage: number;
    recommendation: string;
  } | null;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [comparison, setComparison] = useState<ComparisonResult>({
    djazairFlights: [],
    classicFlights: [],
    loading: true,
    error: null,
    analysis: null
  });

  // Paramètres de recherche
  const origin = searchParams.get("origin") || "CDG";
  const destination = searchParams.get("destination") || "DXB";
  const departDate = searchParams.get("departDate") || "2025-09-17";
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "1");
  const cabin = searchParams.get("cabin") || "ECONOMY";

  useEffect(() => {
    const performComparison = async () => {
      try {
        setComparison(prev => ({ ...prev, loading: true, error: null }));

        // Recherche des vols DjazAir
        console.log("🔍 Recherche des vols DjazAir...");
        const djazairResponse = await fetch("/api/djazair-flights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            departureDate: departDate,
            returnDate,
            adults,
            cabin,
            maxResults: 5,
            policy: "DZ_ONLY",
            dzdEurRate: 260
          })
        });

        const djazairData = await djazairResponse.json();
        
        if (!djazairData.success || !djazairData.data || djazairData.data.length === 0) {
          console.log("❌ Aucun vol DjazAir trouvé");
          setComparison(prev => ({
            ...prev,
            loading: false,
            error: "Aucune solution DjazAir disponible pour cette recherche"
          }));
          return;
        }

        const djazairFlights = djazairData.data;
        console.log("✅ Vols DjazAir trouvés:", djazairFlights.length);

        // Recherche des vols classiques
        console.log("🔍 Recherche des vols classiques...");
        const classicResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            departureDate: departDate,
            returnDate,
            adults,
            cabin,
            maxResults: 10
          })
        });

        const classicData = await classicResponse.json();
        
        if (!classicData.success || !classicData.data || classicData.data.length === 0) {
          console.log("❌ Aucun vol classique trouvé");
          setComparison(prev => ({
            ...prev,
            djazairFlights,
            classicFlights: [],
            loading: false,
            analysis: null
          }));
          return;
        }

        const classicFlights = classicData.data;
        console.log("✅ Vols classiques trouvés:", classicFlights.length);

        // Analyse des économies
        const cheapestClassic = Math.min(...classicFlights.map((f: FlightResult) => f.price.amount));
        const cheapestDjazair = Math.min(...djazairFlights.map((f: DjazAirFlight) => f.totalPriceEUR));
        
        const bestSavings = cheapestClassic - cheapestDjazair;
        const hasSavings = bestSavings > 0;
        
        const totalSavings = djazairFlights.reduce((total: number, flight: DjazAirFlight) => {
          const savings = cheapestClassic - flight.totalPriceEUR;
          return total + Math.max(0, savings);
        }, 0);

        const savingsPercentage = hasSavings ? Math.round((bestSavings / cheapestClassic) * 100) : 0;

        let recommendation = "";
        if (hasSavings) {
          if (savingsPercentage >= 30) {
            recommendation = "🚀 Économies exceptionnelles ! La solution DjazAir est fortement recommandée.";
          } else if (savingsPercentage >= 15) {
            recommendation = "💰 Bonnes économies ! La solution DjazAir est recommandée.";
          } else {
            recommendation = "💡 Économies modérées. La solution DjazAir peut être intéressante.";
          }
        } else {
          recommendation = "⚠️ Aucune économie détectée. Les vols classiques sont moins chers.";
        }

        const analysis = {
          hasSavings,
          bestSavings,
          totalSavings,
          cheapestClassic,
          cheapestDjazair,
          savingsPercentage,
          recommendation
        };

        setComparison({
          djazairFlights,
          classicFlights,
          loading: false,
          error: null,
          analysis
        });

      } catch (error) {
        console.error("❌ Erreur lors de la comparaison:", error);
        setComparison(prev => ({
          ...prev,
          loading: false,
          error: "Erreur lors de la comparaison des vols"
        }));
      }
    };

    if (origin && destination && departDate) {
      performComparison();
    } else {
      setComparison(prev => ({ ...prev, loading: false }));
    }
  }, [origin, destination, departDate, returnDate, adults, cabin]);

  if (comparison.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">🔍 Comparaison en cours...</p>
          <p className="text-sm text-gray-500 mt-2">Analyse DjazAir vs Vols Classiques</p>
        </div>
      </div>
    );
  }

  if (comparison.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erreur de comparaison</h1>
          <p className="text-gray-600 mb-4">{comparison.error}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🚀 Comparaison DjazAir vs Vols Classiques
          </h1>
          <p className="text-xl text-gray-600">
            {origin} → {destination} • {new Date(departDate).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Analyse des économies */}
        {comparison.analysis && (
          <div className={`mb-8 rounded-lg p-6 border-2 ${
            comparison.analysis.hasSavings 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="text-center">
              <h2 className={`text-2xl font-bold mb-4 ${
                comparison.analysis.hasSavings ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {comparison.analysis.hasSavings ? '💰 Économies Détectées !' : '⚠️ Aucune Économie'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {comparison.analysis.cheapestDjazair}€
                  </div>
                  <div className="text-sm text-gray-600">Prix DjazAir</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700">
                    {comparison.analysis.cheapestClassic}€
                  </div>
                  <div className="text-sm text-gray-600">Prix Classique</div>
                </div>
                
                {comparison.analysis.hasSavings && (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {comparison.analysis.bestSavings}€
                      </div>
                      <div className="text-sm text-gray-600">Économies</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {comparison.analysis.savingsPercentage}%
                      </div>
                      <div className="text-sm text-gray-600">Réduction</div>
                    </div>
                  </>
                )}
              </div>
              
              <p className="text-lg font-medium text-gray-700 mb-4">
                {comparison.analysis.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Grille de comparaison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Solution DjazAir */}
          <div>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              ✈️ Solution DjazAir - Escale en Algérie
            </h2>
            <p className="text-gray-600 mb-4">
              Vols avec escale à Alger pour des économies garanties
            </p>
            
            {comparison.djazairFlights.length > 0 ? (
              <div className="space-y-4">
                {comparison.djazairFlights.map((flight) => (
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
                          {flight.totalDuration} • Escale {flight.layover.duration}
                        </div>
                      </div>

                      {/* Segments */}
                      <div className="space-y-2 mb-4">
                        {flight.segments.map((segment, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {index + 1}er segment {index === 0 ? '→ Alger' : 'Alger →'}
                              </span>
                              <span className="text-blue-600 font-bold">
                                {segment.priceEUR.toFixed(2)} {segment.currency}
                              </span>
                            </div>
                            <div className="text-gray-600">
                              {segment.airline} {segment.flightNumber} • {segment.duration}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bouton d'action */}
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        🎯 Réserver avec DjazAir
                      </button>
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

          {/* Vols Classiques */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              🛫 Vols Classiques
            </h2>
            <p className="text-gray-600 mb-4">
              Vols directs et avec escales traditionnels
            </p>
            
            {comparison.classicFlights.length > 0 ? (
              <div className="space-y-4">
                {comparison.classicFlights.slice(0, 5).map((flight) => (
                  <div key={flight.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="text-center">
                            <div className="font-semibold">
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
                            <div className="font-semibold">
                              {new Date(flight.arrivalTime).toLocaleTimeString('fr-FR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className="text-sm text-gray-500">{flight.destination}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {flight.airline} {flight.flightNumber}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-700">
                          {flight.price.amount}€
                        </div>
                        <button className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                          Réserver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 text-6xl mb-4">🛫</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun vol classique</h3>
                <p className="text-gray-500">Aucun vol traditionnel disponible pour cette recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* Informations sur l'API */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">ℹ️ Informations Techniques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <strong>API DjazAir:</strong> /api/djazair-flights
            </div>
            <div>
              <strong>API Classique:</strong> /api/search
            </div>
            <div>
              <strong>Source des données:</strong> API Amadeus
            </div>
            <div>
              <strong>Taux de change:</strong> Officiel (150) + Parallèle (260)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
