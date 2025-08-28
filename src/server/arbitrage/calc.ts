import type { ArbitrageResult, ExchangeRateMode } from "@/types";

export interface ArbitrageInputs {
  directPriceEUR: number;
  originToAlgiersEUR: number;
  algiersToDestinationDZD: number;
  exchangeRate: number;
  minSavingsPercent: number;
  riskBufferMinutes: number;
}

export interface ArbitrageCalculation {
  viaTotalEUR: number;
  savingsEUR: number;
  savingsPercent: number;
  isDeal: boolean;
  viaBreakdown: {
    originToAlgiersEUR: number;
    algiersToDestinationDZD: number;
    algiersToDestinationEUR: number;
    totalViaAlgiersEUR: number;
  };
  risks: {
    separateTickets: boolean;
    visaRequired: boolean;
    connectionRisk: boolean;
  };
}

/**
 * Calcule le prix total via Alger en EUR
 */
export function calculateViaTotalEUR(
  originToAlgiersEUR: number,
  algiersToDestinationDZD: number,
  exchangeRate: number
): number {
  const algiersToDestinationEUR = algiersToDestinationDZD / exchangeRate;
  return originToAlgiersEUR + algiersToDestinationEUR;
}

/**
 * Calcule les économies en EUR
 */
export function calculateSavingsEUR(
  directPriceEUR: number,
  viaTotalEUR: number
): number {
  return directPriceEUR - viaTotalEUR;
}

/**
 * Calcule le pourcentage d'économies
 */
export function calculateSavingsPercent(
  directPriceEUR: number,
  viaTotalEUR: number
): number {
  if (directPriceEUR <= 0) return 0;
  return ((directPriceEUR - viaTotalEUR) / directPriceEUR) * 100;
}

/**
 * Détermine si c'est un bon deal selon le seuil minimum
 */
export function isGoodDeal(
  savingsPercent: number,
  minSavingsPercent: number
): boolean {
  return savingsPercent >= minSavingsPercent;
}

/**
 * Évalue les risques du voyage via Alger
 */
export function assessRisks(
  originToAlgiersEUR: number,
  algiersToDestinationDZD: number,
  riskBufferMinutes: number
): {
  separateTickets: boolean;
  visaRequired: boolean;
  connectionRisk: boolean;
} {
  // Billets séparés : toujours vrai pour via Alger
  const separateTickets = true;

  // Visa requis : toujours vrai pour l'Algérie (sauf passeport algérien)
  const visaRequired = true;

  // Risque de correspondance : évaluer selon le buffer de risque
  // Pour l'instant, on considère qu'il y a toujours un risque
  const connectionRisk = true;

  return {
    separateTickets,
    visaRequired,
    connectionRisk,
  };
}

/**
 * Fonction principale de calcul d'arbitrage
 */
export function calculateArbitrage(
  inputs: ArbitrageInputs
): ArbitrageCalculation {
  const {
    directPriceEUR,
    originToAlgiersEUR,
    algiersToDestinationDZD,
    exchangeRate,
    minSavingsPercent,
    riskBufferMinutes,
  } = inputs;

  // Calcul du prix total via Alger
  const viaTotalEUR = calculateViaTotalEUR(
    originToAlgiersEUR,
    algiersToDestinationDZD,
    exchangeRate
  );

  // Calcul des économies
  const savingsEUR = calculateSavingsEUR(directPriceEUR, viaTotalEUR);
  const savingsPercent = calculateSavingsPercent(directPriceEUR, viaTotalEUR);

  // Déterminer si c'est un bon deal
  const isDeal = isGoodDeal(savingsPercent, minSavingsPercent);

  // Évaluer les risques
  const risks = assessRisks(
    originToAlgiersEUR,
    algiersToDestinationDZD,
    riskBufferMinutes
  );

  // Détail du calcul
  const viaBreakdown = {
    originToAlgiersEUR,
    algiersToDestinationDZD,
    algiersToDestinationEUR: algiersToDestinationDZD / exchangeRate,
    totalViaAlgiersEUR: viaTotalEUR,
  };

  return {
    viaTotalEUR,
    savingsEUR,
    savingsPercent,
    isDeal,
    viaBreakdown,
    risks,
  };
}

/**
 * Calcule l'arbitrage complet et retourne le résultat formaté
 */
export function performArbitrage(inputs: ArbitrageInputs): ArbitrageResult {
  const calculation = calculateArbitrage(inputs);

  return {
    directPriceEUR: inputs.directPriceEUR,
    viaAlgiersPriceEUR: calculation.viaTotalEUR,
    savingsEUR: calculation.savingsEUR,
    savingsPercent: calculation.savingsPercent,
    isDeal: calculation.isDeal,
    viaBreakdown: calculation.viaBreakdown,
    risks: calculation.risks,
  };
}

/**
 * Valide les entrées d'arbitrage
 */
export function validateArbitrageInputs(inputs: ArbitrageInputs): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (inputs.directPriceEUR <= 0) {
    errors.push("Le prix direct doit être positif");
  }

  if (inputs.originToAlgiersEUR <= 0) {
    errors.push("Le prix vers Alger doit être positif");
  }

  if (inputs.algiersToDestinationDZD <= 0) {
    errors.push("Le prix depuis Alger doit être positif");
  }

  if (inputs.exchangeRate <= 0) {
    errors.push("Le taux de change doit être positif");
  }

  if (inputs.minSavingsPercent < 0 || inputs.minSavingsPercent > 100) {
    errors.push("Le pourcentage minimum d'économies doit être entre 0 et 100");
  }

  if (inputs.riskBufferMinutes < 0) {
    errors.push("Le buffer de risque doit être positif");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calcule le seuil de rentabilité (break-even)
 */
export function calculateBreakEven(
  originToAlgiersEUR: number,
  exchangeRate: number,
  directPriceEUR: number
): number {
  // Prix total via Alger = Prix vers Alger + (Prix depuis Alger DZD / Taux)
  // Break-even : Prix direct = Prix via Alger
  // Donc : Prix depuis Alger DZD = (Prix direct - Prix vers Alger) * Taux

  const maxAlgiersToDestinationDZD =
    (directPriceEUR - originToAlgiersEUR) * exchangeRate;
  return Math.max(0, maxAlgiersToDestinationDZD);
}

/**
 * Calcule la sensibilité du taux de change
 */
export function calculateRateSensitivity(
  directPriceEUR: number,
  originToAlgiersEUR: number,
  algiersToDestinationDZD: number,
  baseRate: number,
  rateVariation: number = 0.1 // 10% de variation
): {
  lowerRate: number;
  upperRate: number;
  lowerSavings: number;
  upperSavings: number;
} {
  const lowerRate = baseRate * (1 - rateVariation);
  const upperRate = baseRate * (1 + rateVariation);

  const lowerViaTotal = calculateViaTotalEUR(
    originToAlgiersEUR,
    algiersToDestinationDZD,
    lowerRate
  );
  const upperViaTotal = calculateViaTotalEUR(
    originToAlgiersEUR,
    algiersToDestinationDZD,
    upperRate
  );

  const lowerSavings = calculateSavingsEUR(directPriceEUR, lowerViaTotal);
  const upperSavings = calculateSavingsEUR(directPriceEUR, upperViaTotal);

  return {
    lowerRate,
    upperRate,
    lowerSavings,
    upperSavings,
  };
}
