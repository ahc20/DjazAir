import { describe, it, expect } from 'vitest';
import {
  calculateViaTotalEUR,
  calculateSavingsEUR,
  calculateSavingsPercent,
  isGoodDeal,
  performArbitrage,
  validateArbitrageInputs,
  calculateBreakEven,
  calculateRateSensitivity,
} from '../src/server/arbitrage/calc';

describe('Fonctions d\'arbitrage', () => {
  describe('calculateViaTotalEUR', () => {
    it('calcule correctement le prix total via Alger', () => {
      const result = calculateViaTotalEUR(130, 70000, 262);
      expect(result).toBeCloseTo(130 + (70000 / 262), 2);
    });

    it('gère les prix nuls', () => {
      const result = calculateViaTotalEUR(0, 70000, 262);
      expect(result).toBe(70000 / 262);
    });
  });

  describe('calculateSavingsEUR', () => {
    it('calcule correctement les économies', () => {
      const result = calculateSavingsEUR(800, 473);
      expect(result).toBe(327);
    });

    it('gère les prix négatifs (pas d\'économies)', () => {
      const result = calculateSavingsEUR(350, 398);
      expect(result).toBe(-48);
    });
  });

  describe('calculateSavingsPercent', () => {
    it('calcule correctement le pourcentage d\'économies', () => {
      const result = calculateSavingsPercent(800, 473);
      expect(result).toBeCloseTo(40.875, 2);
    });

    it('retourne 0 pour un prix direct nul', () => {
      const result = calculateSavingsPercent(0, 473);
      expect(result).toBe(0);
    });

    it('gère les prix négatifs (pas d\'économies)', () => {
      const result = calculateSavingsPercent(350, 398);
      expect(result).toBeCloseTo(-13.71, 2);
    });
  });

  describe('isGoodDeal', () => {
    it('identifie un bon deal', () => {
      const result = isGoodDeal(40.875, 15);
      expect(result).toBe(true);
    });

    it('identifie un mauvais deal', () => {
      const result = isGoodDeal(10, 15);
      expect(result).toBe(false);
    });

    it('gère le seuil exact', () => {
      const result = isGoodDeal(15, 15);
      expect(result).toBe(true);
    });
  });

  describe('performArbitrage', () => {
    it('calcule l\'arbitrage complet correctement', () => {
      const inputs = {
        directPriceEUR: 800,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 262,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = performArbitrage(inputs);

      expect(result.directPriceEUR).toBe(800);
      expect(result.viaAlgiersPriceEUR).toBeCloseTo(130 + (90000 / 262), 2);
      expect(result.savingsEUR).toBeCloseTo(800 - (130 + (90000 / 262)), 2);
      expect(result.isDeal).toBe(true);
      expect(result.risks.separateTickets).toBe(true);
      expect(result.risks.visaRequired).toBe(true);
      expect(result.risks.connectionRisk).toBe(true);
    });

    it('gère le cas où ce n\'est pas un bon deal', () => {
      const inputs = {
        directPriceEUR: 350,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 70000,
        exchangeRate: 262,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = performArbitrage(inputs);

      expect(result.isDeal).toBe(false);
      expect(result.savingsEUR).toBeLessThan(0);
    });
  });

  describe('validateArbitrageInputs', () => {
    it('valide des entrées correctes', () => {
      const inputs = {
        directPriceEUR: 800,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 262,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = validateArbitrageInputs(inputs);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('détecte un prix direct invalide', () => {
      const inputs = {
        directPriceEUR: -100,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 262,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = validateArbitrageInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le prix direct doit être positif');
    });

    it('détecte un taux de change invalide', () => {
      const inputs = {
        directPriceEUR: 800,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 0,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = validateArbitrageInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le taux de change doit être positif');
    });

    it('détecte un pourcentage d\'économies invalide', () => {
      const inputs = {
        directPriceEUR: 800,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 262,
        minSavingsPercent: 150,
        riskBufferMinutes: 120,
      };

      const result = validateArbitrageInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le pourcentage minimum d\'économies doit être entre 0 et 100');
    });
  });

  describe('calculateBreakEven', () => {
    it('calcule correctement le seuil de rentabilité', () => {
      const result = calculateBreakEven(130, 262, 800);
      const expected = (800 - 130) * 262;
      expect(result).toBe(expected);
    });

    it('gère le cas où le prix vers Alger dépasse le prix direct', () => {
      const result = calculateBreakEven(900, 262, 800);
      expect(result).toBe(0);
    });
  });

  describe('calculateRateSensitivity', () => {
    it('calcule la sensibilité du taux de change', () => {
      const result = calculateRateSensitivity(800, 130, 90000, 262, 0.1);

      expect(result.lowerRate).toBeCloseTo(262 * 0.9, 2);
      expect(result.upperRate).toBeCloseTo(262 * 1.1, 2);
      // Quand le taux baisse (lowerRate), le prix via Alger en EUR augmente, donc les économies diminuent
      expect(result.lowerSavings).toBeLessThan(result.upperSavings);
    });

    it('utilise une variation de 10% par défaut', () => {
      const result = calculateRateSensitivity(800, 130, 90000, 262);
      expect(result.lowerRate).toBeCloseTo(262 * 0.9, 2);
      expect(result.upperRate).toBeCloseTo(262 * 1.1, 2);
    });
  });

  describe('Scénarios d\'arbitrage réels', () => {
    it('scénario 1: CDG→DXB direct cher vs via Alger rentable', () => {
      const inputs = {
        directPriceEUR: 800,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 262,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = performArbitrage(inputs);
      const viaTotal = 130 + (90000 / 262);
      const savings = 800 - viaTotal;
      const savingsPercent = (savings / 800) * 100;

      expect(result.viaAlgiersPriceEUR).toBeCloseTo(viaTotal, 2);
      expect(result.savingsEUR).toBeCloseTo(savings, 2);
      expect(result.savingsPercent).toBeCloseTo(savingsPercent, 2);
      expect(result.isDeal).toBe(savingsPercent >= 15);
    });

    it('scénario 2: CDG→DXB direct pas cher vs via Alger non rentable', () => {
      const inputs = {
        directPriceEUR: 350,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 70000,
        exchangeRate: 262,
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const result = performArbitrage(inputs);
      const viaTotal = 130 + (70000 / 262);
      const savings = 350 - viaTotal;

      expect(result.viaAlgiersPriceEUR).toBeCloseTo(viaTotal, 2);
      expect(result.savingsEUR).toBeCloseTo(savings, 2);
      expect(result.isDeal).toBe(false);
    });

    it('scénario 3: changement de taux modifie la rentabilité', () => {
      const inputs1 = {
        directPriceEUR: 800,
        originToAlgiersEUR: 130,
        algiersToDestinationDZD: 90000,
        exchangeRate: 150, // Taux officiel
        minSavingsPercent: 15,
        riskBufferMinutes: 120,
      };

      const inputs2 = {
        ...inputs1,
        exchangeRate: 262, // Taux custom
      };

      const result1 = performArbitrage(inputs1);
      const result2 = performArbitrage(inputs2);

      // Avec le taux officiel (150), le prix via Alger sera plus élevé
      expect(result1.viaAlgiersPriceEUR).toBeGreaterThan(result2.viaAlgiersPriceEUR);
      
      // Les économies seront différentes
      expect(result1.savingsEUR).not.toBe(result2.savingsEUR);
    });
  });
});
