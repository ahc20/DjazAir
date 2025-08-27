'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealCard } from '@/components/DealCard';
import { RateSelector } from '@/components/RateSelector';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { formatPrice, formatDate } from '@/lib/utils';
import { getAirportName } from '@/lib/iata';
import type { ArbitrageResult, ExchangeRateMode } from '@/types';

// Mock des données pour la démonstration
// En production, ces données viendraient des APIs et de la base de données
const mockArbitrageResult: ArbitrageResult = {
  directPriceEUR: 800,
  viaAlgiersPriceEUR: 473,
  savingsEUR: 327,
  savingsPercent: 40.875,
  isDeal: true,
  viaBreakdown: {
    originToAlgiersEUR: 130,
    algiersToDestinationDZD: 90000,
    algiersToDestinationEUR: 343.51,
    totalViaAlgiersEUR: 473.51,
  },
  risks: {
    separateTickets: true,
    visaRequired: true,
    connectionRisk: true,
  },
};

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [arbitrageResult, setArbitrageResult] = useState<ArbitrageResult | null>(null);
  const [exchangeRateMode, setExchangeRateMode] = useState<ExchangeRateMode>('custom');
  const [showViaAlgiers, setShowViaAlgiers] = useState(true);
  const [officialRate, setOfficialRate] = useState(150.5);
  const [customRate, setCustomRate] = useState(262);

  // Récupérer les paramètres de recherche
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departDate = searchParams.get('departDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');
  const infants = parseInt(searchParams.get('infants') || '0');
  const cabin = searchParams.get('cabin') || 'ECONOMY';

  useEffect(() => {
    // Simuler le chargement des données
    const timer = setTimeout(() => {
      setArbitrageResult(mockArbitrageResult);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleBookDirect = () => {
    // Redirection vers un site de réservation (exemple)
    window.open('https://www.google.com/travel/flights', '_blank');
  };

  const handleBookViaAlgiers = () => {
    // Redirection vers un site de réservation (exemple)
    window.open('https://www.google.com/travel/flights', '_blank');
  };

  const handleRateModeChange = (mode: ExchangeRateMode) => {
    setExchangeRateMode(mode);
    // Ici, on recalculerait l'arbitrage avec le nouveau taux
    // Pour l'instant, on utilise les données mockées
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Recherche en cours...</p>
          <p className="text-sm text-gray-500">Analyse des prix et calculs d'arbitrage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Résultats de recherche
                </h1>
                <p className="text-sm text-gray-600">
                  {getAirportName(origin)} → {getAirportName(destination)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(departDate)}
              {returnDate && ` - ${formatDate(returnDate)}`}
            </div>
          </div>
        </div>
      </header>

      {/* Avertissement légal */}
      <LegalDisclaimer variant="header" className="mx-4 mt-4" />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Résumé de la recherche */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Détails de votre recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Départ:</span>
                <p className="text-gray-900">{getAirportName(origin)} ({origin})</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Arrivée:</span>
                <p className="text-gray-900">{getAirportName(destination)} ({destination})</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Date:</span>
                <p className="text-gray-900">{formatDate(departDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Passagers:</span>
                <p className="text-gray-900">
                  {adults} adulte{adults > 1 ? 's' : ''}
                  {children > 0 && `, ${children} enfant${children > 1 ? 's' : ''}`}
                  {infants > 0 && `, ${infants} nourrisson${infants > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélecteur de taux de change */}
        <div className="mb-8">
          <RateSelector
            mode={exchangeRateMode}
            onModeChange={handleRateModeChange}
            officialRate={officialRate}
            customRate={customRate}
          />
        </div>

        {/* Résultats d'arbitrage */}
        {arbitrageResult && (
          <div className="mb-8">
            <DealCard
              result={arbitrageResult}
              onBookDirect={handleBookDirect}
              onBookViaAlgiers={handleBookViaAlgiers}
              showViaAlgiers={showViaAlgiers}
            />
          </div>
        )}

        {/* Informations et avertissements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Avertissements de risque */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Avertissements Importants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-orange-800">Billets séparés</p>
                  <p className="text-sm text-orange-700">
                    Les vols "via Alger" impliquent des billets séparés sans protection de correspondance
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-orange-800">Visa requis</p>
                  <p className="text-sm text-orange-700">
                    Un visa ou un passeport algérien est nécessaire pour transiter par l'Algérie
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-orange-800">Risque de correspondance</p>
                  <p className="text-sm text-orange-700">
                    Prévoyez un temps de correspondance suffisant entre vos vols
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations pratiques */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="h-5 w-5" />
                Informations Pratiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">Bagages</p>
                  <p className="text-sm text-blue-700">
                    Pas de through-check en billets séparés. Récupérez vos bagages à Alger
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">Temps de correspondance</p>
                  <p className="text-sm text-blue-700">
                    Recommandé : minimum 2h pour les correspondances internationales
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">Assurance voyage</p>
                  <p className="text-sm text-blue-700">
                    Considérez une assurance couvrant les annulations et retards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bouton de nouvelle recherche */}
        <div className="text-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="bg-white hover:bg-gray-50"
          >
            Nouvelle recherche
          </Button>
        </div>
      </main>

      {/* Footer avec avertissement légal */}
      <LegalDisclaimer variant="footer" />
    </div>
  );
}
