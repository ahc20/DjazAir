import React from 'react';
import { Plane, Shield, TrendingUp, Globe } from 'lucide-react';
import { SearchForm } from '@/components/SearchForm';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { APP_NAME } from '@/lib/constants';
import type { SearchFormData } from '@/lib/zod';

export default function HomePage() {
  const handleSearch = async (data: SearchFormData) => {
    // Rediriger vers la page de résultats avec les paramètres de recherche
    const searchParams = new URLSearchParams({
      origin: data.origin,
      destination: data.destination,
      departDate: data.departDate,
      adults: data.adults.toString(),
      children: data.children.toString(),
      infants: data.infants.toString(),
      cabin: data.cabin,
      ...(data.returnDate && { returnDate: data.returnDate }),
    });

    window.location.href = `/search/results?${searchParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header avec avertissement légal */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {APP_NAME}
              </h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Simulateur d'Arbitrage
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>100% Légal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Avertissement légal */}
      <LegalDisclaimer variant="header" className="mx-4 mt-4" />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Section hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Optimisez vos voyages internationaux
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comparez les prix des vols directs avec des simulations "via Alger" 
            pour identifier les meilleures opportunités d'économies.
          </p>
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-16">
          <SearchForm onSubmit={handleSearch} />
        </div>

        {/* Section des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Comparaison Intelligente
            </h3>
            <p className="text-gray-600">
              Analysez automatiquement les prix directs vs les options avec escale à Alger
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Calculs d'Arbitrage
            </h3>
            <p className="text-gray-600">
              Simulez les économies potentielles avec différents taux de change
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Redirection Officielle
            </h3>
            <p className="text-gray-600">
              Accédez directement aux sites officiels pour vos réservations
            </p>
          </div>
        </div>

        {/* Section d'information */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Comment ça fonctionne ?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                1. Recherche de vols
              </h4>
              <p className="text-gray-600 mb-4">
                Entrez vos critères de voyage (origine, destination, dates, passagers) 
                et notre système recherche automatiquement les meilleurs prix disponibles.
              </p>
              
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                2. Simulation "via Alger"
              </h4>
              <p className="text-gray-600 mb-4">
                Nous calculons le coût total d'un voyage avec escale à Alger en utilisant 
                des taux de change officiels ou configurés par l'administrateur.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                3. Analyse d'arbitrage
              </h4>
              <p className="text-gray-600 mb-4">
                Comparez les prix directs avec les options "via Alger" et identifiez 
                les opportunités d'économies selon vos critères.
              </p>
              
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                4. Réservation sécurisée
              </h4>
              <p className="text-gray-600">
                Une fois votre choix fait, vous êtes redirigé vers les sites officiels 
                des compagnies aériennes ou agences de voyage.
              </p>
            </div>
          </div>
        </div>

        {/* Section des avantages */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-semibold mb-6 text-center">
            Pourquoi choisir {APP_NAME} ?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">100% Légal et Transparent</h4>
                <p className="text-blue-100 text-sm">
                  Aucune opération de change, uniquement des simulations informatiques
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Taux de Change Officiels</h4>
                <p className="text-blue-100 text-sm">
                  Utilisation des taux BCE et de sources agréées
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Simulations Précises</h4>
                <p className="text-blue-100 text-sm">
                  Calculs détaillés avec prise en compte des risques
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Redirection Sécurisée</h4>
                <p className="text-blue-100 text-sm">
                  Accès direct aux canaux officiels de réservation
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer avec avertissement légal */}
      <LegalDisclaimer variant="footer" />
    </div>
  );
}
