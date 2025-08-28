export interface ArbitrageOpportunity {
  route: string;
  internationalPrice: number;
  algerianPriceDZD: number;
  algerianPriceEUR: {
    official: number; // Taux officiel (1€ = 150 DZD)
    parallel: number; // Taux parallèle/marché noir (1€ = 260 DZD)
  };
  savings: {
    official: number;
    parallel: number;
  };
  savingsPercentage: {
    official: number;
    parallel: number;
  };
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendations: string[];
  timestamp: Date;
}

export interface ExchangeRates {
  official: number; // BCE/Banque d'Algérie (1€ = 150 DZD)
  parallel: number; // Marché parallèle/marché noir (1€ = 260 DZD)
  lastUpdated: Date;
}

export class ArbitrageCalculator {
  private exchangeRates: ExchangeRates = {
    official: 150, // 1 EUR = 150 DZD (BCE/Banque d'Algérie)
    parallel: 260, // 1 EUR = 260 DZD (Marché parallèle/marché noir)
    lastUpdated: new Date(),
  };

  /**
   * Calcule les opportunités d'arbitrage pour une route donnée
   */
  calculateArbitrage(
    route: string,
    internationalPriceEUR: number,
    algerianPriceDZD: number
  ): ArbitrageOpportunity {
    // Calcul des prix en EUR selon les 2 taux
    const algerianPriceEUR = {
      official: this.roundTo2Decimals(
        algerianPriceDZD / this.exchangeRates.official
      ),
      parallel: this.roundTo2Decimals(
        algerianPriceDZD / this.exchangeRates.parallel
      ),
    };

    // Calcul des économies
    const savings = {
      official: this.roundTo2Decimals(
        internationalPriceEUR - algerianPriceEUR.official
      ),
      parallel: this.roundTo2Decimals(
        internationalPriceEUR - algerianPriceEUR.parallel
      ),
    };

    // Calcul des pourcentages d'économies
    const savingsPercentage = {
      official: this.roundTo2Decimals(
        (savings.official / internationalPriceEUR) * 100
      ),
      parallel: this.roundTo2Decimals(
        (savings.parallel / internationalPriceEUR) * 100
      ),
    };

    // Évaluation du niveau de risque
    const riskLevel = this.assessRiskLevel(savings, algerianPriceEUR);

    // Génération des recommandations
    const recommendations = this.generateRecommendations(
      savings,
      savingsPercentage,
      riskLevel,
      route
    );

    return {
      route,
      internationalPrice: internationalPriceEUR,
      algerianPriceDZD,
      algerianPriceEUR,
      savings,
      savingsPercentage,
      riskLevel,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Calcule l'arbitrage pour plusieurs routes
   */
  calculateMultipleArbitrages(
    routes: Array<{
      route: string;
      internationalPriceEUR: number;
      algerianPriceDZD: number;
    }>
  ): ArbitrageOpportunity[] {
    return routes.map((route) =>
      this.calculateArbitrage(
        route.route,
        route.internationalPriceEUR,
        route.algerianPriceDZD
      )
    );
  }

  /**
   * Trouve les meilleures opportunités d'arbitrage
   */
  findBestOpportunities(
    opportunities: ArbitrageOpportunity[],
    minSavingsPercentage: number = 10
  ): ArbitrageOpportunity[] {
    return opportunities
      .filter((opp) => opp.savingsPercentage.parallel >= minSavingsPercentage)
      .sort(
        (a, b) => b.savingsPercentage.parallel - a.savingsPercentage.parallel
      );
  }

  /**
   * Calcule l'arbitrage pour votre exemple Paris-Dubai
   */
  calculateParisDubaiArbitrage(): ArbitrageOpportunity {
    return this.calculateArbitrage(
      "CDG-DXB",
      354, // Prix Google Flights
      60455 // Prix Air Algérie en DZD
    );
  }

  /**
   * Met à jour les taux de change
   */
  updateExchangeRates(rates: Partial<ExchangeRates>): void {
    this.exchangeRates = {
      ...this.exchangeRates,
      ...rates,
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtient les taux de change actuels
   */
  getExchangeRates(): ExchangeRates {
    return { ...this.exchangeRates };
  }

  /**
   * Évalue le niveau de risque d'une opportunité
   */
  private assessRiskLevel(
    savings: ArbitrageOpportunity["savings"],
    algerianPriceEUR: ArbitrageOpportunity["algerianPriceEUR"]
  ): ArbitrageOpportunity["riskLevel"] {
    // Risque bas si économies > 20% au taux parallèle
    if (savings.parallel > 0 && savings.parallel > 50) {
      return "LOW";
    }

    // Risque moyen si économies 10-20%
    if (savings.parallel > 0 && savings.parallel > 20) {
      return "MEDIUM";
    }

    // Risque élevé sinon
    return "HIGH";
  }

  /**
   * Génère des recommandations personnalisées
   */
  private generateRecommendations(
    savings: ArbitrageOpportunity["savings"],
    savingsPercentage: ArbitrageOpportunity["savingsPercentage"],
    riskLevel: ArbitrageOpportunity["riskLevel"],
    route: string
  ): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur les économies
    if (savings.parallel > 100) {
      recommendations.push(
        `💰 Opportunité exceptionnelle : ${savings.parallel}€ d'économies (${savingsPercentage.parallel}%)`
      );
    } else if (savings.parallel > 50) {
      recommendations.push(
        `✅ Bonne opportunité : ${savings.parallel}€ d'économies (${savingsPercentage.parallel}%)`
      );
    } else if (savings.parallel > 0) {
      recommendations.push(
        `⚠️ Opportunité limitée : ${savings.parallel}€ d'économies (${savingsPercentage.parallel}%)`
      );
    } else {
      recommendations.push(`❌ Pas d'arbitrage profitable sur cette route`);
    }

    // Recommandations basées sur le niveau de risque
    switch (riskLevel) {
      case "LOW":
        recommendations.push(
          "🟢 Risque faible - Recommandé pour les économies importantes"
        );
        break;
      case "MEDIUM":
        recommendations.push(
          "🟡 Risque modéré - Vérifiez les conditions de visa et de correspondance"
        );
        break;
      case "HIGH":
        recommendations.push(
          "🔴 Risque élevé - Considérez les alternatives directes"
        );
        break;
    }

    // Recommandations spécifiques par route
    if (route.includes("DXB") || route.includes("Dubai")) {
      recommendations.push(
        "🌍 Vérifiez les conditions de visa pour les Émirats Arabes Unis"
      );
      recommendations.push(
        "✈️ Prévoyez un temps de correspondance suffisant à Alger"
      );
    }

    if (route.includes("CDG") || route.includes("Paris")) {
      recommendations.push(
        "🇫🇷 Départ depuis Paris - Vérifiez les horaires de correspondance"
      );
      recommendations.push(
        "🕐 Considérez les vols de nuit pour optimiser le temps de voyage"
      );
    }

    return recommendations;
  }

  /**
   * Arrondit un nombre à 2 décimales
   */
  private roundTo2Decimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Formate un prix en DZD avec séparateurs de milliers
   */
  formatPriceDZD(price: number): string {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Formate un prix en EUR
   */
  formatPriceEUR(price: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }
}
