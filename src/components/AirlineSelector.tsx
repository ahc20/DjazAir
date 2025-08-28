import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  getAirlineRedirects, 
  openAirlineSearch, 
  openAllAirlines,
  type AirlineRedirect,
  type FlightSegment 
} from "@/lib/airlineRedirects";

interface AirlineSelectorProps {
  segments: FlightSegment[];
  cabinClass: string;
  onClose?: () => void;
}

export function AirlineSelector({ segments, cabinClass, onClose }: AirlineSelectorProps) {
  const [selectedAirlines, setSelectedAirlines] = useState<AirlineRedirect[]>([]);
  const [isOpening, setIsOpening] = useState(false);

  const allAirlines = getAirlineRedirects(segments, cabinClass);

  const handleAirlineSelect = (airline: AirlineRedirect) => {
    setSelectedAirlines(prev => {
      const isSelected = prev.find(a => a.name === airline.name);
      if (isSelected) {
        return prev.filter(a => a.name !== airline.name);
      } else {
        return [...prev, airline];
      }
    });
  };

  const handleOpenSelected = () => {
    if (selectedAirlines.length === 0) return;
    
    setIsOpening(true);
    
    // Ouvrir les compagnies sélectionnées
    selectedAirlines.forEach((airline, index) => {
      const segment = segments[index % segments.length];
      setTimeout(() => {
        openAirlineSearch(airline, segment, cabinClass);
      }, index * 300);
    });

    // Fermer après un délai
    setTimeout(() => {
      setIsOpening(false);
      onClose?.();
    }, selectedAirlines.length * 300 + 1000);
  };

  const handleOpenAll = () => {
    setIsOpening(true);
    openAllAirlines(segments, cabinClass);
    
    // Fermer après un délai
    setTimeout(() => {
      setIsOpening(false);
      onClose?.();
    }, 5000);
  };

  const getSegmentDescription = (index: number) => {
    if (index === 0) return "Vers l'Algérie";
    return "Depuis l'Algérie";
  };

  return (
    <Card className="border-2 border-blue-500 bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-bold">Réserver avec les Compagnies Réelles</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-white border-white hover:bg-white hover:text-blue-600"
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎯 Sélectionnez les compagnies pour réserver vos vols
          </h3>
          <p className="text-sm text-gray-600">
            Choisissez les compagnies aériennes et nous vous redirigerons vers leurs sites officiels
          </p>
        </div>

        {/* Segments de vol */}
        <div className="space-y-4 mb-6">
          {segments.map((segment, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">
                  {getSegmentDescription(index)} : {segment.origin} → {segment.destination}
                </h4>
                <span className="text-sm text-gray-500">
                  {new Date(segment.date).toLocaleDateString("fr-FR")}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {allAirlines
                  .filter(airline => {
                    if (index === 0) {
                      // Premier segment : compagnies vers l'Algérie
                      return ["Air Algérie", "Air France", "Tassili Airlines"].includes(airline.name);
                    } else {
                      // Deuxième segment : compagnies depuis l'Algérie
                      return ["Emirates", "Qatar Airways", "Etihad Airways", "Turkish Airlines", "EgyptAir"].includes(airline.name);
                    }
                  })
                  .map((airline) => (
                    <Button
                      key={airline.name}
                      variant={selectedAirlines.find(a => a.name === airline.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAirlineSelect(airline)}
                      className="justify-start text-sm h-auto py-2 px-3"
                    >
                      <span className="mr-2">{airline.logo}</span>
                      {airline.name}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {selectedAirlines.length > 0 && (
            <Button
              onClick={handleOpenSelected}
              disabled={isOpening}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
            >
              {isOpening ? "🔄 Ouverture en cours..." : `🚀 Ouvrir ${selectedAirlines.length} site(s) sélectionné(s)`}
            </Button>
          )}
          
          <Button
            onClick={handleOpenAll}
            disabled={isOpening}
            variant="outline"
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 font-bold py-3"
          >
            {isOpening ? "🔄 Ouverture en cours..." : "🌐 Ouvrir tous les sites (8 onglets)"}
          </Button>
        </div>

        {/* Informations */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">💡 Comment ça fonctionne :</p>
            <ul className="space-y-1 text-xs">
              <li>• Sélectionnez les compagnies qui vous intéressent</li>
              <li>• Nous ouvrons automatiquement leurs sites avec vos critères</li>
              <li>• Comparez les prix et réservez directement</li>
              <li>• Chaque site s'ouvre dans un nouvel onglet</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
