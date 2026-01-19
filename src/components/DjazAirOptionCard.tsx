import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AirlineSelector } from "./AirlineSelector";
import { type FlightSegment } from "@/lib/airlineRedirects";

interface DjazAirOptionCardProps {
  option: {
    id: string;
    airline: string;
    flightNumber: string;
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
  };
  onBook: (optionId: string) => void;
}

export function DjazAirOptionCard({ option, onBook }: DjazAirOptionCardProps) {
  const [showAirlineSelector, setShowAirlineSelector] = useState(false);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleBookWithAirlines = () => {
    setShowAirlineSelector(true);
  };

  const createFlightSegments = (): FlightSegment[] => {
    const departureDate = new Date(option.departureTime);
    const formattedDate = departureDate.toISOString().split('T')[0];

    return [
      {
        origin: option.origin,
        destination: "ALG",
        date: formattedDate,
        passengers: 1, // À adapter selon les besoins
      },
      {
        origin: "ALG",
        destination: option.destination,
        date: formattedDate,
        passengers: 1, // À adapter selon les besoins
      },
    ];
  };

  return (
    <>
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✈️</span>
              <span className="text-xl font-bold">DjazAir - Escale en Algérie</span>
            </div>
            <div className="text-sm bg-white text-blue-600 px-2 py-1 rounded">
              ÉCONOMIES GARANTIES
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* Route principale */}
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              {option.origin} → {option.destination}
            </div>
            <div className="text-gray-600">
              {formatDate(option.departureTime)} • {option.duration}
            </div>
          </div>

          {/* Segments détaillés */}
          {option.segments && (
            <div className="space-y-4 mb-6">
              {/* Premier segment : vers Alger */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-semibold">1er segment</span>
                    <span className="text-sm text-gray-500">→ Alger</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {option.segments.toAlgiers.price} {option.segments.toAlgiers.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{option.origin} → ALG</span>
                  <span className="text-gray-500">
                    {option.segments.toAlgiers.airline} {option.segments.toAlgiers.flight}
                  </span>
                </div>
              </div>

              {/* Escale à Alger */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  <span>🛫</span>
                  <span>Escale à Alger ({option.connection?.duration})</span>
                  <span>🛬</span>
                </div>
              </div>

              {/* Deuxième segment : depuis Alger */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-semibold">2ème segment</span>
                    <span className="text-sm text-gray-500">Alger →</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {option.segments.fromAlgiers.price} {option.segments.fromAlgiers.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>ALG → {option.destination}</span>
                  <span className="text-gray-500">
                    {option.segments.fromAlgiers.airline} {option.segments.fromAlgiers.flight}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Départ</div>
              <div className="text-lg font-semibold text-gray-800">
                {formatTime(option.departureTime)}
              </div>
              <div className="text-xs text-gray-500">{option.origin}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Arrivée</div>
              <div className="text-lg font-semibold text-gray-800">
                {formatTime(option.arrivalTime)}
              </div>
              <div className="text-xs text-gray-500">{option.destination}</div>
            </div>
          </div>

          {/* Prix et économies */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-6">
            <div className="text-center">
              <div className="text-sm text-green-600 mb-1">Prix total DjazAir</div>
              <div className="text-3xl font-bold text-green-700">
                {option.price.amount} {option.price.currency}
              </div>
              {option.price.originalDZD && (
                <div className="text-sm text-green-600">
                  {option.price.originalDZD.toLocaleString()} DZD (taux parallèle)
                </div>
              )}
            </div>
          </div>

          {/* Avantages DjazAir */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span className="text-green-500">✓</span>
              <span>Économies garanties grâce à l'arbitrage des taux de change</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span className="text-green-500">✓</span>
              <span>Bagages inclus (23kg)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <span className="text-green-500">✓</span>
              <span>Escale optimisée à Alger</span>
            </div>
          </div>

          {/* Bouton d'action unique */}
          <div className="mt-4">
            <Button
              onClick={() => onBook(option.id)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>📋</span>
              <span>Voir les détails & Réserver</span>
            </Button>
          </div>

          {/* Note importante */}
          <div className="text-center mt-4">
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
              💡 <strong>DjazAir</strong> vous redirige vers les sites officiels des compagnies aériennes
              pour réserver vos vols avec escale en Algérie.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélecteur de compagnies aériennes */}
      {showAirlineSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AirlineSelector
              segments={createFlightSegments()}
              cabinClass="Economy"
              onClose={() => setShowAirlineSelector(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
