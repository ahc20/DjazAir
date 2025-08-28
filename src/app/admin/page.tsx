"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Euro,
  Percent,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { ConfigForm } from "@/components/admin/ConfigForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfigData } from "@/lib/zod";

// Mock des données de configuration pour la démonstration
const mockConfig: ConfigData = {
  eurToDzdCustomRate: 262,
  showViaAlgiers: true,
  minSavingsPercent: 15.0,
  riskBufferMinutes: 120,
  legalDisclaimer:
    "Cette application ne vend pas de billets en dinars algériens et ne réalise aucune opération de change. Les calculs 'via Alger' sont des SIMULATIONS basées sur des hypothèses administrateur ou des saisies utilisateur. Pour réserver, vous serez redirigé vers des canaux officiels. Vérifiez vos conditions de visa et le risque de correspondance.",
};

export default function AdminPage() {
  const [config, setConfig] = useState<ConfigData>(mockConfig);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveConfig = async (newConfig: ConfigData) => {
    setIsLoading(true);

    try {
      // Simuler une sauvegarde en base de données
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setConfig(newConfig);
      alert("Configuration sauvegardée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de la configuration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Accès Restreint
            </span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Euro className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taux Custom</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config.eurToDzdCustomRate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Percent className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Économies Min.</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config.minSavingsPercent}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Buffer Risque</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {config.riskBufferMinutes}min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    config.showViaAlgiers ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <AlertTriangle
                    className={`h-6 w-6 ${
                      config.showViaAlgiers ? "text-green-600" : "text-red-600"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Via Alger</p>
                  <p
                    className={`text-lg font-bold ${
                      config.showViaAlgiers ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {config.showViaAlgiers ? "Activé" : "Désactivé"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire de configuration */}
        <div className="mb-8">
          <ConfigForm
            initialConfig={config}
            onSave={handleSaveConfig}
            isLoading={isLoading}
          />
        </div>

        {/* Informations de sécurité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Shield className="h-5 w-5" />
                Sécurité et Conformité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-green-800">Accès restreint</p>
                  <p className="text-sm text-green-700">
                    Seuls les administrateurs peuvent modifier ces paramètres
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-green-800">
                    Audit des modifications
                  </p>
                  <p className="text-sm text-green-700">
                    Toutes les modifications sont tracées et horodatées
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-green-800">
                    Validation des données
                  </p>
                  <p className="text-sm text-green-700">
                    Les paramètres sont validés avant sauvegarde
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Settings className="h-5 w-5" />
                Impact des Modifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">Taux de change</p>
                  <p className="text-sm text-blue-700">
                    Modifie la rentabilité des simulations "via Alger"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">Seuil d'économies</p>
                  <p className="text-sm text-blue-700">
                    Détermine quelles options sont considérées comme des "deals"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">
                    Avertissement légal
                  </p>
                  <p className="text-sm text-blue-700">
                    Affiché sur toutes les pages pour informer les utilisateurs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liens d'administration */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Autres fonctions d'administration disponibles :
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-colors">
              Gestion des hypothèses de prix
            </button>
            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-colors">
              Import CSV
            </button>
            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-colors">
              Logs système
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
