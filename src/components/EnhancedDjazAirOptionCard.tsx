"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AirlineSelector } from "./AirlineSelector";
import { type FlightSegment } from "@/lib/airlineRedirects";
import { getAirlineLogo, getAirlineName } from "@/data/airlineLogos";
import Image from "next/image";

interface SegmentInfo {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    flightNumber: string;
    airline: string;
    airlineCode?: string;
    duration: string;
    priceEUR?: number;
    priceDZD?: number;
    currency?: string;
    baggage?: {
        included: boolean;
        weight?: string;
    };
}

interface DjazAirOptionCardProps {
    option: {
        id: string;
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        totalDuration: string;
        totalPriceEUR: number;
        totalPriceDZD?: number;
        segments: SegmentInfo[];
        layover?: {
            airport: string;
            duration: string;
            location: string;
        };
        savings?: {
            amount: number;
            percentage: number;
            comparedTo: number;
        };
    };
    classicPrice?: number; // Prix des vols classiques pour comparaison
    onBook?: (optionId: string) => void;
}

// Taux de change
const PARALLEL_RATE = 280;
const OFFICIAL_RATE = 150;

export function EnhancedDjazAirOptionCard({
    option,
    classicPrice,
    onBook,
}: DjazAirOptionCardProps) {
    const [showAirlineSelector, setShowAirlineSelector] = useState(false);
    const [expandedSegments, setExpandedSegments] = useState(false);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    const formatFullDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getAirlineCode = (airline: string): string => {
        const codes: Record<string, string> = {
            "Air France": "AF",
            "Air Algérie": "AH",
            Emirates: "EK",
            "Turkish Airlines": "TK",
            "Qatar Airways": "QR",
            Lufthansa: "LH",
        };
        return codes[airline] || airline.substring(0, 2).toUpperCase();
    };

    const handleBookWithAirlines = () => {
        setShowAirlineSelector(true);
    };

    const createFlightSegments = (): FlightSegment[] => {
        return option.segments.map((seg) => ({
            origin: seg.origin,
            destination: seg.destination,
            date: seg.departureTime.split("T")[0],
            passengers: 1,
        }));
    };

    // Calculer les économies réelles
    const realSavings = classicPrice
        ? {
            amount: Math.round((classicPrice - option.totalPriceEUR) * 100) / 100,
            percentage: Math.round(
                ((classicPrice - option.totalPriceEUR) / classicPrice) * 100
            ),
        }
        : option.savings;

    return (
        <>
            <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-xl overflow-hidden">
                {/* Header avec gradient */}
                <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white p-4">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">✈️</span>
                            <div>
                                <span className="text-lg font-bold">
                                    Solution DjazAir - Aller Simple (AS) avec
                                </span>
                                <div className="text-blue-100 text-sm font-normal">
                                    Escale en Algérie
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">
                                {option.totalPriceEUR.toFixed(2)}€
                            </div>
                            {option.totalPriceDZD && (
                                <div className="text-blue-200 text-sm">
                                    {option.totalPriceDZD.toLocaleString()} DZD
                                </div>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-5">
                    {/* Résumé de la route */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-800">
                                {option.origin}
                            </span>
                            <span className="text-blue-500">→</span>
                            <span className="text-lg font-bold text-gray-800">
                                {option.destination}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            {formatFullDate(option.departureDate)} • {option.totalDuration}
                        </div>
                    </div>

                    {/* Segments détaillés */}
                    <div className="space-y-3 mb-4">
                        {option.segments.map((segment, index) => {
                            const airlineCode =
                                segment.airlineCode || getAirlineCode(segment.airline);
                            const logoUrl = getAirlineLogo(airlineCode);
                            const isFromAlgeria = segment.origin === "ALG";

                            return (
                                <div key={index}>
                                    {/* Indicateur d'escale entre les segments */}
                                    {index > 0 && option.layover && (
                                        <div className="flex justify-center py-2">
                                            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full border border-amber-200">
                                                <span>🛬</span>
                                                <span className="font-medium">
                                                    Escale à {option.layover.location} (
                                                    {option.layover.duration})
                                                </span>
                                                <span>🛫</span>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className={`bg-white rounded-lg border-2 p-4 ${isFromAlgeria
                                            ? "border-green-300 bg-gradient-to-r from-green-50 to-white"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        {/* En-tête du segment */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Logo compagnie */}
                                                <div className="w-10 h-10 relative bg-white rounded-lg shadow-sm p-1 flex items-center justify-center">
                                                    <Image
                                                        src={logoUrl}
                                                        alt={segment.airline}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain"
                                                        onError={(e) => {
                                                            // Fallback si l'image ne charge pas
                                                            (e.target as HTMLImageElement).src =
                                                                "https://via.placeholder.com/32";
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800">
                                                        {getAirlineName(segment.airlineCode || segment.airline)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Vol {segment.flightNumber}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Prix du segment */}
                                            <div className="text-right">
                                                {segment.priceEUR !== undefined && (
                                                    <div className="font-bold text-lg">
                                                        {segment.priceEUR.toFixed(2)}€
                                                    </div>
                                                )}
                                                {segment.priceDZD && (
                                                    <div className="text-sm text-green-600">
                                                        {segment.priceDZD.toLocaleString()} DZD
                                                    </div>
                                                )}
                                                {isFromAlgeria && (
                                                    <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded mt-1">
                                                        💰 Avantage DZD
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Trajet du segment */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-800">
                                                    {formatTime(segment.departureTime)}
                                                </div>
                                                <div className="text-sm font-medium text-gray-600">
                                                    {segment.origin}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {formatDate(segment.departureTime)}
                                                </div>
                                            </div>

                                            <div className="flex-1 mx-4">
                                                <div className="flex items-center">
                                                    <div className="h-px flex-1 bg-gray-300"></div>
                                                    <div className="px-3 text-sm text-gray-500">
                                                        {segment.duration}
                                                    </div>
                                                    <div className="h-px flex-1 bg-gray-300"></div>
                                                </div>
                                                <div className="text-center text-xs text-gray-400 mt-1">
                                                    ✈️ Direct
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-800">
                                                    {formatTime(segment.arrivalTime)}
                                                </div>
                                                <div className="text-sm font-medium text-gray-600">
                                                    {segment.destination}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {formatDate(segment.arrivalTime)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bagages */}
                                        <div className="flex items-center justify-between mt-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span>🧳</span>
                                                <span>
                                                    Bagage inclus:{" "}
                                                    {segment.baggage?.weight || "23kg en soute"}
                                                </span>
                                            </div>
                                            <div className="text-gray-500">
                                                Devise:{" "}
                                                <span className="font-medium">
                                                    {segment.currency || "EUR"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Encadré économies et explication */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">💰</span>
                                <span className="font-bold text-green-800">
                                    Économies DjazAir
                                </span>
                            </div>
                            {realSavings && realSavings.amount > 0 && (
                                <div className="bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                                    -{realSavings.percentage}%
                                </div>
                            )}
                        </div>

                        {realSavings && realSavings.amount > 0 && (
                            <div className="text-center mb-3">
                                <div className="text-3xl font-bold text-green-700">
                                    {realSavings.amount.toFixed(2)}€ d'économies
                                </div>
                                {classicPrice && (
                                    <div className="text-sm text-green-600">
                                        Par rapport au vol classique à {classicPrice.toFixed(2)}€
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Explication du taux de change */}
                        <div className="bg-white/60 rounded-lg p-3 text-sm">
                            <div className="font-semibold text-gray-700 mb-2">
                                📊 Comment ça marche ?
                            </div>
                            <ul className="space-y-1 text-gray-600 text-xs">
                                <li>
                                    • Les vols depuis Alger sont vendus en{" "}
                                    <strong>Dinar (DZD)</strong>
                                </li>
                                <li>
                                    • Taux officiel bancaire: 1€ = {OFFICIAL_RATE} DZD
                                </li>
                                <li>
                                    • Taux marché parallèle: 1€ ={" "}
                                    <strong className="text-green-700">{PARALLEL_RATE} DZD</strong>
                                </li>
                                <li>
                                    • En payant en Dinar, vous bénéficiez d'un meilleur taux
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Avantages */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <span className="text-green-500">✓</span>
                            <span>Bagages 23kg inclus</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <span className="text-green-500">✓</span>
                            <span>Escale optimisée</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <span className="text-green-500">✓</span>
                            <span>Vols flexibles</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <span className="text-green-500">✓</span>
                            <span>Support 24/7</span>
                        </div>
                    </div>

                    {/* Bouton d'action unique */}
                    <div className="mt-4">
                        {onBook && (
                            <Button
                                onClick={() => onBook(option.id)}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <span>📋</span>
                                <span>Voir les détails & Réserver</span>
                            </Button>
                        )}
                    </div>

                    {/* Note explicative */}
                    <div className="text-center mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        💡 <strong>DjazAir</strong> vous redirige vers les sites officiels
                        des compagnies aériennes pour réserver vos vols avec escale en
                        Algérie.
                    </div>
                </CardContent>
            </Card>

            {/* Modal sélecteur de compagnies */}
            {showAirlineSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <AirlineSelector
                            segments={createFlightSegments()}
                            cabinClass="Economy"
                            onClose={() => setShowAirlineSelector(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
