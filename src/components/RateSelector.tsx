'use client';

import React from 'react';
import { Euro, Calculator, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ExchangeRateMode } from '@/types';

interface RateSelectorProps {
  mode: ExchangeRateMode;
  onModeChange: (mode: ExchangeRateMode) => void;
  officialRate: number;
  customRate: number;
  isLoading?: boolean;
}

export function RateSelector({
  mode,
  onModeChange,
  officialRate,
  customRate,
  isLoading = false,
}: RateSelectorProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Euro className="h-5 w-5" />
          Sélection du taux de change EUR → DZD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Taux Officiel */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              mode === 'official'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onModeChange('official')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                mode === 'official' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`} />
              <span className="font-medium">Taux Officiel (ECB)</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {officialRate.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">
              Taux de la Banque Centrale Européenne
            </p>
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
              <Info className="h-3 w-3" />
              Source officielle
            </div>
          </div>

          {/* Taux Custom (Admin) */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              mode === 'custom'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onModeChange('custom')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-4 h-4 rounded-full border-2 ${
                mode === 'custom' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`} />
              <span className="font-medium">Taux Custom (Admin)</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {customRate.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">
              Taux configuré par l'administrateur
            </p>
            <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
              <Calculator className="h-3 w-3" />
              Simulation
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Important :</p>
              <ul className="space-y-1">
                <li>• Le taux officiel est fourni par la BCE via exchangerate.host</li>
                <li>• Le taux custom est une simulation basée sur des hypothèses de marché</li>
                <li>• Ces calculs sont uniquement informatifs et ne constituent pas une offre d'achat</li>
                <li>• Aucune opération de change n'est effectuée par cette application</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bouton de confirmation */}
        <div className="text-center">
          <Button
            onClick={() => onModeChange(mode)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Chargement...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Confirmer le taux sélectionné
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
