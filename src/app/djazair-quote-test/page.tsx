"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Origine et Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origine (IATA)</Label>
                  <Input
                    id="origin"
                    value={params.origin}
                    onChange={(e) => handleParamChange("origin", e.target.value)}
                    placeholder="CDG"
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination (IATA)</Label>
                  <Input
                    id="destination"
                    value={params.destination}
                    onChange={(e) => handleParamChange("destination", e.target.value)}
                    placeholder="DXB"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureDate">Date de départ</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={params.departureDate}
                    onChange={(e) => handleParamChange("departureDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="returnDate">Date de retour</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={params.returnDate}
                    onChange={(e) => handleParamChange("returnDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Passagers et Classe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adults">Passagers adultes</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    max="9"
                    value={params.adults}
                    onChange={(e) => handleParamChange("adults", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="cabin">Classe</Label>
                  <Select value={params.cabin} onValueChange={(value) => handleParamChange("cabin", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Économie</SelectItem>
                      <SelectItem value="PREMIUM_ECONOMY">Premium Économie</SelectItem>
                      <SelectItem value="BUSINESS">Affaires</SelectItem>
                      <SelectItem value="FIRST">Première</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Politique et Taux */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policy">Politique devise</Label>
                  <Select value={params.policy} onValueChange={(value) => handleParamChange("policy", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DZ_ONLY">DZ_ONLY (DZD uniquement depuis ALG)</SelectItem>
                      <SelectItem value="ALL_DZ_TOUCHING">ALL_DZ_TOUCHING (DZD si touche ALG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dzdEurRate">Taux DZD/EUR</Label>
                  <Input
                    id="dzdEurRate"
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    value={params.dzdEurRate}
                    onChange={(e) => handleParamChange("dzdEurRate", parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Compagnies et Résultats max */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="airlinesWhitelist">Compagnies (CSV)</Label>
                  <Input
                    id="airlinesWhitelist"
                    value={params.airlinesWhitelist}
                    onChange={(e) => handleParamChange("airlinesWhitelist", e.target.value)}
                    placeholder="AH,AF (Air Algérie, Air France)"
                  />
                </div>
                <div>
                  <Label htmlFor="maxResults">Résultats max</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    min="1"
                    max="100"
                    value={params.maxResults}
                    onChange={(e) => handleParamChange("maxResults", parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Boutons de test */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={testQuote}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                >
                  {isLoading ? "🔄 Test en cours..." : "🚀 Tester Quote GET"}
                </Button>
                
                <Button
                  onClick={testQuotePOST}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50 font-bold py-3"
                >
                  {isLoading ? "🔄 Test en cours..." : "📤 Tester Quote POST"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="space-y-6">
            {/* Erreur */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center text-red-700">
                    <p className="font-medium">❌ Erreur lors du test</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résultat du devis */}
            {quoteResult && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700">✅ Devis DjazAir Généré</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            )}

            {/* Informations techniques */}
            <Card>
              <CardHeader>
                <CardTitle>Informations Techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Endpoint :</strong> /api/djazair/quote</p>
                  <p><strong>Méthodes :</strong> GET et POST</p>
                  <p><strong>Logique :</strong> Recherche en deux segments via ALG</p>
                  <p><strong>Devises :</strong> EUR/DZD selon la politique</p>
                  <p><strong>Conversion :</strong> DZD → EUR avec taux configurable</p>
                  <p><strong>Filtrage :</strong> Compagnies par whitelist</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
