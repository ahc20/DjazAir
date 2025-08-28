# 🚀 Plan d'Implémentation des Vraies APIs - DjazAir

## 🎯 Objectif

Transformer DjazAir d'une simulation en un **vrai comparateur de vols** qui récupère les prix réels et calcule l'arbitrage "via Alger" avec vos taux de change (150 et 260 DZD/€).

## 🔧 Architecture Actuelle

```
src/server/flightSearch/realFlightSearch.ts
├── searchDirectFlights()     # TODO: APIs réelles
├── searchViaAlgiersFlights() # TODO: Scraping Air Algérie
└── calculateArbitrageOpportunities() # ✅ Implémenté
```

## 📡 APIs à Intégrer

### 1. Vols Directs (International)

#### Google Flights API

- **Endpoint**: `https://www.googleapis.com/qpxExpress/v1/trips/search`
- **Avantages**: Prix réels, couverture mondiale
- **Limitations**: Quota limité, coût par requête
- **Intégration**:
  ```typescript
  // TODO: Remplacer generateMockDirectFlights()
  private async searchGoogleFlights(params: FlightSearchParams) {
    const response = await fetch('https://www.googleapis.com/qpxExpress/v1/trips/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GOOGLE_API_KEY}` },
      body: JSON.stringify({
        request: {
          passengers: { adultCount: params.passengers },
          slice: [{
            origin: params.origin,
            destination: params.destination,
            date: params.departureDate
          }],
          cabin: params.cabinClass
        }
      })
    });
    return this.parseGoogleFlightsResponse(response);
  }
  ```

#### Skyscanner API

- **Endpoint**: `https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create`
- **Avantages**: Gratuit, données riches
- **Limitations**: Délai de réponse, format complexe
- **Intégration**:
  ```typescript
  private async searchSkyscannerFlights(params: FlightSearchParams) {
    // 1. Créer une session de recherche
    const sessionResponse = await fetch('https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create', {
      method: 'POST',
      headers: { 'x-api-key': SKYSCANNER_API_KEY },
      body: JSON.stringify({
        query: {
          market: 'FR',
          locale: 'fr-FR',
          currency: 'EUR',
          queryLegs: [{
            originPlaceId: params.origin,
            destinationPlaceId: params.destination,
            date: params.departureDate
          }],
          adults: params.passengers,
          cabinClass: params.cabinClass
        }
      })
    });

    // 2. Polling des résultats
    const sessionId = sessionResponse.data.sessionToken;
    return this.pollSkyscannerResults(sessionId);
  }
  ```

#### Amadeus API (Déjà configurée)

- **Endpoint**: `/api/search` existant
- **Avantages**: Professionnel, fiable
- **Limitations**: Coût, complexité
- **Intégration**: Utiliser le service existant

### 2. Vols Via Alger (Air Algérie)

#### Scraping Réel d'Air Algérie

- **URL**: `https://www.airalgerie.dz`
- **Technique**: Puppeteer/Playwright
- **Données à extraire**:
  - Prix en DZD
  - Horaires
  - Disponibilité
  - Correspondances

```typescript
// TODO: Remplacer searchAirAlgerieFlights()
private async scrapeAirAlgerieReal(params: FlightSearchParams) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Navigation vers le site
    await page.goto('https://www.airalgerie.dz');

    // 2. Remplir le formulaire de recherche
    await page.type('#origin', params.origin);
    await page.type('#destination', params.destination);
    await page.type('#departureDate', params.departureDate);

    // 3. Lancer la recherche
    await page.click('#searchButton');

    // 4. Attendre les résultats
    await page.waitForSelector('.flight-result', { timeout: 30000 });

    // 5. Extraire les données
    const flights = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.flight-result').forEach(result => {
        const priceDZD = result.querySelector('.price-dzd').textContent;
        const priceEUR = this.convertDZDToEUR(parseInt(priceDZD), 260); // Taux parallèle

        results.push({
          price: { amount: priceEUR, currency: 'EUR' },
          priceDZD: parseInt(priceDZD),
          // ... autres données
        });
      });
      return results;
    });

    return flights;

  } finally {
    await browser.close();
  }
}
```

#### APIs Alternatives pour Air Algérie

- **Travelport**: Si disponible
- **Sabre**: Si disponible
- **Amadeus**: Si Air Algérie est partenaire

## 🔄 Workflow de Recherche Réelle

### 1. Recherche Parallèle

```typescript
async searchRealFlights(params: FlightSearchParams) {
  // Lancer toutes les recherches en parallèle
  const [directResults, viaAlgiersResults] = await Promise.all([
    this.searchDirectFlights(params),
    this.searchViaAlgiersFlights(params)
  ]);

  // Traitement et comparaison
  return this.processResults(directResults, viaAlgiersResults);
}
```

### 2. Gestion des Erreurs et Fallbacks

```typescript
private async searchWithFallback(
  primarySearch: () => Promise<RealFlightOption[]>,
  fallbackSearch: () => Promise<RealFlightOption[]>
) {
  try {
    return await primarySearch();
  } catch (error) {
    console.warn('Recherche principale échouée, utilisation du fallback:', error);
    return await fallbackSearch();
  }
}
```

### 3. Cache et Optimisation

```typescript
private cache = new Map<string, { data: RealFlightOption[], timestamp: number }>();

private async getCachedResults(key: string, ttl: number = 300000) {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
}
```

## 🎨 Interface Utilisateur

### Comparaison Côte à Côte (Déjà Implémentée)

- ✅ Vol Direct vs Via Alger
- ✅ Calcul des économies
- ✅ Évaluation des risques
- ✅ Recommandations

### Améliorations à Apporter

- **Indicateur de fraîcheur des données**
- **Historique des prix**
- **Alertes de prix**
- **Comparaison multi-dates**

## 🚦 Plan de Déploiement Étape par Étape

### Phase 1: Intégration Google Flights (1-2 jours)

1. Obtenir une clé API Google
2. Implémenter `searchGoogleFlights()`
3. Tester avec quelques routes
4. Remplacer `generateMockDirectFlights()`

### Phase 2: Scraping Air Algérie (2-3 jours)

1. Analyser la structure du site Air Algérie
2. Implémenter `scrapeAirAlgerieReal()`
3. Gérer les cas d'erreur et timeouts
4. Tester avec différentes routes

### Phase 3: Intégration Skyscanner (1-2 jours)

1. Obtenir une clé API Skyscanner
2. Implémenter `searchSkyscannerFlights()`
3. Ajouter comme fallback
4. Tests de robustesse

### Phase 4: Optimisation et Monitoring (1-2 jours)

1. Implémenter le cache
2. Ajouter des métriques de performance
3. Monitoring des erreurs d'API
4. Tests de charge

## 🔐 Gestion des Clés API

### Variables d'Environnement

```bash
# .env.local
GOOGLE_FLIGHTS_API_KEY=your_google_api_key
SKYSCANNER_API_KEY=your_skyscanner_api_key
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

### Sécurité

- Clés API stockées côté serveur uniquement
- Rate limiting par IP
- Validation des paramètres d'entrée
- Logs des requêtes pour audit

## 📊 Métriques et Monitoring

### KPIs à Suivre

- **Temps de réponse** des APIs
- **Taux de succès** des recherches
- **Qualité des données** (prix, disponibilité)
- **Utilisation des quotas** API

### Alertes

- Échec de scraping Air Algérie
- Quota API Google dépassé
- Temps de réponse > 10s
- Erreur de conversion de devises

## 🧪 Tests

### Tests Unitaires

```typescript
describe("RealFlightSearch", () => {
  it("should calculate arbitrage opportunities correctly", async () => {
    const search = new RealFlightSearch();
    const results = await search.searchRealFlights(mockParams);
    expect(results.arbitrageOpportunities).toHaveLength(2);
    expect(results.bestOptions.bestArbitrage?.savings).toBeGreaterThan(0);
  });
});
```

### Tests d'Intégration

- Test avec vraies APIs (environnement de staging)
- Test de fallback en cas d'échec
- Test de performance sous charge

### Tests End-to-End

- Scénarios complets de recherche
- Validation des calculs d'arbitrage
- Test de l'interface utilisateur

## 🎯 Résultat Final

### Fonctionnalités

- ✅ **Recherche de vrais prix** depuis Google Flights/Skyscanner
- ✅ **Scraping en temps réel** d'Air Algérie
- ✅ **Calcul d'arbitrage précis** avec vos taux (150/260)
- ✅ **Comparaison côte à côte** comme dans votre interface
- ✅ **Recommandations intelligentes** basées sur les risques

### Performance Cible

- **Temps de recherche**: < 5 secondes
- **Précision des prix**: 95%+
- **Disponibilité**: 99.5%+
- **Couverture**: Routes principales Europe → Moyen-Orient

## 🚀 Prochaines Étapes

1. **Obtenir les clés API** (Google, Skyscanner)
2. **Analyser le site Air Algérie** pour le scraping
3. **Implémenter Google Flights** en premier
4. **Tester avec votre exemple Paris-Dubai**
5. **Déployer progressivement** chaque phase

---

**💡 Note**: Ce plan transforme DjazAir en un vrai comparateur de vols qui respecte votre approche d'arbitrage "via Alger" avec les vrais taux de change que vous avez identifiés.
