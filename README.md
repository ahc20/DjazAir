# DjazAir - Simulateur d'Arbitrage Aérien

## 🎯 Vue d'ensemble

**DjazAir** est une application web de simulation d'arbitrage aérien qui compare les prix des vols directs avec des options "via Alger" pour identifier les meilleures opportunités d'économies.

### ⚖️ Conformité Légale

**IMPORTANT** : Cette application respecte strictement la réglementation française et européenne :

- ✅ **Aucun achat de billet en dinars algériens**
- ✅ **Aucune opération de change facilitée**
- ✅ **Uniquement des simulations informatiques**
- ✅ **Redirection vers des canaux officiels**
- ✅ **Avertissements légaux clairs et visibles**

L'application est un **outil d'information et de comparaison** à des fins éducatives uniquement.

## 🚀 Fonctionnalités

### ✈️ Recherche de vols
- Recherche multi-critères (origine, destination, dates, passagers, classe)
- Autocomplétion des codes IATA
- Validation des données en temps réel

### 💰 Simulation d'arbitrage
- Comparaison prix direct vs "via Alger"
- Calculs automatiques avec différents taux de change
- Évaluation des risques et avertissements

### 🔧 Administration
- Configuration des taux de change custom
- Gestion des hypothèses de prix local
- Paramètres de sécurité et de conformité

### 🛡️ Sécurité et transparence
- Avertissements légaux sur toutes les pages
- Traçabilité des modifications administratives
- Validation stricte des entrées utilisateur

## 🛠️ Stack Technique

### Frontend
- **Next.js 14** avec App Router
- **TypeScript** strict
- **Tailwind CSS** + **shadcn/ui**
- **React Hook Form** + **Zod** pour la validation

### Backend
- **Server Actions** Next.js
- **Prisma** ORM
- **PostgreSQL** (SQLite en développement)

### APIs
- **Amadeus Self-Service API** (principal)
- **Kiwi Tequila API** (fallback)
- **exchangerate.host** (taux officiels BCE)

### Tests & Qualité
- **Vitest** pour les tests unitaires
- **ESLint** + **Prettier** pour le code
- **Husky** + **lint-staged** pour les hooks Git

## 📋 Prérequis

- **Node.js** 18+ 
- **npm** ou **yarn**
- **PostgreSQL** (ou SQLite pour le développement)
- **Comptes API** :
  - [Amadeus Developer](https://developers.amadeus.com/)
  - [Kiwi Tequila](https://tequila.kiwi.com/portal)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd djazair
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration de l'environnement

Créer un fichier `.env.local` basé sur `env.example` :

```bash
cp env.example .env.local
```

Configurer les variables :

```env
# Application
NEXT_PUBLIC_APP_NAME=ViaAlger
NEXT_PUBLIC_DEFAULT_PARALLEL_RATE_DZD=262

# APIs de vols
AMAD_CLIENT_ID=votre_client_id_amadeus
AMAD_CLIENT_SECRET=votre_client_secret_amadeus
KIWI_API_KEY=votre_api_key_kiwi

# Taux de change
EXCHANGE_BASE_URL=https://api.exchangerate.host

# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/djazair"
# ou pour SQLite en dev :
# DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET=votre_secret_nextauth
NEXTAUTH_URL=http://localhost:3000
```

### 4. Configuration de la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer/mettre à jour la base
npm run db:push

# Ou créer une migration
npm run db:migrate
```

### 5. Lancer l'application

```bash
# Mode développement
npm run dev

# Build de production
npm run build
npm start
```

## 🧪 Tests

### Lancer les tests

```bash
# Tests en mode watch
npm test

# Tests avec interface graphique
npm run test:ui

# Tests avec couverture
npm run test:coverage
```

### Structure des tests

```
tests/
├── setup.ts              # Configuration globale
└── arbitrage.spec.ts     # Tests des fonctions d'arbitrage
```

## 🏗️ Architecture

### Structure des dossiers

```
src/
├── app/                  # Pages Next.js (App Router)
│   ├── (public)/        # Pages publiques
│   ├── admin/           # Pages d'administration
│   ├── search/          # Pages de recherche
│   ├── globals.css      # Styles globaux
│   └── layout.tsx       # Layout principal
├── components/           # Composants React
│   ├── ui/              # Composants UI de base
│   ├── admin/           # Composants d'administration
│   └── *.tsx            # Composants métier
├── lib/                  # Utilitaires et helpers
├── server/               # Logique serveur
│   ├── flightProviders/ # Fournisseurs de vols
│   ├── rates/           # Gestion des taux de change
│   └── arbitrage/       # Calculs d'arbitrage
└── types/                # Types TypeScript
```

### Flux de données

1. **Recherche utilisateur** → Validation Zod
2. **Appel API** → Amadeus (fallback Kiwi)
3. **Calcul arbitrage** → Fonctions pures
4. **Affichage résultats** → Composants React
5. **Redirection** → Sites officiels

## 🔌 APIs et Intégrations

### Amadeus Self-Service API

```typescript
// Configuration
const amadeus = new AmadeusProvider();

// Recherche
const results = await amadeus.searchRoundTrip({
  origin: 'CDG',
  destination: 'DXB',
  departDate: '2025-01-15',
  adults: 1,
  currency: 'EUR'
});
```

### Kiwi Tequila API (Fallback)

```typescript
// Utilisation automatique si Amadeus échoue
const kiwi = new KiwiProvider();
const results = await kiwi.searchRoundTrip(params);
```

### Taux de change

```typescript
// Taux officiel BCE
const official = await exchangeService.getOfficialRateEURtoDZD();

// Taux custom admin
const custom = await exchangeService.getCustomRate();
```

## 🎨 Composants UI

### Composants de base (shadcn/ui)
- `Button` - Boutons avec variantes
- `Input` - Champs de saisie
- `Card` - Cartes de contenu
- `Select` - Sélecteurs

### Composants métier
- `SearchForm` - Formulaire de recherche
- `DealCard` - Affichage des résultats
- `RateSelector` - Choix du taux de change
- `LegalDisclaimer` - Avertissements légaux

## 🔒 Sécurité et Conformité

### Mesures de sécurité
- Validation stricte des entrées (Zod)
- Sanitisation des données
- Protection CSRF (Next.js)
- Rate limiting (à implémenter)

### Conformité légale
- Avertissements visibles sur toutes les pages
- Métadonnées de conformité
- Traçabilité des actions administratives
- Respect des réglementations européennes

## 🚀 Déploiement

### Vercel (Recommandé)

1. **Connecter le repository**
2. **Configurer les variables d'environnement**
3. **Déployer automatiquement**

```bash
# Variables d'environnement Vercel
AMAD_CLIENT_ID=xxx
AMAD_CLIENT_SECRET=xxx
KIWI_API_KEY=xxx
DATABASE_URL=xxx
NEXTAUTH_SECRET=xxx
```

### Docker (Alternative)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Variables d'environnement de production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/viaalger
NEXTAUTH_URL=https://votre-domaine.com
```

## 📊 Monitoring et Logs

### Logs applicatifs
- Erreurs API et calculs
- Actions administratives
- Métriques de performance

### Monitoring
- Santé des APIs externes
- Temps de réponse
- Taux d'erreur

## 🔧 Maintenance

### Tâches régulières
- Mise à jour des taux de change
- Vérification des APIs
- Sauvegarde de la base de données
- Mise à jour des dépendances

### Commandes utiles

```bash
# Mise à jour des dépendances
npm update

# Audit de sécurité
npm audit

# Nettoyage du cache
npm run clean

# Regénération Prisma
npm run db:generate
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de base de données**
   ```bash
   npm run db:generate
   npm run db:push
   ```

2. **Erreur d'API Amadeus**
   - Vérifier les credentials
   - Vérifier les quotas
   - Utiliser le fallback Kiwi

3. **Erreur de build**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

## 📚 Documentation API

### Endpoints internes

- `POST /api/search` - Recherche de vols
- `GET /api/rates` - Taux de change
- `POST /api/admin/config` - Configuration admin

### Schémas de validation

Voir `src/lib/zod.ts` pour tous les schémas de validation.

## 🤝 Contribution

### Standards de code
- TypeScript strict
- ESLint + Prettier
- Tests unitaires obligatoires
- Documentation des composants

### Processus
1. Fork du repository
2. Création d'une branche feature
3. Tests et validation
4. Pull Request avec description détaillée

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## ⚠️ Avertissement Légal

**DjazAir** est un simulateur d'arbitrage aérien à des fins d'information uniquement. L'application :

- Ne vend aucun billet d'avion
- Ne facilite aucune opération de change
- Ne garantit aucun prix ou disponibilité
- Fournit uniquement des simulations basées sur des hypothèses

Les utilisateurs sont responsables de :
- Vérifier les conditions de visa
- Évaluer les risques de correspondance
- Effectuer leurs réservations via des canaux officiels
- Respecter la réglementation applicable

## 📞 Support

Pour toute question ou problème :
- Issues GitHub
- Documentation technique
- Support développeur

---

**DjazAir** - Simulateur d'Arbitrage Aérien 100% Légal et Conforme
