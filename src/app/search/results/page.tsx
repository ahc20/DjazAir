"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FlightResult } from "@/types/flight";
import { DjazAirFlight } from "@/types/djazair";
import { getAirlineLogo, getAirlineName } from "@/data/airlineLogos";
import { getAirportInfo } from "@/data/airports";
import Image from "next/image";

// Interface pour l'analyse Gemini
interface GeminiAnalysis {
  recommendation: {
    flightId: string;
    title: string;
    reason: string;
  };
  savingsExplanation: string;
  tips: string[];
  comparisonSummary: string;
}

interface SearchResults {
  djazairFlights: DjazAirFlight[];
  classicFlights: FlightResult[];
  loading: boolean;
  error: string | null;
  djazairUnavailableMessage?: string;
  alternativeDateMessage?: string;
  isAlternativeDate?: boolean;
  aiAnalysis?: GeminiAnalysis | null;  // Analyse IA
  aiLoading?: boolean;  // Chargement analyse IA
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
    djazairUnavailableMessage: undefined,
    aiAnalysis: null,
    aiLoading: false,
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
          dzdEurRate: 280  // Taux parallèle marché noir
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

        // Stocker info si date alternative utilisée
        if (data.isAlternativeDate) {
          console.log("📅 Date alternative utilisée:", data.alternativeDateMessage);
        }

        // Rechercher les vols classiques pour comparaison
        await searchClassicFlights(data.data, data.isAlternativeDate, data.alternativeDateMessage);
      } else {
        // Pas de vols DjazAir trouvés - CONTINUER avec les vols classiques
        console.log("⚠️ Aucun vol DjazAir trouvé, recherche des vols classiques...");

        // Mettre djazairFlights à vide mais PAS d'erreur
        setSearchResults(prev => ({
          ...prev,
          djazairFlights: [],
          djazairUnavailableMessage: data.message || "Aucun vol via Alger disponible pour ces dates"
        }));

        // Continuer à chercher les vols classiques
        await searchClassicFlights([]);
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

  // Fonction pour appeler l'analyse IA Gemini
  const fetchAIAnalysis = async (djazairFlights: DjazAirFlight[], classicFlights: FlightResult[]) => {
    try {
      setSearchResults(prev => ({ ...prev, aiLoading: true }));
      console.log("🤖 Demande d'analyse IA...");

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          djazairFlights: djazairFlights.slice(0, 5),
          classicFlights: classicFlights.slice(0, 5),
          searchParams: {
            origin,
            destination,
            departureDate: departDate,
            returnDate
          }
        })
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        console.log("✅ Analyse IA reçue:", data.analysis);
        setSearchResults(prev => ({
          ...prev,
          aiLoading: false,
          aiAnalysis: data.analysis
        }));
      } else {
        console.log("⚠️ Pas d'analyse IA disponible");
        setSearchResults(prev => ({ ...prev, aiLoading: false }));
      }
    } catch (error) {
      console.error("❌ Erreur analyse IA:", error);
      setSearchResults(prev => ({ ...prev, aiLoading: false }));
    }
  };

  const searchClassicFlights = async (djazairFlights: DjazAirFlight[], isAltDate?: boolean, altDateMessage?: string) => {
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
        // NE PAS inclure viaAlgiersFlights dans les vols classiques 
        // car ils sont similaires aux solutions DjazAir

        // Filtrer pour ne garder que les vrais vols classiques
        // (directs ou avec escales HORS Algérie)
        const classicFlightsFiltered = directFlights.filter((flight: FlightResult) => {
          // Exclure les vols Air Algérie ou avec escale à ALG
          if (flight.airline === 'Air Algérie' || (flight as any).airlineCode === 'AH') {
            return false;
          }
          // Si le vol a des segments, vérifier qu'aucun ne passe par ALG
          if (flight.segments && flight.segments.length > 0) {
            const passesAlgiers = flight.segments.some((seg: any) =>
              seg.origin === 'ALG' || seg.destination === 'ALG'
            );
            if (passesAlgiers) return false;
          }
          return true;
        });

        if (classicFlightsFiltered.length > 0) {
          console.log("✅ Vols classiques trouvés:", classicFlightsFiltered.length);
          console.log("   - Vols filtrés (hors Air Algérie/ALG):", classicFlightsFiltered.length);

          // Calculer les économies
          const cheapestClassic = Math.min(...classicFlightsFiltered.map((f: FlightResult) => f.price.amount));
          const cheapestDjazair = Math.min(...djazairFlights.map(f => f.totalPriceEUR));

          const bestSavings = cheapestClassic - cheapestDjazair;
          const totalSavings = djazairFlights.reduce((total, flight) => {
            const savings = cheapestClassic - flight.totalPriceEUR;
            return total + Math.max(0, savings);
          }, 0);

          setSearchResults({
            djazairFlights,
            classicFlights: classicFlightsFiltered,
            loading: false,
            error: null,
            isAlternativeDate: isAltDate,
            alternativeDateMessage: altDateMessage,
            savings: {
              best: bestSavings,
              total: totalSavings
            }
          });

          // Lancer l'analyse IA en parallèle
          fetchAIAnalysis(djazairFlights, classicFlightsFiltered);
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
        {/* Bannière Date Alternative */}
        {searchResults.isAlternativeDate && searchResults.alternativeDateMessage && (
          <div className="mb-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-center gap-3 text-white">
              <span className="text-2xl">📅</span>
              <div className="text-center">
                <div className="font-bold text-lg">Date alternative trouvée !</div>
                <div className="text-orange-100">{searchResults.alternativeDateMessage}</div>
              </div>
              <span className="text-2xl">✈️</span>
            </div>
          </div>
        )}

        {/* Panneau Analyse IA Gemini */}
        {(searchResults.aiLoading || searchResults.aiAnalysis) && (
          <div className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 shadow-lg">
            {searchResults.aiLoading ? (
              <div className="flex items-center justify-center gap-3 text-white">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                <span>🤖 Analyse IA en cours...</span>
              </div>
            ) : searchResults.aiAnalysis && (
              <div className="text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <span className="font-bold text-lg">Recommandation IA</span>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Gemini AI</span>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-3">
                  <div className="font-semibold text-lg mb-1">{searchResults.aiAnalysis.recommendation.title}</div>
                  <p className="text-purple-100">{searchResults.aiAnalysis.recommendation.reason}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-semibold mb-1">💰 Économies DjazAir</div>
                    <p className="text-sm text-purple-100">{searchResults.aiAnalysis.savingsExplanation}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-semibold mb-1">💡 Conseils</div>
                    <ul className="text-sm text-purple-100 list-disc list-inside">
                      {searchResults.aiAnalysis.tips.slice(0, 3).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header avec économies - Design Moderne */}
        {searchResults.savings && searchResults.savings.best > 0 && (
          <div className="relative mb-6 lg:mb-8 rounded-2xl overflow-hidden">
            {/* Fond gradient animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

            {/* Contenu */}
            <div className="relative z-10 p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Titre principal */}
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
                    <span className="text-xl">🎉</span>
                    <span className="text-white font-medium text-sm">Bonne nouvelle !</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    Économisez jusqu'à {searchResults.savings.best.toFixed(0)}€
                  </h1>
                  <p className="text-white/80">
                    en transitant par Alger sur ce trajet
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 lg:gap-8">
                  <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                    <div className="text-3xl lg:text-4xl font-bold text-white">{searchResults.djazairFlights.length}</div>
                    <div className="text-xs text-white/70 uppercase tracking-wide">Options</div>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                  <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                    <div className="text-3xl lg:text-4xl font-bold text-yellow-300">{searchResults.savings.best.toFixed(0)}€</div>
                    <div className="text-xs text-white/70 uppercase tracking-wide">Max économie</div>
                  </div>
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

            {/* Calcul et Affichage Dynamique DjazAir */}
            {(() => {
              const bestClassicPrice = searchResults.classicFlights.length > 0
                ? Math.min(...searchResults.classicFlights.map(f => f.price.amount))
                : Infinity;
              const bestDjazAirPrice = searchResults.djazairFlights.length > 0
                ? searchResults.djazairFlights[0].totalPriceEUR
                : Infinity;
              const isCheaper = bestDjazAirPrice < bestClassicPrice;
              const priceDiff = bestDjazAirPrice - bestClassicPrice;

              return searchResults.djazairFlights.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.djazairFlights.slice(0, 3).map((flight) => (
                    <div key={flight.id} className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${isCheaper ? 'border-green-500' : 'border-gray-200'}`}>
                      {/* Header du vol */}
                      <div className={`p-4 text-white ${isCheaper ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-gray-700 to-gray-800'}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{isCheaper ? '🎉' : '✈️'}</span>
                            <div>
                              <h3 className="text-lg font-bold">
                                {isCheaper ? 'DjazAir - Meilleure Offre !' : 'DjazAir - Option Flexible'}
                              </h3>
                              <p className={isCheaper ? "text-green-100" : "text-gray-300"}>
                                {flight.origin} → {flight.destination}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{flight.totalPriceEUR}€</div>
                            {isCheaper ? (
                              <div className="text-green-100 text-sm font-bold animate-pulse">
                                Économie: {(bestClassicPrice - flight.totalPriceEUR).toFixed(2)}€
                              </div>
                            ) : (
                              <div className="text-orange-300 text-xs font-medium">
                                +{priceDiff.toFixed(2)}€ vs Classique
                              </div>
                            )}
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

                        {/* Segments with enhanced display */}
                        <div className="space-y-3">
                          {flight.segments.map((segment, index) => {
                            // Utiliser le champ leg si disponible, sinon fallback sur l'index
                            const isReturnSegment = segment.leg === 'RETOUR' || index >= 2;
                            const segmentLegLabel = segment.leg || (isReturnSegment ? 'RETOUR' : 'ALLER');
                            const isFromAlgeria = segment.origin === 'ALG';

                            // Extraire le code compagnie du numéro de vol
                            const airlineCode = segment.flightNumber.substring(0, 2);
                            const logoUrl = getAirlineLogo(airlineCode);

                            // Afficher séparateur entre ALLER et RETOUR
                            const showReturnSeparator = index === 2 && flight.segments.length > 2;

                            return (
                              <div key={index}>
                                {/* Séparateur RETOUR */}
                                {showReturnSeparator && (
                                  <div className="flex items-center justify-center py-4 my-2">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                                    <div className="mx-4 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-bold border border-purple-200">
                                      ↩️ VOL RETOUR
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                                  </div>
                                )}

                                {/* Indicateur d'escale entre les segments */}
                                {index > 0 && index !== 2 && (
                                  <div className="flex justify-center py-2">
                                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm border border-amber-200">
                                      <span>🛬</span>
                                      <span className="font-medium">
                                        Escale à ALG ({flight.layover?.duration || '5h'})
                                      </span>
                                      <span>🛫</span>
                                    </div>
                                  </div>
                                )}

                                <div className={`p-4 rounded-lg border-2 ${isFromAlgeria
                                  ? 'bg-gradient-to-r from-green-50 to-white border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                                  }`}>
                                  {/* En-tête avec logo */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm p-1 flex items-center justify-center">
                                        <Image
                                          src={logoUrl}
                                          alt={segment.airline}
                                          width={32}
                                          height={32}
                                          className="object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <div className="font-semibold text-gray-800">
                                          {segment.airline}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Vol {segment.flightNumber}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-blue-600">
                                        {segment.priceEUR.toFixed(2)}€
                                      </div>
                                      {segment.priceDZD && (
                                        <div className="text-sm text-green-600">
                                          {segment.priceDZD.toLocaleString()} DZD
                                        </div>
                                      )}
                                      {isFromAlgeria && (
                                        <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium mt-1">
                                          💰 Taux parallèle
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Horaires */}
                                  <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-3">
                                    <div className="text-center">
                                      <div className="text-xl font-bold text-gray-800">
                                        {new Date(segment.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <div className="text-sm font-medium text-gray-600">{segment.origin}</div>
                                      <div className="text-xs text-gray-400">
                                        {new Date(segment.departureTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                      </div>
                                    </div>

                                    <div className="flex-1 mx-4">
                                      <div className="flex items-center">
                                        <div className="h-px flex-1 bg-gray-300"></div>
                                        <div className="px-2 text-sm text-gray-500">{segment.duration}</div>
                                        <div className="h-px flex-1 bg-gray-300"></div>
                                      </div>
                                    </div>

                                    <div className="text-center">
                                      <div className="text-xl font-bold text-gray-800">
                                        {new Date(segment.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <div className="text-sm font-medium text-gray-600">{segment.destination}</div>
                                      <div className="text-xs text-gray-400">
                                        {new Date(segment.arrivalTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Détails des escales si multi-segments */}
                                  {segment.subSegments && segment.subSegments.length > 1 && (() => {
                                    // Calculer le temps d'escale entre les segments
                                    const calculateLayoverTime = (arrivalTime: string, departureTime: string) => {
                                      const arrival = new Date(arrivalTime);
                                      const departure = new Date(departureTime);
                                      const diffMs = departure.getTime() - arrival.getTime();
                                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                      const mins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                      return `${hours}h ${mins}m`;
                                    };

                                    // Calculer la durée totale
                                    const firstDeparture = new Date(segment.subSegments[0].departureTime);
                                    const lastArrival = new Date(segment.subSegments[segment.subSegments.length - 1].arrivalTime);
                                    const totalMs = lastArrival.getTime() - firstDeparture.getTime();
                                    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
                                    const totalMins = Math.round((totalMs % (1000 * 60 * 60)) / (1000 * 60));
                                    const totalDuration = `${totalHours}h ${totalMins}m`;

                                    return (
                                      <div className="mt-3 mb-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        {/* En-tête avec durée totale */}
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                                          <div className="text-xs font-semibold text-gray-600">
                                            📍 Détail du trajet ({segment.subSegments.length} segments)
                                          </div>
                                          <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                                            Durée totale: {totalDuration}
                                          </div>
                                        </div>

                                        <div className="space-y-3">
                                          {segment.subSegments.map((subSeg: any, subIdx: number) => {
                                            const originCity = getAirportInfo(subSeg.origin)?.city || subSeg.origin;
                                            const destCity = getAirportInfo(subSeg.destination)?.city || subSeg.destination;
                                            const depTime = new Date(subSeg.departureTime);
                                            const arrTime = new Date(subSeg.arrivalTime);
                                            const isNextDay = arrTime.getDate() !== depTime.getDate();

                                            return (
                                              <div key={subIdx}>
                                                {/* Segment de vol */}
                                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✈️</span>
                                                      <span className="font-semibold text-gray-700">Vol {subIdx + 1}: {subSeg.airline} {subSeg.flightNumber}</span>
                                                    </div>
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                      {subSeg.duration}
                                                    </span>
                                                  </div>

                                                  <div className="flex items-center justify-between text-sm">
                                                    {/* Départ */}
                                                    <div className="text-center">
                                                      <div className="font-bold text-gray-800">
                                                        {depTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                      </div>
                                                      <div className="text-xs text-gray-500">{subSeg.origin} ({originCity})</div>
                                                      <div className="text-xs text-gray-400">
                                                        {depTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                      </div>
                                                    </div>

                                                    {/* Flèche */}
                                                    <div className="flex-1 mx-3">
                                                      <div className="flex items-center">
                                                        <div className="h-px flex-1 bg-gray-300"></div>
                                                        <span className="px-2 text-gray-400">→</span>
                                                        <div className="h-px flex-1 bg-gray-300"></div>
                                                      </div>
                                                    </div>

                                                    {/* Arrivée */}
                                                    <div className="text-center">
                                                      <div className="font-bold text-gray-800">
                                                        {arrTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        {isNextDay && <span className="text-orange-500 text-xs ml-1">+1j</span>}
                                                      </div>
                                                      <div className="text-xs text-gray-500">{subSeg.destination} ({destCity})</div>
                                                      <div className="text-xs text-gray-400">
                                                        {arrTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Temps d'escale entre les segments */}
                                                {subIdx < segment.subSegments.length - 1 && (
                                                  <div className="flex items-center justify-center py-2">
                                                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
                                                      <span>🛬</span>
                                                      <span className="font-medium text-sm">
                                                        Escale à {getAirportInfo(subSeg.destination)?.city || subSeg.destination}
                                                      </span>
                                                      <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
                                                        {calculateLayoverTime(subSeg.arrivalTime, segment.subSegments[subIdx + 1].departureTime)}
                                                      </span>
                                                      <span>🛫</span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Infos bagages et devise */}
                                  <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <span>🧳</span>
                                      <span>Bagage inclus: 23kg soute</span>
                                    </div>
                                    <div>
                                      Devise: <span className="font-medium">{segment.currency || 'EUR'}</span>
                                    </div>
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">
                      Pas de vol DjazAir pour ces dates
                    </h3>
                    <p className="text-blue-600 mb-4">
                      {searchResults.djazairUnavailableMessage || "Aucune combinaison via Alger disponible"}
                    </p>

                    <div className="bg-white/70 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>💡 Suggestions :</strong>
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2 text-left">
                        <li className="flex items-start gap-2">
                          <span>📅</span>
                          <span>Essayez des dates <strong>+/- 3 jours</strong> pour plus d'options</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🎯</span>
                          <span>Certaines destinations ont plus de connexions via Alger</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>➡️</span>
                          <span>Consultez les <strong>vols classiques</strong> ci-contre</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => window.history.back()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🔄 Modifier ma recherche
                    </button>
                  </div>
                </div>
              );
            })()}
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
                  <div key={flight.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                    {/* En-tête du vol (Résumé) */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <span className="text-xl">✈️</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-lg">
                            {new Date(flight.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(flight.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {flight.duration} • {flight.stops === 0 ? 'Direct' : `${flight.stops} escale${flight.stops > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <div className="text-2xl font-bold text-gray-800">{flight.price.amount}€</div>
                        <button
                          onClick={() => handleBookFlight(flight)}
                          className="bg-gray-900 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 mt-1"
                        >
                          Réserver
                        </button>
                      </div>
                    </div>

                    {/* Détails des segments */}
                    {flight.segments && flight.segments.length > 0 ? (
                      <div className="space-y-3">
                        {flight.segments.map((segment, idx) => (
                          <div key={idx} className="relative pl-6 border-l-2 border-gray-200 ml-2">
                            {/* Petit rond pour la timeline */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>

                            <div className="mb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-sm text-gray-700">
                                    {segment.origin} <span className="text-gray-500 font-normal">({getAirportInfo(segment.origin)?.city || segment.origin})</span> → {segment.destination} <span className="text-gray-500 font-normal">({getAirportInfo(segment.destination)?.city || segment.destination})</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {getAirlineName(segment.airline)}
                                    <span className="text-gray-400 font-normal ml-1">
                                      ({segment.airline} {segment.flightNumber})
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono text-gray-600">
                                    {new Date(segment.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    {' '}-{' '}
                                    {new Date(segment.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-xs text-gray-400">{segment.duration}</div>
                                </div>
                              </div>
                            </div>

                            {/* Affichage de l'escale si ce n'est pas le dernier segment */}
                            {idx < (flight.segments?.length || 0) - 1 && (
                              <div className="my-2 p-1.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100 inline-block">
                                ⏳ Escale à {segment.destination}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">{flight.airline}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {flight.origin} → {flight.destination}
                            </div>
                            <div className="text-sm text-gray-500">
                              {flight.flightNumber} • {flight.duration} • {flight.stops === 0 ? 'Vol direct' : `${flight.stops} escale(s)`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
