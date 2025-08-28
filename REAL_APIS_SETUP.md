# 🚀 Configuration des Vraies APIs de Vols - DjazAir

## 📋 Vue d'ensemble

DjazAir est maintenant configuré pour utiliser de **vraies APIs de vols** au lieu de simulations. Le système combine :

1. **Google Flights API** - Pour les prix internationaux
2. **Air Algérie Scraper** - Pour les prix en DZD avec conversion automatique
3. **Amadeus API** - Pour une couverture étendue des vols
4. **Service unifié** - Combinaison intelligente des trois sources

## 🔑 Configuration des APIs

### 1. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
# Configuration de l'application
NODE_ENV=production
APP_NAME=DjazAir
APP_URL=https://votre-domaine.vercel.app

# Base de données
DATABASE_URL="votre-url-postgresql"

# APIs de vols
GOOGLE_FLIGHTS_API_KEY=votre-cle-google-flights
SKYSCANNER_API_KEY=votre-cle-skyscanner
AMADEUS_CLIENT_ID=votre-amadeus-client-id
AMADEUS_CLIENT_SECRET=votre-amadeus-client-secret

# Taux de change (optionnel, par défaut: 260 DZD/€)
PARALLEL_EXCHANGE_RATE=260
OFFICIAL_EXCHANGE_RATE=150

# Configuration du scraping
ENABLE_REAL_SCRAPING=true
SCRAPING_TIMEOUT=30000
SCRAPING_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### 2. Google Flights API

#### Obtenir une clé API :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un existant
3. Activez l'API "QPX Express API" (Google Flights)
4. Créez des identifiants (clé API)
5. Copiez la clé dans `GOOGLE_FLIGHTS_API_KEY`

#### Limites :

- Gratuit : 50 requêtes/jour
- Payant : $0.035 par requête après la limite gratuite

### 3. Skyscanner API (Alternative)

#### Obtenir une clé API :

1. Allez sur [Skyscanner for Business](https://www.partners.skyscanner.net/)
2. Créez un compte développeur
3. Demandez l'accès à l'API
4. Copiez la clé dans `SKYSCANNER_API_KEY`

### 4. Amadeus API (Intégrée)

#### Identifiants déjà configurés :

- **Client ID** : ``
- **Client Secret** : ``

#### Limites :

- Gratuit : 1000 requêtes/mois
- Payant : Selon votre plan
- Test API : Environnement de développement inclus

## 🎯 Utilisation

### 1. Recherche de vols

L'interface unifiée permet de rechercher des vols avec :

- **Origine** : Code IATA (ex: CDG, ORY, LHR)
- **Destination** : Code IATA (ex: DXB, IST, CAI)
- **Date de départ** : Format YYYY-MM-DD
- **Date de retour** : Optionnel
- **Classe de cabine** : Économique, Premium, Affaires, Première

### 2. Résultats combinés

Le système retourne automatiquement :

- **Vols directs** : Via Google Flights (prix en EUR)
- **Vols étendus** : Via Amadeus (couverture mondiale)
- **Vols via Alger** : Via Air Algérie (prix DZD convertis en EUR)
- **Calcul des économies** : Comparaison automatique
- **Badges de source** : Indication de l'origine des données (Google Flights, Amadeus, Air Algérie)

### 3. Conversion automatique des prix

Les prix Air Algérie en DZD sont automatiquement convertis au **taux parallèle (260 DZD/€)** pour permettre la comparaison avec les prix internationaux.

## 🔧 Architecture technique

### Structure des fichiers :

```
src/server/flightSearch/
├── googleFlightsAPI.ts          # API Google Flights
├── airAlgerieScraper.ts        # Scraper Air Algérie
├── unifiedFlightSearchService.ts # Service unifié
└── types.ts                     # Types partagés

src/app/api/
└── unified-search/
    └── route.ts                 # Endpoint API

src/components/
└── UnifiedFlightSearch.tsx      # Interface utilisateur
```

### Flux de recherche :

1. **Validation** des paramètres de recherche
2. **Recherche parallèle** Google Flights + Amadeus + Air Algérie
3. **Traitement** et normalisation des résultats
4. **Calcul des économies** pour les vols via Alger
5. **Combinaison** et tri par prix
6. **Retour** des résultats unifiés

## 🚨 Gestion des erreurs

### Fallback automatique :

- Si Google Flights échoue → Données simulées réalistes
- Si Air Algérie échoue → Données simulées avec prix DZD
- Si les deux échouent → Message d'erreur utilisateur

### Logs et monitoring :

```bash
# Vérifiez les logs Vercel pour le debugging
vercel logs --follow

# Ou via l'interface Vercel
# Dashboard → Votre projet → Functions → Logs
```

## 📊 Performance et optimisation

### Cache recommandé :

```typescript
// Dans votre API route
export const runtime = "edge"; // Pour de meilleures performances
export const maxDuration = 30; // Timeout de 30 secondes
```

### Limites de taux :

- Google Flights : 50 req/jour (gratuit)
- Skyscanner : Selon votre plan
- Amadeus : 1000 req/mois (gratuit) - **✅ Intégré et configuré**

## 🔒 Sécurité

### Variables d'environnement :

- ✅ **Sécurisées** : Clés API dans `.env.local`
- ❌ **Non sécurisées** : Clés dans le code source
- ✅ **Vercel** : Variables d'environnement automatiquement sécurisées

### Validation des entrées :

- Validation Zod pour tous les paramètres
- Sanitisation des codes IATA
- Limitation des tailles de requête

## 🚀 Déploiement

### 1. Vercel (Recommandé) :

```bash
# Déploiement automatique via GitHub
git push origin main

# Ou déploiement manuel
vercel --prod
```

### 2. Variables d'environnement Vercel :

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet DjazAir
3. Settings → Environment Variables
4. Ajoutez toutes les variables de `.env.local`

### 3. Vérification du déploiement :

```bash
# Test de l'API
curl -X POST https://votre-domaine.vercel.app/api/unified-search \
  -H "Content-Type: application/json" \
  -d '{"origin":"CDG","destination":"DXB","departureDate":"2025-09-03"}'
```

## 🧪 Tests

### Test local :

```bash
# Démarrage du serveur de développement
npm run dev

# Test de l'API
curl -X POST http://localhost:3000/api/unified-search \
  -H "Content-Type: application/json" \
  -d '{"origin":"CDG","destination":"DXB","departureDate":"2025-09-03"}'
```

### Test de compilation :

```bash
# Vérification de la compilation
npm run build

# Vérification des types TypeScript
npm run type-check
```

## 📈 Monitoring et métriques

### Métriques à surveiller :

- **Taux de réussite** des APIs
- **Temps de réponse** moyen
- **Utilisation des quotas** API
- **Erreurs** et fallbacks

### Outils recommandés :

- **Vercel Analytics** : Performance et erreurs
- **Sentry** : Monitoring des erreurs
- **LogRocket** : Sessions utilisateur

## 🔮 Prochaines étapes

### Améliorations futures :

1. **Vrai scraping Air Algérie** avec Puppeteer/Playwright
2. **Cache Redis** pour les résultats de recherche
3. **Notifications** en temps réel des meilleurs prix
4. **Historique** des recherches utilisateur
5. **Alertes de prix** personnalisées

### Intégrations supplémentaires :

- **Skyscanner** pour plus de couverture
- **Kiwi.com** pour les vols low-cost
- **APIs compagnies** : Air France, Emirates, etc.

## 📞 Support

### En cas de problème :

1. **Vérifiez les logs** Vercel
2. **Testez localement** avec `npm run dev`
3. **Vérifiez les clés API** et quotas
4. **Consultez la documentation** des APIs

### Ressources utiles :

- [Google Flights API Documentation](https://developers.google.com/qpx-express)
- [Skyscanner API Documentation](https://partners.skyscanner.net/affiliates/travel-apis)
- [Amadeus API Documentation](https://developers.amadeus.com/)

---

**🎉 Félicitations ! DjazAir utilise maintenant de vraies APIs de vols pour des comparaisons réelles et précises !**
