import type { ExchangeRateMode } from "@/types";

export interface ExchangeRateResult {
  rate: number;
  source: string;
  timestamp: Date;
  isOfficial: boolean;
}

export class ExchangeRateService {
  private readonly exchangeBaseUrl: string;
  private readonly defaultCustomRate: number;

  constructor() {
    this.exchangeBaseUrl =
      process.env.EXCHANGE_BASE_URL || "https://api.exchangerate.host";
    this.defaultCustomRate = parseFloat(
      process.env.NEXT_PUBLIC_DEFAULT_PARALLEL_RATE_DZD || "262"
    );
  }

  /**
   * Récupère le taux officiel EUR → DZD depuis exchangerate.host (proxy ECB)
   */
  async getOfficialRateEURtoDZD(): Promise<ExchangeRateResult> {
    try {
      const response = await fetch(
        `${this.exchangeBaseUrl}/latest?base=EUR&symbols=DZD`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur API taux de change: ${response.status}`);
      }

      const data = await response.json();

      if (!data.rates || !data.rates.DZD) {
        throw new Error("Taux DZD non disponible dans la réponse");
      }

      return {
        rate: data.rates.DZD,
        source: "ECB via exchangerate.host",
        timestamp: new Date(),
        isOfficial: true,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du taux officiel:", error);

      // Fallback sur un taux par défaut en cas d'erreur
      return {
        rate: 150, // Taux de fallback approximatif
        source: "Fallback (erreur API)",
        timestamp: new Date(),
        isOfficial: true,
      };
    }
  }

  /**
   * Récupère le taux custom configuré par l'administrateur
   */
  async getCustomRate(): Promise<ExchangeRateResult> {
    try {
      // En production, on récupérerait ce taux depuis la base de données
      // Pour l'instant, on utilise la variable d'environnement
      const customRate = this.defaultCustomRate;

      return {
        rate: customRate,
        source: "Configuration administrateur",
        timestamp: new Date(),
        isOfficial: false,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du taux custom:", error);

      // Fallback sur le taux par défaut
      return {
        rate: this.defaultCustomRate,
        source: "Fallback (erreur config)",
        timestamp: new Date(),
        isOfficial: false,
      };
    }
  }

  /**
   * Sélectionne le taux approprié selon le mode demandé
   */
  async selectRate(mode: ExchangeRateMode): Promise<ExchangeRateResult> {
    switch (mode) {
      case "official":
        return await this.getOfficialRateEURtoDZD();

      case "custom":
        return await this.getCustomRate();

      default:
        throw new Error(`Mode de taux invalide: ${mode}`);
    }
  }

  /**
   * Récupère les deux taux pour comparaison
   */
  async getBothRates(): Promise<{
    official: ExchangeRateResult;
    custom: ExchangeRateResult;
  }> {
    const [official, custom] = await Promise.all([
      this.getOfficialRateEURtoDZD(),
      this.getCustomRate(),
    ]);

    return { official, custom };
  }

  /**
   * Convertit un montant EUR en DZD selon le mode spécifié
   */
  async convertEURtoDZD(
    amountEUR: number,
    mode: ExchangeRateMode
  ): Promise<{
    amountDZD: number;
    rate: ExchangeRateResult;
  }> {
    const rate = await this.selectRate(mode);
    const amountDZD = amountEUR * rate.rate;

    return {
      amountDZD,
      rate,
    };
  }

  /**
   * Convertit un montant DZD en EUR selon le mode spécifié
   */
  async convertDZDtoEUR(
    amountDZD: number,
    mode: ExchangeRateMode
  ): Promise<{
    amountEUR: number;
    rate: ExchangeRateResult;
  }> {
    const rate = await this.selectRate(mode);
    const amountEUR = amountDZD / rate.rate;

    return {
      amountEUR,
      rate,
    };
  }

  /**
   * Vérifie si les taux sont à jour (moins de 24h)
   */
  isRateFresh(rate: ExchangeRateResult): boolean {
    const now = new Date();
    const rateAge = now.getTime() - rate.timestamp.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    return rateAge < maxAge;
  }

  /**
   * Formate un taux pour l'affichage
   */
  formatRate(rate: number): string {
    return rate.toFixed(2);
  }

  /**
   * Calcule la différence entre deux taux en pourcentage
   */
  calculateRateDifference(rate1: number, rate2: number): number {
    if (rate1 === 0) return 0;
    return ((rate2 - rate1) / rate1) * 100;
  }
}
