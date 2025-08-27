'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Euro, 
  Coins,
  ArrowRight,
  Info
} from 'lucide-react';
import { ArbitrageCalculator, ArbitrageOpportunity } from '@/server/arbitrage/arbitrageCalculator';

export function ArbitrageCalculatorComponent() {
  const [calculator] = useState(() => new ArbitrageCalculator());
  const [arbitrageResult, setArbitrageResult] = useState<ArbitrageOpportunity | null>(null);
  const [formData, setFormData] = useState({
    route: 'CDG-DXB',
    internationalPriceEUR: 354,
    algerianPriceDZD: 60455
  });

  // Calcul automatique pour l'exemple Paris-Dubai
  useEffect(() => {
    const result = calculator.calculateParisDubaiArbitrage();
    setArbitrageResult(result);
  }, [calculator]);

  const handleCalculate = () => {
    const result = calculator.calculateArbitrage(
      formData.route,
      formData.internationalPriceEUR,
      formData.algerianPriceDZD
    );
    setArbitrageResult(result);
  };

  const handleReset = () => {
    setFormData({
      route: 'CDG-DXB',
      internationalPriceEUR: 354,
      algerianPriceDZD: 60455
    });
    const result = calculator.calculateParisDubaiArbitrage();
    setArbitrageResult(result);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'MEDIUM': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'HIGH': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculateur d'Arbitrage Aérien "Via Alger"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Calculez les opportunités d'arbitrage entre les prix internationaux et les prix Air Algérie en DZD
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="route">Route</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
                placeholder="CDG-DXB"
              />
            </div>
            <div>
              <Label htmlFor="internationalPrice">Prix International (€)</Label>
              <Input
                id="internationalPrice"
                type="number"
                value={formData.internationalPriceEUR}
                onChange={(e) => setFormData(prev => ({ ...prev, internationalPriceEUR: parseFloat(e.target.value) || 0 }))}
                placeholder="354"
              />
            </div>
            <div>
              <Label htmlFor="algerianPrice">Prix Air Algérie (DZD)</Label>
              <Input
                id="algerianPrice"
                type="number"
                value={formData.algerianPriceDZD}
                onChange={(e) => setFormData(prev => ({ ...prev, algerianPriceDZD: parseFloat(e.target.value) || 0 }))}
                placeholder="60455"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleCalculate} className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculer l'Arbitrage
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Exemple Paris-Dubai
            </Button>
          </div>
        </CardContent>
      </Card>

      {arbitrageResult && (
        <div className="space-y-6">
          {/* Résumé de l'arbitrage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Opportunité d'Arbitrage : {arbitrageResult.route}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prix comparés */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Comparaison des Prix</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Prix International</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {arbitrageResult.internationalPrice}€
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Prix Air Algérie</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {arbitrageResult.algerianPriceDZD} DZD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Niveau de risque */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Évaluation du Risque</h4>
                  
                  <div className={`p-4 rounded-lg border ${getRiskColor(arbitrageResult.riskLevel)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getRiskIcon(arbitrageResult.riskLevel)}
                      <span className="font-semibold">
                        Risque {arbitrageResult.riskLevel === 'LOW' ? 'Faible' : 
                               arbitrageResult.riskLevel === 'MEDIUM' ? 'Modéré' : 'Élevé'}
                      </span>
                    </div>
                    <p className="text-sm">
                      {arbitrageResult.riskLevel === 'LOW' ? 'Opportunité recommandée avec des économies importantes' :
                       arbitrageResult.riskLevel === 'MEDIUM' ? 'Vérifiez les conditions de visa et de correspondance' :
                       'Considérez les alternatives directes'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détail des taux de change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-600" />
                Conversion DZD → EUR selon les Taux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Taux officiel */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-sm text-blue-600 mb-1">Taux Officiel</div>
                    <div className="text-lg font-bold text-blue-700">1€ = 150 DZD</div>
                    <div className="text-2xl font-bold text-blue-800 mt-2">
                      {arbitrageResult.algerianPriceEUR.official}€
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      Économies: {arbitrageResult.savings.official}€ ({arbitrageResult.savingsPercentage.official}%)
                    </div>
                  </div>
                </div>

                {/* Taux parallèle */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-sm text-green-600 mb-1">Taux Parallèle</div>
                    <div className="text-lg font-bold text-green-700">1€ = 260 DZD</div>
                    <div className="text-2xl font-bold text-green-800 mt-2">
                      {arbitrageResult.algerianPriceEUR.parallel}€
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Économies: {arbitrageResult.savings.parallel}€ ({arbitrageResult.savingsPercentage.parallel}%)
                    </div>
                  </div>
                </div>

                {/* Taux marché noir */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-center">
                    <div className="text-sm text-orange-600 mb-1">Marché Noir</div>
                    <div className="text-lg font-bold text-orange-700">1€ = 300 DZD</div>
                    <div className="text-2xl font-bold text-orange-800 mt-2">
                      {arbitrageResult.algerianPriceEUR.blackMarket}€
                    </div>
                    <div className="text-sm text-orange-600 mt-1">
                      Économies: {arbitrageResult.savings.blackMarket}€ ({arbitrageResult.savingsPercentage.blackMarket}%)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommandations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Recommandations et Conseils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {arbitrageResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informations légales */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">⚠️ Avertissement Légal</p>
                  <p>
                    DjazAir ne vend pas de billets et n'effectue aucune opération de change. 
                    Ces calculs sont des simulations informatiques basées sur des taux de change 
                    approximatifs. Pour réserver, vous serez redirigé vers les sites officiels 
                    des compagnies aériennes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
