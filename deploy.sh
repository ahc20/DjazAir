#!/bin/bash

# 🚀 Script de déploiement automatique - DjazAir
# Ce script automatise le processus de déploiement

set -e

echo "🚀 Démarrage du déploiement DjazAir..."

# 1. Vérifier que nous sommes sur la branche main
if [[ $(git branch --show-current) != "main" ]]; then
    echo "❌ Erreur: Vous devez être sur la branche main pour déployer"
    exit 1
fi

# 2. Vérifier que le working directory est propre
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Erreur: Il y a des modifications non commitées"
    echo "Commitez d'abord vos modifications:"
    git status
    exit 1
fi

# 3. Pull des dernières modifications
echo "📥 Récupération des dernières modifications..."
git pull origin main

# 4. Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci

# 5. Tests
echo "🧪 Exécution des tests..."
npm run test

# 6. Build de production
echo "🔨 Construction de l'application..."
npm run build

# 7. Lint et format
echo "✨ Vérification du code..."
npm run lint
npm run format

# 8. Push vers GitHub
echo "📤 Push vers GitHub..."
git push origin main

# 9. Déploiement Vercel (si CLI installé)
if command -v vercel &> /dev/null; then
    echo "🚀 Déploiement sur Vercel..."
    vercel --prod --yes
else
    echo "⚠️  Vercel CLI non installé. Déployez manuellement sur vercel.com"
    echo "   Ou installez-le avec: npm i -g vercel"
fi

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Votre application devrait être accessible dans quelques minutes"
echo "📊 Dashboard Vercel: https://vercel.com/dashboard"
