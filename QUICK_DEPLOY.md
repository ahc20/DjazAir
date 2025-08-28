# 🚀 Déploiement Rapide - DjazAir sur Vercel

## ⚡ Déploiement en 5 minutes

### 1. 🌐 Allez sur Vercel

- Ouvrez [https://vercel.com](https://vercel.com)
- Connectez-vous avec votre compte GitHub

### 2. 📥 Importez votre projet

- Cliquez sur **"New Project"**
- Sélectionnez le repository **"ahc20/DjazAir"**
- Cliquez sur **"Import"**

### 3. ⚙️ Configuration automatique

- **Framework Preset** : Next.js (détecté automatiquement)
- **Root Directory** : `./` (laisser par défaut)
- **Build Command** : `npm run build` (automatique)
- **Output Directory** : `.next` (automatique)

### 4. 🔑 Variables d'environnement

Ajoutez ces variables dans l'onglet "Environment Variables" :

```bash
# Obligatoires
NEXT_PUBLIC_APP_NAME=DjazAir
NEXT_PUBLIC_DEFAULT_PARALLEL_RATE_DZD=262
NEXTAUTH_SECRET=votre_secret_aleatoire_ici
NEXTAUTH_URL=https://votre-projet.vercel.app

# APIs (optionnelles pour commencer)
AMADEUS_CLIENT_ID=votre_client_id
AMADEUS_CLIENT_SECRET=votre_client_secret
KIWI_API_KEY=votre_api_key

# Base de données (optionnelle pour commencer)
DATABASE_URL=postgresql://user:pass@host:port/djazair
```

### 5. 🚀 Déployez !

- Cliquez sur **"Deploy"**
- Attendez 2-3 minutes
- Votre app sera en ligne ! 🎉

## 🔗 URLs de votre application

- **Production** : `https://votre-projet.vercel.app`
- **Preview** : `https://votre-projet-git-main-ahc20.vercel.app`
- **Dashboard** : [https://vercel.com/dashboard](https://vercel.com/dashboard)

## ✅ Vérification du déploiement

1. **Page d'accueil** : Formulaire de recherche visible
2. **Avertissements légaux** : Visibles en haut et en bas
3. **Responsive** : Testez sur mobile
4. **Performance** : Vérifiez les scores Lighthouse

## 🚨 En cas de problème

### Erreur de build

- Vérifiez les variables d'environnement
- Regardez les logs dans Vercel Dashboard
- Testez localement : `npm run build`

### Erreur de runtime

- Vérifiez les logs dans Vercel Dashboard
- Testez localement : `npm run dev`
- Vérifiez la console du navigateur

## 🔄 Déploiements automatiques

Avec GitHub Actions configuré, chaque push sur `main` déclenchera automatiquement un nouveau déploiement !

## 📞 Support

- **Documentation** : README.md et DEPLOYMENT.md
- **Issues** : [GitHub Issues](https://github.com/ahc20/DjazAir/issues)
- **Vercel** : [Documentation Vercel](https://vercel.com/docs)

---

**🎯 Objectif** : Application en ligne en moins de 5 minutes !
**✅ Statut** : Prêt pour le déploiement
**🚀 Prochaine étape** : Cliquer sur "Deploy" sur Vercel
