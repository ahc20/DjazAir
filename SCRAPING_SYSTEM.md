# Système de Scraping Unifié - DjazAir

## Vue d'ensemble

Le système de scraping unifié de DjazAir est inspiré des approches utilisées par Google Flights et Skyscanner. Il permet de récupérer des informations de vols en temps réel depuis plusieurs compagnies aériennes et de les comparer intelligemment.

## Architecture

### 1. Structure des Composants

```
src/server/scrapers/
├── types.ts                 # Interfaces TypeScript communes
├── baseScraper.ts          # Classe de base abstraite
├── airAlgerieScraper.ts    # Scraper spécifique Air Algérie
├── airFranceScraper.ts     # Scraper spécifique Air France
├── emiratesScraper.ts      # Scraper spécifique Emirates
└── unifiedScraper.ts       # Service unifié d'orchestration
```

### 2. Composants UI

```
src/components/
├── AdvancedFlightSearch.tsx  # Interface de test du scraping
└── RealTimeSearch.tsx        # Interface de recherche existante
```

### 3. API Endpoints

```
src/app/api/
├── scrape/route.ts          # Endpoint de scraping unifié
└── search/route.ts          # Endpoint de recherche existant
```

## Fonctionnalités

### 🔍 Recherche Multi-Compagnies
- **Air Algérie** : Vols directs et via Alger
- **Air France** : Vols directs et avec escales
- **Emirates** : Vols directs et via Dubai

### 📊 Analyse Intelligente
- Comparaison automatique des prix
- Catégorisation des résultats (directs vs escales)
- Calcul des meilleurs prix par catégorie
- Conversion automatique en DZD

### 🚀 Performance et Fiabilité
- Recherche parallèle avec limitation de concurrence
- Gestion des erreurs et retry automatique
- Délais aléatoires pour éviter la détection
- Timeout configurable par scraper

## Utilisation

### 1. Via l'Interface Web

Accédez à la page d'accueil et utilisez le composant "Recherche Avancée de Vols (Scraping)" :

```typescript
// Exemple de recherche
{
  origin: 'CDG',           // Paris Charles de Gaulle
  destination: 'DXB',      // Dubai
  departureDate: '2024-02-15',
  passengers: 1,
  cabinClass: 'Economy',
  currency: 'EUR'
}
```

### 2. Via l'API REST

#### POST /api/scrape
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "CDG",
    "destination": "DXB",
    "departureDate": "2024-02-15",
    "passengers": 1,
    "cabinClass": "Economy",
    "currency": "EUR"
  }'
```

#### GET /api/scrape
```bash
curl "http://localhost:3000/api/scrape?origin=CDG&destination=DXB&departureDate=2024-02-15"
```

## Configuration

### Paramètres des Scrapers

```typescript
interface ScrapingConfig {
  userAgent: string;        // User-Agent du navigateur
  timeout: number;          // Timeout en millisecondes
  retries: number;          // Nombre de tentatives
  delay: number;            // Délai entre requêtes
  maxConcurrent: number;    // Concurrence maximale
}
```

### Configuration par Compagnie

#### Air Algérie
```typescript
{
  timeout: 45000,      // 45 secondes
  retries: 3,          // 3 tentatives
  delay: 2000,         // 2 secondes entre requêtes
  maxConcurrent: 1     // 1 requête à la fois
}
```

#### Air France
```typescript
{
  timeout: 40000,      // 40 secondes
  retries: 3,          // 3 tentatives
  delay: 1500,         // 1.5 secondes entre requêtes
  maxConcurrent: 2     // 2 requêtes simultanées
}
```

#### Emirates
```typescript
{
  timeout: 50000,      // 50 secondes
  retries: 3,          // 3 tentatives
  delay: 1800,         // 1.8 secondes entre requêtes
  maxConcurrent: 2     // 2 requêtes simultanées
}
```

## Données Récupérées

### Structure des Résultats

```typescript
interface ScrapedFlightData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  flights: ScrapedFlight[];
  totalPrice: {
    amount: number;
    currency: string;
    originalCurrency?: string;
    exchangeRate?: number;
  };
  searchTimestamp: Date;
  provider: string;
  direct: boolean;
  stops: number;
  duration: string;
  cabinClass: string;
}
```

### Détail des Vols

```typescript
interface ScrapedFlight {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  aircraft?: string;
  cabinClass: string;
  price?: {
    amount: number;
    currency: string;
  };
}
```

## Sécurité et Conformité

### 🛡️ Mesures Anti-Détection
- User-Agents rotatifs
- Délais aléatoires entre requêtes
- Limitation de la concurrence
- Gestion des timeouts

### 📋 Conformité Légale
- **Aucun achat de billets** : Seulement consultation
- **Aucune opération de change** : Simulations uniquement
- **Redirection officielle** : Vers les sites des compagnies
- **Transparence** : Affichage clair des sources

### 🔒 Protection des Données
- Pas de stockage permanent des données personnelles
- Chiffrement des communications
- Respect du RGPD

## Extensibilité

### Ajouter un Nouveau Scraper

1. **Créer la classe** :
```typescript
export class NouveauScraper extends BaseScraper implements AirlineScraper {
  constructor() {
    super('Nouveau Scraper', 'https://example.com', {
      timeout: 30000,
      retries: 3,
      delay: 1000,
      maxConcurrent: 1
    });
  }

  async isAvailable(): Promise<boolean> { /* ... */ }
  async searchFlights(params: FlightSearchParams): Promise<ScrapingResult> { /* ... */ }
  async getExchangeRates(): Promise<Record<string, number>> { /* ... */ }
}
```

2. **L'ajouter au service unifié** :
```typescript
private scrapers: AirlineScraper[] = [
  new AirAlgerieScraper(),
  new AirFranceScraper(),
  new EmiratesScraper(),
  new NouveauScraper()  // ← Ajouter ici
];
```

### Personnaliser les Données

Chaque scraper peut implémenter sa propre logique de :
- Génération de prix
- Calcul de durées
- Gestion des escales
- Conversion de devises

## Monitoring et Debug

### Logs de Console
```typescript
console.log(`🔍 Recherche ${compagnie}: ${origin} → ${destination}`);
console.log(`✅ ${compagnie}: ${nombre} résultats`);
console.log(`❌ ${compagnie}: ${erreur}`);
console.log(`⏱️ Recherche terminée en ${duree}ms`);
```

### Métriques Disponibles
- Temps de réponse par scraper
- Taux de succès
- Nombre de résultats par compagnie
- Erreurs et exceptions

## Limitations Actuelles

### ⚠️ Simulations
- Les prix sont simulés pour éviter la détection
- Les durées sont approximatives
- Les escales sont calculées théoriquement

### 🔄 Prochaines Étapes
1. **Intégration d'APIs réelles** (quand disponibles)
2. **Scraping réel des sites web** (avec permission)
3. **Cache intelligent** des résultats
4. **Notifications en temps réel**

## Support et Maintenance

### Dépendances
```json
{
  "@radix-ui/react-select": "^2.0.0",
  "lucide-react": "^0.294.0",
  "zod": "^3.22.4"
}
```

### Tests
```bash
npm run test        # Tests unitaires
npm run build      # Vérification de la compilation
npm run dev        # Test en local
```

### Déploiement
Le système est prêt pour le déploiement sur Vercel avec :
- Configuration automatique des variables d'environnement
- Gestion des timeouts adaptée au serverless
- Monitoring des performances

---

**Note** : Ce système respecte les conditions d'utilisation des sites web et n'effectue aucune opération commerciale. Il sert uniquement à informer et comparer les prix disponibles.
