# 🎁 Frontend - Système de Recommandation de Produits

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 16+ et npm
- Un navigateur moderne

### Installation & Lancement

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Build de production
npm run build
```

L'application sera accessible sur **http://localhost:5173**

---

## 📋 Fonctionnalités Implémentées

✅ **Page d'accueil** avec recommandations personnalisées  
✅ **Authentification** (connexion/inscription)  
✅ **Catalogue produits** avec recherche et filtres  
✅ **Détails produits** avec avis clients  
✅ **Panier d'achat** avec gestion des quantités  
✅ **Profil utilisateur** et historique de commandes  
✅ **Mode démo** - Fonctionne sans API!  
✅ **Design responsive** avec Tailwind CSS  
✅ **Icônes modernes** avec Lucide React  

---

## 🔧 Configuration API

### Option 1: Avec Backend Laravel ✅ Recommandé

1. **Lancez votre serveur Laravel:**
```bash
cd [votre-projet-laravel]
php artisan serve
```

2. **Assurez-vous que l'API répond sur http://localhost:8000/api**

3. **L'application affichera automatiquement les vraies données**

### Option 2: Mode Démonstration (offline)

Si votre API n'est pas disponible:
- L'application affiche automatiquement des **données de démonstration**
- Une banneau indique "Mode Démonstration"
- Tous les tests d'interface fonctionnent!
- Parfait pour le développement frontend

---

## 📁 Structure du Projet

```
src/
├── components/           # Composants réutilisables
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   ├── ProtectedRoute.tsx
│   ├── APIErrorAlert.tsx
│   └── DemoModeBanner.tsx
│
├── context/             # State management (Auth, Cart)
│   ├── AuthContext.tsx
│   └── CartContext.tsx
│
├── pages/               # Pages principales
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   └── ProfilePage.tsx
│
├── services/            # Appels API et données
│   ├── api.ts
│   └── mockData.ts
│
├── hooks/               # Hooks personnalisés
├── types/               # Types TypeScript
├── utils/               # Utilitaires
└── main.tsx            # Point d'entrée
```

---

## 🔐 Routes & Authentification

### Routes Publiques
- `/` - Accueil
- `/login` - Connexion
- `/register` - Inscription
- `/products` - Catalogue produits
- `/products/:id` - Détail produit

### Routes Protégées (nécessitent une connexion)
- `/cart` - Panier
- `/profile` - Profil utilisateur
- `/checkout` - Paiement (à implémenter)

---

## 🎨 Design & Thème

- **Framework CSS**: Tailwind CSS v4
- **Icônes**: Lucide React
- **Couleurs principais**: 
  - Primaire: Purple-600 (#9333ea)
  - Secondaire: Blue-600 (#2563eb)
  - Accent: Yellow pour les ratings

---

## 🔌 API Endpoints Attendus

### Authentification
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - Utilisateur actuel

### Produits
- `GET /products` - Liste produits (avec filtres)
- `GET /products/:id` - Détail produit
- `GET /recommendations` - Produits recommandés
- `GET /products/:id/recommendations` - Produits similaires

### Avis
- `GET /products/:id/reviews` - Avis produit
- `POST /products/:id/reviews` - Créer avis
- `DELETE /reviews/:id` - Supprimer avis

### Panier
- `GET /cart` - Récupérer panier
- `POST /cart/items` - Ajouter article
- `PUT /cart/items/:id` - Modifier article
- `DELETE /cart/items/:id` - Supprimer article
- `DELETE /cart` - Vider panier

### Profil & Commandes
- `PUT /profile` - Mettre à jour profil
- `GET /orders` - Historique commandes

---

## 📦 Dépendances Principales

```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-router-dom": "^7",
  "axios": "^1.7",
  "tailwindcss": "^4.0",
  "lucide-react": "^latest"
}
```

---

## 🐛 Dépannage

### "Erreur lors du chargement des produits"
- Vérifiez que votre API Laravel est en cours d'exécution
- Assurez-vous qu'elle répond sur `http://localhost:8000/api`
- La page basculera automatiquement en mode démo si l'API n'est pas disponible

### "Pas de données affichées"
- Vérifiez votre connexion Internet
- Regardez la console du navigateur (F12) pour les erreurs
- Vérifiez que votre base de données Laravel a des données

### CORS Errors
- Assurez-vous que votre backend accepte les requêtes du frontend
- Ajoutez à votre Laravel: `'http://localhost:5173'` dans les domaines autorisés

---

## 📝 Prochaines Étapes

1. **Implémentation du Checkout** - Paiement avec Stripe/PayPal
2. **Favoris** - Sauvegarde des produits préférés
3. **Notifications** - Alerts pour les promotions
4. **Dark Mode** - Support du mode sombre
5. **Multilangue** - Support d'autres langues

---

## 👨‍💻 Développement

```bash
# Lancer en développement avec hot reload
npm run dev

# Linter TypeScript & ESLint
npm run lint

# Build de production
npm run build

# Aperçu du build
npm run preview
```

---

## 📄 License

MIT - Libre d'utilisation

---

**Bon développement! 🎉**
