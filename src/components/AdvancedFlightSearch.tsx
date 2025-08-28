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
import {
  Plane,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ScrapedFlightData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  flights: ScrapedFlight[];
  totalPrice: {
    amount: number;
    currency: string;
    originalCurrency?: string;
    exchangeRate?: number;
  };
  searchTimestamp: Date;
  provider: string;
  direct: boolean;
  stops: number;
  duration: string;
  cabinClass: string;
}

interface ScrapedFlight {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft?: string;
  cabinClass: string;
  price?: {
    amount: number;
    currency: string;
  };
}

interface ScrapingResult {
  success: boolean;
  data: {
    direct: ScrapedFlightData[];
    viaAlgiers: ScrapedFlightData[];
    allResults: ScrapedFlightData[];
    bestPrices: {
      direct: { amount: number; currency: string; provider: string } | null;
      viaAlgiers: { amount: number; currency: string; provider: string } | null;
      overall: { amount: number; currency: string; provider: string } | null;
    };
    providers: string[];
    searchTimestamp: Date;
    totalResults: number;
  };
  errors: string[];
  searchParams: any;
}

export function AdvancedFlightSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ScrapingResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    origin: "CDG",
    destination: "DXB",
    departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    passengers: 1,
    cabinClass: "Economy",
    currency: "EUR",
  });

  const searchFlights = async () => {
    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data);
        console.log("✅ Résultats de scraping:", data);
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

  const searchParisDubai = () => {
    setSearchParams((prev) => ({
      ...prev,
      origin: "CDG",
      destination: "DXB",
    }));
    setTimeout(searchFlights, 100);
  };

  const searchCustomRoute = () => {
    searchFlights();
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

  const getPriceInDZD = (priceEUR: number, exchangeRate: number = 145.5) => {
    return Math.round(priceEUR * exchangeRate);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche Avancée de Vols (Scraping)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Testez le système de scraping unifié avec Air Algérie, Air France et
            Emirates
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Aéroport de départ
              </label>
              <Input
                value={searchParams.origin}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    origin: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="CDG"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Aéroport d'arrivée
              </label>
              <Input
                value={searchParams.destination}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    destination: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="DXB"
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date de départ
              </label>
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
              <label className="block text-sm font-medium mb-1">Classe</label>
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

      {searchResults && (
        <div className="space-y-6">
          {/* Résumé des résultats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Résultats de la Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {searchResults.data.totalResults}
                  </div>
                  <div className="text-sm text-blue-600">
                    Total des résultats
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {searchResults.data.direct.length}
                  </div>
                  <div className="text-sm text-green-600">Vols directs</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {searchResults.data.viaAlgiers.length}
                  </div>
                  <div className="text-sm text-orange-600">Via Alger</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recherche effectuée le{" "}
                  {new Date(searchResults.data.searchTimestamp).toLocaleString(
                    "fr-FR"
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  Fournisseurs consultés:{" "}
                  {searchResults.data.providers.join(", ")}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meilleurs prix */}
          {searchResults.data.bestPrices.overall && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Meilleurs Prix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {searchResults.data.bestPrices.direct && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 mb-1">
                        Vol Direct
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {formatPrice(
                          searchResults.data.bestPrices.direct.amount,
                          searchResults.data.bestPrices.direct.currency
                        )}
                      </div>
                      <div className="text-sm text-green-600">
                        {searchResults.data.bestPrices.direct.provider}
                      </div>
                    </div>
                  )}

                  {searchResults.data.bestPrices.viaAlgiers && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-600 mb-1">
                        Via Alger
                      </div>
                      <div className="text-2xl font-bold text-orange-700">
                        {formatPrice(
                          searchResults.data.bestPrices.viaAlgiers.amount,
                          searchResults.data.bestPrices.viaAlgiers.currency
                        )}
                      </div>
                      <div className="text-sm text-orange-600">
                        {searchResults.data.bestPrices.viaAlgiers.provider}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">
                      Meilleur Global
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatPrice(
                        searchResults.data.bestPrices.overall.amount,
                        searchResults.data.bestPrices.overall.currency
                      )}
                    </div>
                    <div className="text-sm text-blue-600">
                      {searchResults.data.bestPrices.overall.provider}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Détail des vols directs */}
          {searchResults.data.direct.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Vols Directs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.data.direct.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-lg">
                            {result.origin} → {result.destination}
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.provider} • {result.duration} •{" "}
                            {result.stops} escale(s)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatPrice(
                              result.totalPrice.amount,
                              result.totalPrice.currency
                            )}
                          </div>
                          {result.totalPrice.originalCurrency && (
                            <div className="text-sm text-gray-600">
                              ~
                              {getPriceInDZD(
                                result.totalPrice.amount,
                                result.totalPrice.exchangeRate
                              )}{" "}
                              DZD
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {result.flights.map((flight, flightIndex) => (
                          <div
                            key={flightIndex}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {flight.airlineCode}
                              </span>
                              <span>{flight.flightNumber}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>
                                {formatDateTime(flight.departureTime)}
                              </span>
                              <span>→</span>
                              <span>{formatDateTime(flight.arrivalTime)}</span>
                              <span className="text-gray-600">
                                ({flight.duration})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Détail des vols via Alger */}
          {searchResults.data.viaAlgiers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">
                  Vols Via Alger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.data.viaAlgiers.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-lg">
                            {result.origin} → {result.destination} (Via Alger)
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.provider} • {result.duration} •{" "}
                            {result.stops} escale(s)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatPrice(
                              result.totalPrice.amount,
                              result.totalPrice.currency
                            )}
                          </div>
                          {result.totalPrice.originalCurrency && (
                            <div className="text-sm text-gray-600">
                              ~
                              {getPriceInDZD(
                                result.totalPrice.amount,
                                result.totalPrice.exchangeRate
                              )}{" "}
                              DZD
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {result.flights.map((flight, flightIndex) => (
                          <div
                            key={flightIndex}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {flight.airlineCode}
                              </span>
                              <span>{flight.flightNumber}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>
                                {formatDateTime(flight.departureTime)}
                              </span>
                              <span>→</span>
                              <span>{formatDateTime(flight.arrivalTime)}</span>
                              <span className="text-gray-600">
                                ({flight.duration})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
