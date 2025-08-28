"use client";

import React from "react";
import { AlertTriangle, Shield, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, LEGAL_DISCLAIMER } from "@/lib/constants";

interface LegalDisclaimerProps {
  variant?: "header" | "modal" | "footer";
  className?: string;
}

export function LegalDisclaimer({
  variant = "header",
  className = "",
}: LegalDisclaimerProps) {
  const disclaimerText = LEGAL_DISCLAIMER;

  if (variant === "header") {
    return (
      <div
        className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Avertissement Légal Important</p>
            <p>{disclaimerText}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
            <Shield className="h-5 w-5" />
            Avertissement Légal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-700 mb-3">{disclaimerText}</p>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Cette application est un simulateur d'arbitrage à des fins
                  d'information uniquement
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Aucun achat de billet en dinars algériens n'est effectué
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>Aucune opération de change n'est facilitée</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Les prix "via Alger" sont des estimations basées sur des
                  hypothèses
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Vérifiez toujours les conditions de visa et les risques de
                  correspondance
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Comment ça fonctionne :</p>
                <p>
                  L'application compare le prix d'un vol direct avec une
                  simulation de vol "via Alger" en utilisant des taux de change
                  officiels ou configurés par l'administrateur. Cette
                  comparaison est purement informative.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Footer variant
  return (
    <footer
      className={`bg-gray-100 border-t border-gray-200 py-6 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {APP_NAME} - Simulateur d'Arbitrage
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Outil de comparaison et de simulation pour l'optimisation des
              voyages internationaux.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              Application 100% légale et informative
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Avertissement Légal
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {disclaimerText}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-4 text-center">
          <p className="text-xs text-gray-500">
            © 2024 {APP_NAME}. Tous droits réservés. Cette application respecte
            strictement la réglementation française et européenne.
          </p>
        </div>
      </div>
    </footer>
  );
}
