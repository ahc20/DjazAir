"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Settings,
  Euro,
  Percent,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { configSchema, type ConfigData } from "@/lib/zod";
import { cn } from "@/lib/utils";

interface ConfigFormProps {
  initialConfig: ConfigData;
  onSave: (data: ConfigData) => Promise<void>;
  isLoading?: boolean;
}

export function ConfigForm({
  initialConfig,
  onSave,
  isLoading = false,
}: ConfigFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ConfigData>({
    resolver: zodResolver(configSchema),
    defaultValues: initialConfig,
  });

  const onSubmit = async (data: ConfigData) => {
    try {
      await onSave(data);
      reset(data);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleReset = () => {
    reset(initialConfig);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Settings className="h-6 w-6" />
          Configuration de l'Application
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Taux de change custom */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Taux de change EUR → DZD (Custom)
            </label>
            <Input
              {...register("eurToDzdCustomRate", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="262.00"
              className={cn(errors.eurToDzdCustomRate && "border-red-500")}
            />
            {errors.eurToDzdCustomRate && (
              <p className="text-sm text-red-500">
                {errors.eurToDzdCustomRate.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Taux utilisé pour les simulations "via Alger" quand le mode custom
              est sélectionné
            </p>
          </div>

          {/* Pourcentage minimum d'économies */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Pourcentage minimum d'économies (%)
            </label>
            <Input
              {...register("minSavingsPercent", { valueAsNumber: true })}
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="15.0"
              className={cn(errors.minSavingsPercent && "border-red-500")}
            />
            {errors.minSavingsPercent && (
              <p className="text-sm text-red-500">
                {errors.minSavingsPercent.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Seuil minimum d'économies pour qu'une option "via Alger" soit
              considérée comme un bon deal
            </p>
          </div>

          {/* Buffer de risque */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Buffer de risque (minutes)
            </label>
            <Input
              {...register("riskBufferMinutes", { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="120"
              className={cn(errors.riskBufferMinutes && "border-red-500")}
            />
            {errors.riskBufferMinutes && (
              <p className="text-sm text-red-500">
                {errors.riskBufferMinutes.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Temps de correspondance minimum recommandé pour les vols "via
              Alger"
            </p>
          </div>

          {/* Toggle Via Alger */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Afficher l'option "Via Alger"
            </label>
            <div className="flex items-center space-x-2">
              <input
                {...register("showViaAlgiers")}
                type="checkbox"
                id="showViaAlgiers"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="showViaAlgiers" className="text-sm text-gray-700">
                Activer la simulation "via Alger" pour les utilisateurs
              </label>
            </div>
            <p className="text-xs text-gray-600">
              Désactiver cette option masquera complètement la fonctionnalité
              "via Alger"
            </p>
          </div>

          {/* Avertissement légal */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Avertissement légal</label>
            <textarea
              {...register("legalDisclaimer")}
              rows={4}
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.legalDisclaimer && "border-red-500"
              )}
              placeholder="Entrez l'avertissement légal à afficher aux utilisateurs..."
            />
            {errors.legalDisclaimer && (
              <p className="text-sm text-red-500">
                {errors.legalDisclaimer.message}
              </p>
            )}
            <p className="text-xs text-gray-600">
              Ce texte sera affiché sur toutes les pages pour informer les
              utilisateurs des limites légales
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !isDirty}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Sauvegarder la configuration
                </div>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty}
            >
              Réinitialiser
            </Button>
          </div>

          {/* Informations supplémentaires */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Notes importantes :</p>
              <ul className="space-y-1 text-xs">
                <li>• Les modifications prennent effet immédiatement</li>
                <li>
                  • Le taux custom est utilisé uniquement pour les simulations
                </li>
                <li>
                  • L'avertissement légal est affiché sur toutes les pages
                </li>
                <li>
                  • Ces paramètres affectent le comportement de l'application
                  pour tous les utilisateurs
                </li>
              </ul>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
