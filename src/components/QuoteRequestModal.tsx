"use client";

import React, { useState } from "react";
import { X, Send, CheckCircle, Loader2, Plane, Calendar, Users, Mail, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuoteRequestData {
    // Données du vol (pré-remplies)
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    estimatedPrice: number;
    flightDetails?: {
        segments: Array<{
            airline: string;
            flightNumber: string;
            origin: string;
            destination: string;
            departureTime: string;
            arrivalTime: string;
        }>;
    };
}

interface QuoteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    flightData: QuoteRequestData;
}

export function QuoteRequestModal({ isOpen, onClose, flightData }: QuoteRequestModalProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        comment: "",
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            const response = await fetch("/api/quote-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    flight: flightData,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMessage(data.message || "Une erreur est survenue");
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage("Erreur de connexion. Veuillez réessayer.");
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Plane className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Demande de Devis</h2>
                                <p className="text-emerald-100 text-sm">
                                    {flightData.origin} → {flightData.destination}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {status === "success" ? (
                    /* Success State */
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Demande envoyée !
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Nous avons bien reçu votre demande de devis. Notre équipe vous contactera sous 24h avec une offre personnalisée.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                ) : (
                    /* Form State */
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Résumé du vol */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Plane className="h-4 w-4 text-emerald-600" />
                                Détails du vol
                            </h3>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <div className="text-gray-500">Départ</div>
                                        <div className="font-medium">{formatDate(flightData.departDate)}</div>
                                    </div>
                                </div>
                                {flightData.returnDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <div className="text-gray-500">Retour</div>
                                            <div className="font-medium">{formatDate(flightData.returnDate)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>
                                    {flightData.adults} adulte{flightData.adults > 1 ? "s" : ""}
                                    {flightData.children > 0 && `, ${flightData.children} enfant${flightData.children > 1 ? "s" : ""}`}
                                    {flightData.infants > 0 && `, ${flightData.infants} bébé${flightData.infants > 1 ? "s" : ""}`}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-gray-600">Prix estimé</span>
                                <span className="text-xl font-bold text-emerald-600">
                                    ~{flightData.estimatedPrice}€
                                </span>
                            </div>
                        </div>

                        {/* Champs utilisateur */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <User className="h-4 w-4 text-emerald-600" />
                                Vos coordonnées
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Jean Dupont"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="jean@exemple.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Téléphone *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+33 6 12 34 56 78"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Commentaire (optionnel)
                                </label>
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    placeholder="Flexibilité sur les dates, préférences de vol..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {status === "error" && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                                {errorMessage}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg transition-all",
                                "flex items-center justify-center gap-2",
                                status === "loading"
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl"
                            )}
                        >
                            {status === "loading" ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Demander un devis
                                </>
                            )}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            En soumettant ce formulaire, vous acceptez d'être contacté par email ou téléphone pour votre demande de devis.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
