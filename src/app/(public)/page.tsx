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

          {/* Section "Pourquoi DjazAir ?" simplifiée et percutante */}
          <div className="py-16 md:py-24 bg-stone-50 border-t border-stone-200 mt-16 rounded-3xl mx-4 md:mx-0">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-extrabold text-emerald-950 mb-6 tracking-tight">
                  Le Secret du Hub d'Alger 🇩🇿
                </h2>
                <p className="text-lg md:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
                  Profitez de la position stratégique d'Alger comme carrefour entre l'Europe, l'Afrique et l'Asie pour voyager à des tarifs imbattables.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                {/* Point 1 : Le Hub Stratégique */}
                <div className="flex flex-col items-center group">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-stone-100 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950 mb-3">Un Carrefour Mondial</h3>
                  <p className="text-stone-600 px-4">
                    Alger connecte l'Europe au reste du monde. Une simple escale vous ouvre les portes de l'Asie et de l'Afrique.
                  </p>
                </div>

                {/* Point 2 : Prix Cassés */}
                <div className="flex flex-col items-center group">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-stone-100 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950 mb-3">Jusqu'à -60% d'Économie</h3>
                  <p className="text-stone-600 px-4">
                    En passant par Alger, bénéficiez de tarifs exceptionnels souvent inaccessibles via les vols directs classiques.
                  </p>
                </div>

                {/* Point 3 : Authenticité */}
                <div className="flex flex-col items-center group">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-stone-100 group-hover:scale-110 transition-transform duration-300">
                    <Plane className="w-10 h-10 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950 mb-3">L'Astuce Voyageur</h3>
                  <p className="text-stone-600 px-4">
                    Rejoignez les milliers de voyageurs malins qui ont compris qu'un petit détour par Alger finance leurs prochaines vacances.
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
