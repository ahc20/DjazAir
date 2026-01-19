"use client";

import React from "react";
import { Plane, TrendingUp, Globe } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { BestDeals } from "@/components/BestDeals";

import { APP_NAME } from "@/lib/constants";
import type { SearchFormData } from "@/lib/zod";

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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Comparateur de Vols
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Section hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Trouvez les meilleurs prix de vols, en passant par l'Algérie
          </h2>
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-16">
          <SearchForm onSubmit={handleSearch} />
        </div>

        {/* Section Meilleures Offres */}
        <BestDeals />

        {/* Section des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Recherche en Temps Réel
            </h3>
            <p className="text-gray-600">
              Obtenez les prix les plus récents directement depuis Amadeus
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Prix Transparents
            </h3>
            <p className="text-gray-600">
              Comparez facilement les offres avec toutes les informations
              détaillées
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
            L'approche DjazAir
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                1. Analyse Globale
              </h4>
              <p className="text-gray-600 mb-4">
                Notre algorithme scanne des milliers de vols en temps réel pour
                identifier toutes les routes possibles vers votre destination.
              </p>

              <h4 className="text-lg font-medium text-gray-900 mb-3">
                2. L'Opportunité "via Alger"
              </h4>
              <p className="text-gray-600 mb-4">
                Nous détectons si une escale stratégique à Alger permet de
                réduire drastiquement le coût de votre billet.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                3. Économies Garanties
              </h4>
              <p className="text-gray-600 mb-4">
                Nous vous montrons clairement la différence de prix entre un vol
                classique et notre solution optimisée.
              </p>

              <h4 className="text-lg font-medium text-gray-900 mb-3">
                4. Réservation Simplifiée
              </h4>
              <p className="text-gray-600">
                Une fois votre choix fait, réservez directement auprès des
                compagnies aériennes en toute sécurité.
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
                <h4 className="font-medium mb-1">Recherche Approfondie</h4>
                <p className="text-blue-100 text-sm">
                  Là où les autres s'arrêtent, nous continuons pour trouver des
                  tarifs cachés.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Expertise Locale</h4>
                <p className="text-blue-100 text-sm">
                  Nous utilisons les spécificités du marché algérien à votre
                  avantage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">100% Transparent</h4>
                <p className="text-blue-100 text-sm">
                  Aucun frais caché, nous calculons simplement les meilleures
                  combinaisons pour vous.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">✓</span>
              </div>
              <div>
                <h4 className="font-medium mb-1">Simplicité</h4>
                <p className="text-blue-100 text-sm">
                  Une interface claire pour comprendre et réserver sans
                  complication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// Force redeploy Wed Aug 27 16:08:35 CEST 2025
