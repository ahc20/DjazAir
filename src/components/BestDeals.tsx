"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Plane } from "lucide-react";
import Link from "next/link";

interface Deal {
    id: string;
    destination: string;
    destinationCode: string;
    origin: string;
    originCode?: string;
    image: string;
    price: number;
    classicPrice?: number;
    savings?: number;
    savingsPercentage?: number;
    departDate?: string;
    returnDate?: string;
    date?: string;
    tripType?: string;
    airline: string;
}

export function BestDeals() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const response = await fetch('/api/djazair-deals');
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    setDeals(result.data);
                }
            } catch (err) {
                console.error("Erreur chargement deals:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    if (loading) {
        return (
            <div className="mb-16 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 animate-pulse">
                <div className="h-8 bg-emerald-100 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-emerald-100 rounded w-1/2 mx-auto"></div>
            </div>
        );
    }

    if (deals.length === 0) return null;

    // Fonction pour formater la date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    // Trouver le prix le plus bas
    const lowestPrice = Math.min(...deals.map(d => d.price));

    return (
        <div className="mb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-4 py-2 mb-4">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">Destinations Populaires</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Vols à partir de {lowestPrice}€
                </h2>
                <p className="text-gray-600 text-lg">
                    Aller-Retour • Comparez et économisez via Alger
                </p>
            </div>

            {/* Grille des destinations avec photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {deals.map((deal) => {
                    const departDate = deal.departDate || deal.date;
                    const searchUrl = `/search/results?origin=${deal.originCode || 'CDG'}&destination=${deal.destinationCode}&departDate=${departDate}${deal.returnDate ? `&returnDate=${deal.returnDate}` : ''}&adults=1&cabin=ECONOMY`;

                    return (
                        <Link
                            key={deal.id}
                            href={searchUrl}
                            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                        >
                            {/* Image de fond */}
                            <div className="relative h-72">
                                <img
                                    src={deal.image}
                                    alt={deal.destination}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                {/* Badge AR */}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-emerald-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    <span>A/R</span>
                                </div>

                                {/* Badge compagnie */}
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <Plane className="w-3 h-3" />
                                    <span>{deal.airline}</span>
                                </div>

                                {/* Contenu */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                    <h3 className="text-2xl font-bold mb-1">{deal.destination}</h3>
                                    <p className="text-white/70 text-sm mb-3">
                                        {formatDate(departDate)} → {formatDate(deal.returnDate)}
                                    </p>

                                    {/* Prix */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="text-sm text-white/60">à partir de</span>
                                            <span className="text-3xl font-bold ml-2">{deal.price}€</span>
                                        </div>
                                        <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                            Voir offres
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Footer info */}
            <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                    Prix par personne • Taxes incluses • Cliquez pour voir toutes les options
                </p>
            </div>
        </div>
    );
}
