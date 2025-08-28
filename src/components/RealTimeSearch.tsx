"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Search, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface FlightSearchResult {
  directFlights: any[];
  viaAlgiersFlights: any[];
  bestDirectPriceEUR: number | null;
  bestViaAlgiersPriceEUR: number | null;
  providers: string[];
  timestamp: string;
  priceBreakdown: {
    direct: {
      totalEUR: number;
      totalDZD?: number;
      breakdown: any[];
    };
    viaAlgiers: {
      totalEUR: number;
      totalDZD: number;
      breakdown: {
        outbound: any;
        inbound: any;
        total: number;
      }[];
    };
  };
}

export function RealTimeSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FlightSearchResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const searchParisDubai = async () => {
    setIsSearching(true);
    setError(null);

    try {
      // Recherche Paris → Dubai via Alger
      const response = await fetch(
        "/api/search?origin=CDG&destination=DXB&date=2025-01-15"
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
        console.log("Résultats de recherche:", result.data);
      } else {
        throw new Error(result.message || "Erreur lors de la recherche");
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      setError(
        error instanceof Error ? error.message : "Erreur lors de la recherche"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const searchCustomRoute = async () => {
    setIsSearching(true);
    setError(null);

    try {
      // Recherche personnalisée
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: "CDG",
          destination: "DXB",
          departDate: "2025-01-15",
          adults: 1,
          children: 0,
          infants: 0,
          cabin: "ECONOMY",
          currency: "EUR",
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
        console.log("Résultats de recherche personnalisée:", result.data);
      } else {
        throw new Error(result.message || "Erreur lors de la recherche");
      }
    } catch (error) {
      console.error("Erreur recherche personnalisée:", error);
      setError(
        error instanceof Error ? error.message : "Erreur lors de la recherche"
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Testez la vraie recherche de vols avec Air Algérie et autres
            fournisseurs
          </p>

          <div className="flex gap-4">
            <Button
              onClick={searchParisDubai}
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plane className="h-4 w-4" />
              )}
              Recherche Paris → Dubai
            </Button>

            <Button
              onClick={searchCustomRoute}
              disabled={isSearching}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Recherche Personnalisée
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {searchResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700">
                  Recherche terminée ! {searchResults.providers.length}{" "}
                  fournisseurs consultés
                </span>
              </div>

              {/* Résultats directs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-blue-800 text-lg">
                      Vols Directs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchResults.directFlights.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPrice(searchResults.bestDirectPriceEUR!)} €
                        </div>
                        <div className="text-sm text-gray-600">
                          {searchResults.directFlights.length} option(s)
                          trouvée(s)
                        </div>
                        {searchResults.priceBreakdown.direct.totalDZD && (
                          <div className="text-sm text-gray-600">
                            ~
                            {searchResults.priceBreakdown.direct.totalDZD.toLocaleString()}{" "}
                            DZD
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Aucun vol direct trouvé
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Résultats via Alger */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-green-800 text-lg">
                      Via Alger
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchResults.viaAlgiersFlights.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(searchResults.bestViaAlgiersPriceEUR!)} €
                        </div>
                        <div className="text-sm text-gray-600">
                          {searchResults.viaAlgiersFlights.length} option(s)
                          trouvée(s)
                        </div>
                        <div className="text-sm text-gray-600">
                          {searchResults.priceBreakdown.viaAlgiers.totalDZD.toLocaleString()}{" "}
                          DZD
                        </div>

                        {/* Décomposition des prix */}
                        {searchResults.priceBreakdown.viaAlgiers.breakdown
                          .length > 0 && (
                          <div className="mt-3 p-2 bg-white rounded border text-xs">
                            <div className="font-medium mb-1">
                              Décomposition:
                            </div>
                            {searchResults.priceBreakdown.viaAlgiers.breakdown
                              .slice(0, 2)
                              .map((option, index) => (
                                <div key={index} className="text-gray-600">
                                  <div>
                                    Paris → Alger:{" "}
                                    {formatPrice(option.outbound.priceEUR)} €
                                  </div>
                                  <div>
                                    Alger → Dubai:{" "}
                                    {formatPrice(option.inbound.priceEUR)} €
                                  </div>
                                  <div className="font-medium">
                                    Total: {formatPrice(option.total)} €
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Aucun vol via Alger trouvé
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Fournisseurs consultés */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Fournisseurs consultés:</span>{" "}
                {searchResults.providers.join(", ")}
              </div>

              <div className="text-xs text-gray-500">
                Recherche effectuée le{" "}
                {new Date(searchResults.timestamp).toLocaleString("fr-FR")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
