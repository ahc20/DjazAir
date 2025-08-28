"use client";

import React, { useState } from "react";

interface QuoteResult {
  originToAlgiers: {
    priceEUR: number;
    priceDZD?: number;
    currency: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  algiersToDestination: {
    priceEUR: number;
    priceDZD?: number;
    currency: string;
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
  };
  totalEUR: number;
  totalDZD?: number;
  dzdEurRate: number;
  warnings: string[];
}

export default function DjazAirQuoteTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Paramètres par défaut
  const [params, setParams] = useState({
    origin: "CDG",
    destination: "DXB",
    departureDate: "2025-09-17",
    returnDate: "2025-09-24",
    adults: 1,
    cabin: "ECONOMY",
    maxResults: 20,
    policy: "DZ_ONLY",
    dzdEurRate: 260,
    airlinesWhitelist: "",
  });

  const handleParamChange = (key: string, value: string | number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const testQuote = async () => {
    setIsLoading(true);
    setError(null);
    setQuoteResult(null);

    try {
      // Construction de l'URL avec les paramètres
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults.toString(),
        cabin: params.cabin,
        maxResults: params.maxResults.toString(),
        policy: params.policy,
        dzdEurRate: params.dzdEurRate.toString(),
        ...(params.airlinesWhitelist && { airlinesWhitelist: params.airlinesWhitelist }),
      });

      const url = `/api/djazair/quote?${searchParams.toString()}`;
      console.log("🧪 Test DjazAir Quote:", url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setQuoteResult(data.data);
        console.log("✅ Quote DjazAir réussi:", data.data);
      } else {
        setError(data.error || "Erreur lors de la génération du devis");
        console.error("❌ Erreur Quote:", data.error);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("❌ Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const testQuotePOST = async () => {
    setIsLoading(true);
    setError(null);
    setQuoteResult(null);

    try {
      console.log("🧪 Test DjazAir Quote POST:", params);

      const response = await fetch("/api/djazair/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        setQuoteResult(data.data);
        console.log("✅ Quote DjazAir POST réussi:", data.data);
      } else {
        setError(data.error || "Erreur lors de la génération du devis");
        console.error("❌ Erreur Quote POST:", data.error);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("❌ Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🧪 Test API DjazAir Quote
          </h1>
          <p className="text-xl text-gray-600">
            Test de l'API de devis DjazAir avec escale en Algérie
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Paramètres de Test</h2>
            <div className="space-y-4">
              {/* Origine et Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
                    Origine (IATA)
                  </label>
                  <input
                    id="origin"
                    type="text"
                    value={params.origin}
                    onChange={(e) => handleParamChange("origin", e.target.value)}
                    placeholder="CDG"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                    Destination (IATA)
                  </label>
                  <input
                    id="destination"
                    type="text"
                    value={params.destination}
                    onChange={(e) => handleParamChange("destination", e.target.value)}
                    placeholder="DXB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de départ
                  </label>
                  <input
                    id="departureDate"
                    type="date"
                    value={params.departureDate}
                    onChange={(e) => handleParamChange("departureDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de retour
                  </label>
                  <input
                    id="returnDate"
                    type="date"
                    value={params.returnDate}
                    onChange={(e) => handleParamChange("returnDate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Passagers et Classe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
                    Passagers adultes
                  </label>
                  <input
                    id="adults"
                    type="number"
                    min="1"
                    max="9"
                    value={params.adults}
                    onChange={(e) => handleParamChange("adults", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="cabin" className="block text-sm font-medium text-gray-700 mb-1">
                    Classe
                  </label>
                  <select
                    value={params.cabin}
                    onChange={(e) => handleParamChange("cabin", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ECONOMY">Économie</option>
                    <option value="PREMIUM_ECONOMY">Premium Économie</option>
                    <option value="BUSINESS">Affaires</option>
                    <option value="FIRST">Première</option>
                  </select>
                </div>
              </div>

              {/* Politique et Taux */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="policy" className="block text-sm font-medium text-gray-700 mb-1">
                    Politique devise
                  </label>
                  <select
                    value={params.policy}
                    onChange={(e) => handleParamChange("policy", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DZ_ONLY">DZ_ONLY (DZD uniquement depuis ALG)</option>
                    <option value="ALL_DZ_TOUCHING">ALL_DZ_TOUCHING (DZD si touche ALG)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dzdEurRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Taux DZD/EUR
                  </label>
                  <input
                    id="dzdEurRate"
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    value={params.dzdEurRate}
                    onChange={(e) => handleParamChange("dzdEurRate", parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Compagnies et Résultats max */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="airlinesWhitelist" className="block text-sm font-medium text-gray-700 mb-1">
                    Compagnies (CSV)
                  </label>
                  <input
                    id="airlinesWhitelist"
                    type="text"
                    value={params.airlinesWhitelist}
                    onChange={(e) => handleParamChange("airlinesWhitelist", e.target.value)}
                    placeholder="AH,AF (Air Algérie, Air France)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-1">
                    Résultats max
                  </label>
                  <input
                    id="maxResults"
                    type="number"
                    min="1"
                    max="100"
                    value={params.maxResults}
                    onChange={(e) => handleParamChange("maxResults", parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Boutons de test */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={testQuote}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                  {isLoading ? "🔄 Test en cours..." : "🚀 Tester Quote GET"}
                </button>
                
                <button
                  onClick={testQuotePOST}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                  {isLoading ? "🔄 Test en cours..." : "📤 Tester Quote POST"}
                </button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-6">
            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-center text-red-700">
                  <p className="font-medium">❌ Erreur lors du test</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Résultat du devis */}
            {quoteResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-700 mb-4">✅ Devis DjazAir Généré</h3>
                <div className="space-y-4">
                  {/* Premier segment */}
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-700 mb-2">
                      1er segment : {params.origin} → ALG
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Compagnie: {quoteResult.originToAlgiers.airline}</div>
                      <div>Vol: {quoteResult.originToAlgiers.flightNumber}</div>
                      <div>Prix EUR: {quoteResult.originToAlgiers.priceEUR}€</div>
                      {quoteResult.originToAlgiers.priceDZD && (
                        <div>Prix DZD: {quoteResult.originToAlgiers.priceDZD} DZD</div>
                      )}
                      <div>Devise: {quoteResult.originToAlgiers.currency}</div>
                      <div>Durée: {quoteResult.originToAlgiers.duration}</div>
                    </div>
                  </div>

                  {/* Deuxième segment */}
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-700 mb-2">
                      2ème segment : ALG → {params.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Compagnie: {quoteResult.algiersToDestination.airline}</div>
                      <div>Vol: {quoteResult.algiersToDestination.flightNumber}</div>
                      <div>Prix EUR: {quoteResult.algiersToDestination.priceEUR}€</div>
                      {quoteResult.algiersToDestination.priceDZD && (
                        <div>Prix DZD: {quoteResult.algiersToDestination.priceDZD} DZD</div>
                      )}
                      <div>Devise: {quoteResult.algiersToDestination.currency}</div>
                      <div>Durée: {quoteResult.algiersToDestination.duration}</div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border border-green-300">
                    <div className="text-center">
                      <div className="text-sm text-green-600 mb-1">Prix Total DjazAir</div>
                      <div className="text-3xl font-bold text-green-700">
                        {quoteResult.totalEUR}€
                      </div>
                      {quoteResult.totalDZD && (
                        <div className="text-sm text-green-600">
                          {quoteResult.totalDZD.toLocaleString()} DZD (taux: {quoteResult.dzdEurRate})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avertissements */}
                  {quoteResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-700 mb-2">⚠️ Avertissements</h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {quoteResult.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations techniques */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Informations Techniques</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Endpoint :</strong> /api/djazair/quote</p>
                <p><strong>Méthodes :</strong> GET et POST</p>
                <p><strong>Logique :</strong> Recherche en deux segments via ALG</p>
                <p><strong>Devises :</strong> EUR/DZD selon la politique</p>
                <p><strong>Conversion :</strong> DZD → EUR avec taux configurable</p>
                <p><strong>Filtrage :</strong> Compagnies par whitelist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
