'use client';

import React from 'react';
import { Plane, AlertTriangle, Info, ExternalLink, Euro, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, calculateSavingsPercent } from '@/lib/utils';
import type { ArbitrageResult } from '@/types';

interface DealCardProps {
  result: ArbitrageResult;
  onBookDirect: () => void;
  onBookViaAlgiers: () => void;
  showViaAlgiers: boolean;
  priceBreakdown?: {
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

export function DealCard({ 
  result, 
  onBookDirect, 
  onBookViaAlgiers, 
  showViaAlgiers 
}: DealCardProps) {
  const savingsPercent = calculateSavingsPercent(
    result.directPriceEUR, 
    result.viaAlgiersPriceEUR
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
      {/* Carte Direct */}
      <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Plane className="h-5 w-5" />
            Vol Direct
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {formatPrice(result.directPriceEUR)}
            </div>
            <p className="text-gray-600">Prix total aller-retour</p>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Vol direct sans escale</p>
              <p>• Bagages inclus</p>
              <p>• Protection de correspondance</p>
            </div>

            <Button 
              onClick={onBookDirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Réserver via canal officiel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Carte Via Alger (Simulation) */}
      {showViaAlgiers && (
        <Card className={`border-2 transition-colors ${
          result.isDeal 
            ? 'border-green-200 hover:border-green-300 bg-green-50' 
            : 'border-orange-200 hover:border-orange-300 bg-orange-50'
        }`}>
          <CardHeader className={`${
            result.isDeal ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <CardTitle className={`flex items-center gap-2 ${
              result.isDeal ? 'text-green-800' : 'text-orange-800'
            }`}>
              <Calculator className="h-5 w-5" />
              Via Alger (Simulation)
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                SIMULATION
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`text-4xl font-bold ${
                result.isDeal ? 'text-green-600' : 'text-orange-600'
              }`}>
                {formatPrice(result.viaAlgiersPriceEUR)}
              </div>
              
              {result.isDeal ? (
                <div className="text-green-700 font-semibold">
                  Économie de {formatPrice(result.savingsEUR)} ({savingsPercent}%)
                </div>
              ) : (
                <div className="text-orange-700 font-semibold">
                  Plus cher de {formatPrice(Math.abs(result.savingsEUR))}
                </div>
              )}

              {/* Détail du calcul */}
              <div className="text-left text-sm space-y-2 bg-white p-3 rounded border">
                <div className="flex justify-between">
                  <span>Origin → Alger:</span>
                  <span className="font-medium">{formatPrice(result.viaBreakdown.originToAlgiersEUR)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alger → Destination:</span>
                  <span className="font-medium">{formatPrice(result.viaBreakdown.algiersToDestinationEUR)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Via Alger:</span>
                  <span>{formatPrice(result.viaBreakdown.totalViaAlgiersEUR)}</span>
                </div>
              </div>

              {/* Avertissements et risques */}
              <div className="space-y-2">
                {result.risks.separateTickets && (
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Billets séparés (correspondance non protégée)
                  </div>
                )}
                
                {result.risks.visaRequired && (
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <Info className="h-4 w-4" />
                    Visa requis pour l'Algérie
                  </div>
                )}

                {result.risks.connectionRisk && (
                  <div className="flex items-center gap-2 text-orange-700 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Risque de correspondance
                  </div>
                )}
              </div>

              <Button 
                onClick={onBookViaAlgiers}
                variant={result.isDeal ? "default" : "outline"}
                className={`w-full ${
                  result.isDeal 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                }`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Réserver via canal officiel
              </Button>

              <p className="text-xs text-gray-500 text-center">
                * Simulation basée sur des hypothèses de prix local en DZD
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
