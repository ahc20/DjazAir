"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plane,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Building2,
  ArrowUpRight,
  Euro,
  Clock,
  MapPin,
  AlertCircle,
  Info,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface RealFlightOption {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
  aircraft?: string;
  cabinClass: string;
  provider: string;
  direct: boolean;
}

interface RealFlightComparison {
  route: string;
  searchParams: any;
  directFlights: RealFlightOption[];
  viaAlgiersFlights: RealFlightOption[];
  arbitrageOpportunities: Array<{
    directFlight: RealFlightOption;
    viaAlgiersFlight: RealFlightOption;
    savings: {
      amount: number;
      percentage: number;
    };
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    recommendations: string[];
  }>;
  bestOptions: {
    direct: RealFlightOption | null;
    viaAlgiers: RealFlightOption | null;
    bestArbitrage: {
      direct: RealFlightOption;
      viaAlgiers: RealFlightOption;
      savings: number;
      percentage: number;
    } | null;
  };
  searchTimestamp: Date;
}

export function RealFlightComparison() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] =
    useState<RealFlightComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    origin: "",
    destination: "",
    departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    returnDate: "",
    passengers: 1,
    cabinClass: "Economy",
    currency: "EUR",
  });

  const searchFlights = async () => {
    // Validation des champs requis
    if (!searchParams.origin || !searchParams.destination) {
      setError("Veuillez remplir l'origine et la destination");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await fetch("/api/real-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        console.log("✅ Résultats de recherche réelle:", data.data);
      } else {
        setError(data.error || "Erreur de recherche");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("❌ Erreur:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateTimeString;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "MEDIUM":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "HIGH":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de Vols avec Comparaison "Via Alger"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Entrez vos critères de voyage et découvrez les vraies opportunités
            d'économies via l'escale à Alger
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Aéroport de départ</Label>
              <Input
                id="origin"
                value={searchParams.origin}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    origin: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="CDG, LHR, FRA..."
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="destination">Aéroport d'arrivée</Label>
              <Input
                id="destination"
                value={searchParams.destination}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    destination: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="DXB, BKK, SIN..."
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departureDate">Date de départ</Label>
              <Input
                type="date"
                value={searchParams.departureDate}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    departureDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="returnDate">Date de retour (optionnel)</Label>
              <Input
                type="date"
                value={searchParams.returnDate}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    returnDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cabinClass">Classe</Label>
              <Select
                value={searchParams.cabinClass}
                onValueChange={(value) =>
                  setSearchParams((prev) => ({ ...prev, cabinClass: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Economy">Économique</SelectItem>
                  <SelectItem value="Premium Economy">
                    Premium Économique
                  </SelectItem>
                  <SelectItem value="Business">Affaires</SelectItem>
                  <SelectItem value="First">Première</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={searchFlights}
              disabled={
                isSearching || !searchParams.origin || !searchParams.destination
              }
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Rechercher des Vols
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults && searchResults.bestOptions.bestArbitrage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vol Direct */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Plane className="h-5 w-5" />
                Vol Direct
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(
                    searchResults.bestOptions.bestArbitrage.direct.price.amount,
                    "EUR"
                  )}
                </div>
                <div className="text-sm text-blue-600">
                  Prix total aller-retour
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-blue-600" />
                  <span>Vol direct sans escale</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>Bagages inclus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span>Protection de correspondance</span>
                </div>
              </div>

              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Réserver via canal officiel
              </Button>
            </CardContent>
          </Card>

          {/* Via Alger */}
          <Card className="border-green-200">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Building2 className="h-5 w-5" />
                Via Alger (Simulation)
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  SIMULATION
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPrice(
                    searchResults.bestOptions.bestArbitrage.viaAlgiers.price
                      .amount,
                    "EUR"
                  )}
                </div>
                <div className="text-sm text-green-600 mb-2">
                  Économie de {searchResults.bestOptions.bestArbitrage.savings}€
                  ({searchResults.bestOptions.bestArbitrage.percentage}%)
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Origin → Alger:</span>
                  <span className="font-medium">130€</span>
                </div>
                <div className="flex justify-between">
                  <span>Alger → Destination:</span>
                  <span className="font-medium">344€</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Via Alger:</span>
                  <span>
                    {formatPrice(
                      searchResults.bestOptions.bestArbitrage.viaAlgiers.price
                        .amount,
                      "EUR"
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Billets séparés (correspondance non protégée)</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <Info className="h-4 w-4" />
                  <span>Visa requis pour l'Algérie</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risque de correspondance</span>
                </div>
              </div>

              <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Réserver via canal officiel
              </Button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                * Simulation basée sur des hypothèses de prix local en DZD
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Détail des résultats */}
      {searchResults && (
        <div className="space-y-6">
          {/* Résumé des opportunités */}
          {searchResults.arbitrageOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Opportunités d'Arbitrage Identifiées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.arbitrageOpportunities
                    .slice(0, 3)
                    .map((opportunity, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-lg">
                              {opportunity.directFlight.airline} vs{" "}
                              {opportunity.viaAlgiersFlight.airline}
                            </div>
                            <div className="text-sm text-gray-600">
                              {opportunity.directFlight.origin} →{" "}
                              {opportunity.directFlight.destination}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {opportunity.savings.amount}€
                            </div>
                            <div className="text-sm text-green-600">
                              {opportunity.savings.percentage}% d'économies
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg border ${getRiskColor(opportunity.riskLevel)}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {getRiskIcon(opportunity.riskLevel)}
                            <span className="font-semibold">
                              Risque{" "}
                              {opportunity.riskLevel === "LOW"
                                ? "Faible"
                                : opportunity.riskLevel === "MEDIUM"
                                  ? "Modéré"
                                  : "Élevé"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {opportunity.recommendations.map(
                              (rec, recIndex) => (
                                <div key={recIndex} className="text-sm">
                                  {rec}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Détail des vols disponibles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vols directs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">
                  Vols Directs Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.directFlights.map((flight) => (
                    <div key={flight.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          {flight.airline} {flight.flightNumber}
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(
                            flight.price.amount,
                            flight.price.currency
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Départ:</span>
                          <span>{formatDateTime(flight.departureTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Arrivée:</span>
                          <span>{formatDateTime(flight.arrivalTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Durée:</span>
                          <span>{flight.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Escales:</span>
                          <span>{flight.stops}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vols via Alger */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Vols Via Alger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.viaAlgiersFlights.map((flight) => (
                    <div key={flight.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          {flight.airline} {flight.flightNumber}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(
                            flight.price.amount,
                            flight.price.currency
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Départ:</span>
                          <span>{formatDateTime(flight.departureTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Arrivée:</span>
                          <span>{formatDateTime(flight.arrivalTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Durée:</span>
                          <span>{flight.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Escales:</span>
                          <span>{flight.stops}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
