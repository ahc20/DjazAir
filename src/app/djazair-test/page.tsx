"use client";

import React, { useState } from "react";
import { DjazAirOptionCard } from "@/components/DjazAirOptionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DjazAirTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [djazairOption, setDjazairOption] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testDjazAir = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        origin: "CDG",
        destination: "DXB",
        departureDate: "2025-09-17",
        passengers: 1,
        cabinClass: "Economy",
        currency: "EUR",
      };

      console.log("🧪 Test DjazAir Simple:", requestBody);

      const response = await fetch("/api/djazair-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setDjazairOption(data.data);
        console.log("✅ DjazAir Simple réussi:", data.data);
      } else {
        setError(data.error || "Erreur DjazAir");
        console.error("❌ Erreur DjazAir:", data.error);
      }
    } catch (err) {
      setError("Erreur de connexion");
      console.error("❌ Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🧪 Test DjazAir Simple
          </h1>
          <p className="text-xl text-gray-600">
            Test de l'API DjazAir indépendante avec escale en Algérie
          </p>
        </div>

        {/* Bouton de test */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test de l'API DjazAir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <strong>Route testée :</strong> CDG (Paris) → DXB (Dubai)
                <br />
                <strong>Date :</strong> 17 septembre 2025
                <br />
                <strong>Passagers :</strong> 1
              </div>
              
              <Button
                onClick={testDjazAir}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg"
              >
                {isLoading ? "🔄 Test en cours..." : "🚀 Tester DjazAir Simple"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultat DjazAir */}
        {djazairOption && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                ✅ Solution DjazAir Trouvée !
              </h2>
              <p className="text-gray-600">
                L'API DjazAir fonctionne parfaitement
              </p>
            </div>
            
            <DjazAirOptionCard
              option={djazairOption}
              onBook={(optionId) => {
                console.log("Réserver DjazAir:", optionId);
                alert(`Réservation DjazAir ${optionId} !`);
              }}
            />
          </div>
        )}

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

        {/* Informations techniques */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informations Techniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>API :</strong> /api/djazair-simple</p>
              <p><strong>Méthode :</strong> POST</p>
              <p><strong>Temps de réponse :</strong> &lt; 100ms (calcul local)</p>
              <p><strong>Dépendances :</strong> Aucune (fonctionne en isolation)</p>
              <p><strong>Fallback :</strong> Intégré dans l'API</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
