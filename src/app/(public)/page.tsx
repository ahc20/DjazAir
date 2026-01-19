"use client";

import React from "react";
import { Plane, TrendingUp, Globe } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { BestDeals } from "@/components/BestDeals";
import { DjazAirLogo } from "@/components/ui/DjazAirLogo";

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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DjazAirLogo className="h-10 w-10" />
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main>
        {/* Section hero avec Pattern Zellige */}
        <div className="relative bg-zellige-pattern py-20 border-b border-stone-200">
          <div className="relative max-w-7xl mx-auto px-4 text-center z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold text-emerald-900 mb-6 tracking-tight">
              Trouvez les meilleurs prix de vols,<br />
              <span className="text-emerald-600">en passant par l'Algérie</span>
            </h2>
          </div>
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-50 to-transparent"></div>
        </div>

        {/* Formulaire de recherche - Floating Style */}
        <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20 mb-20">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-2">
            <SearchForm onSubmit={handleSearch} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-20">
          {/* Section Meilleures Offres */}
          <BestDeals />

          {/* Section des fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                <Plane className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Recherche en Temps Réel
              </h3>
              <p className="text-gray-600">
                Obtenez les prix les plus récents directement depuis Amadeus
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3 hover:-rotate-6 transition-transform">
                <TrendingUp className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Prix Transparents
              </h3>
              <p className="text-gray-600">
                Comparez facilement les offres avec toutes les informations
                détaillées
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                <Globe className="h-8 w-8 text-red-600" />
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
        </div>
      </main>
    </div>
  );
}
// Force redeploy Wed Aug 27 16:08:35 CEST 2025
