# 🚀 Guide de Déploiement - DjazAir

## Déploiement sur Vercel

### 1. Prérequis
- Compte GitHub
- Compte Vercel (gratuit)
- Variables d'environnement configurées

### 2. Étapes de déploiement

#### Option A: Déploiement automatique via GitHub
1. Créez un repository GitHub : `https://github.com/votre-username/djazair`
2. Connectez votre compte GitHub à Vercel
3. Importez le repository dans Vercel
4. Configurez les variables d'environnement
5. Déployez !

#### Option B: Déploiement manuel
1. Installez Vercel CLI : `npm i -g vercel`
2. Connectez-vous : `vercel login`
3. Déployez : `vercel --prod`

### 3. Variables d'environnement requises

```bash
# Base
NEXT_PUBLIC_APP_NAME=DjazAir
NEXT_PUBLIC_DEFAULT_PARALLEL_RATE_DZD=262

# APIs
AMADEUS_CLIENT_ID=votre_client_id
AMADEUS_CLIENT_SECRET=votre_client_secret
KIWI_API_KEY=votre_api_key

# Base de données
DATABASE_URL=postgresql://user:pass@host:port/djazair

# NextAuth
NEXTAUTH_SECRET=votre_secret_aleatoire
NEXTAUTH_URL=https://votre-domaine.vercel.app

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
```

### 4. Configuration de la base de données

1. **Développement local** : SQLite (automatique)
2. **Production** : PostgreSQL sur Vercel ou service externe
3. **Migrations** : `npx prisma migrate deploy`

### 5. Commandes utiles

```bash
# Build local
npm run build

# Test local
npm run test

# Lint et format
npm run lint
npm run format

# Base de données
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 6. Monitoring et maintenance

- **Logs** : Vercel Dashboard > Functions
- **Performance** : Vercel Analytics
- **Erreurs** : Sentry ou Vercel Error Tracking
- **Base de données** : Prisma Studio ou interface externe

### 7. Sécurité

✅ **Conformité légale** : Avertissements visibles partout
✅ **Validation** : Zod + TypeScript strict
✅ **Authentification** : NextAuth avec rôles
✅ **API** : Rate limiting + validation des entrées
✅ **Variables d'environnement** : Aucune clé exposée

### 8. Support

- **Documentation** : README.md
- **Issues** : GitHub Issues
- **Tests** : `npm run test:coverage`

---

**⚠️ Important** : Cette application est 100% légale et ne vend aucun billet. Elle fournit uniquement des simulations et des informations pour l'arbitrage aérien.
