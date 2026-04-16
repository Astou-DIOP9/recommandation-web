# 🔗 Guide de Configuration - Backend Laravel

## 📋 Prérequis

- PHP 8.1+
- Composer
- SQLite
- Git

---

## 🚀 Démarrage Rapide du Backend

### 1. **Cloner/Créer le projet Laravel**

```bash
# Créer un nouveau projet Laravel
composer create-project laravel/laravel recommandation-api
cd recommandation-api
```

### 2. **Configuration de base**

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé de l'application
php artisan key:generate
```

### 3. **Configuration de la base de données**

Éditez le fichier `.env`:
SQLite:

```env
DB_CONNECTION=sqlite
# Et supprimez les autres variables DB
```

### 4. **Créer les tables**

```bash
php artisan migrate
```

---

## 🗂️ Structure des Tables Requises

### Users (fournie par Laravel)
```sql
id, name, email, email_verified_at, password, created_at, updated_at
```

### Products
```sql
id, title, description, price, discount_price, image, category, rating, reviews_count, in_stock, created_at, updated_at
```

### Reviews
```sql
id, product_id, user_id, rating, comment, created_at, updated_at
```

### Cart Items
```sql
id, user_id, product_id, quantity, created_at, updated_at
```

### Orders
```sql
id, user_id, total, status (pending/completed/cancelled), created_at, updated_at
```

### Order Items
```sql
id, order_id, product_id, quantity, price, created_at, updated_at
```

---

## 🛣️ Routes API Requises

### Authentication
```
POST   /api/auth/login          - Connexion
POST   /api/auth/register       - Inscription
POST   /api/auth/logout         - Déconnexion
GET    /api/auth/me             - Utilisateur actuel
```

### Products
```
GET    /api/products            - Liste (avec filtres: page, per_page, search, category, sort)
GET    /api/products/{id}       - Détail produit
GET    /api/products/{id}/recommendations - Produits similaires
```

### Recommendations
```
GET    /api/recommendations     - Produits recommandés (limit, user_id)
```

### Reviews
```
GET    /api/products/{id}/reviews    - Avis produit (page, per_page)
POST   /api/products/{id}/reviews    - Créer avis {rating, comment}
DELETE /api/reviews/{id}             - Supprimer avis
```

### Cart
```
GET    /api/cart                      - Récupérer panier
POST   /api/cart/items                - Ajouter article {product_id, quantity}
PUT    /api/cart/items/{product_id}   - Modifier quantité {quantity}
DELETE /api/cart/items/{product_id}   - Supprimer article
DELETE /api/cart                      - Vider panier
```

### Profile & Orders
```
PUT    /api/profile              - Mettre à jour profil {name, email}
GET    /api/orders               - Historique commandes (page, per_page)
GET    /api/orders/{id}          - Détail commande
POST   /api/orders               - Créer commande
```

---

## 📦 Seeder de Données

Créez un seeder pour ajouter des données initiales:

```bash
php artisan make:seeder ProductSeeder
php artisan make:seeder UserSeeder
```

### ProductSeeder.php

```php
DB::table('products')->insert([
    [
        'title' => 'Écouteurs Premium Bluetooth',
        'description' => 'Écouteurs sans fil avec réduction de bruit',
        'price' => 150,
        'discount_price' => 99.99,
        'image' => 'https://via.placeholder.com/300',
        'category' => 'Électronique',
        'rating' => 4.8,
        'reviews_count' => 245,
        'in_stock' => true,
    ],
    // ... plus de produits
]);
```

### Exécuter les seeders

```bash
php artisan db:seed
```

---

## 🔐 Configuration CORS

Dans `config/cors.php`, assurez-vous que le frontend est autorisé:

```php
'allowed_origins' => [
    'http://localhost:5173',
    'http://localhost:3000',
],
```

Ou éditez `.env`:

```env
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Démarrer l'API

```bash
php artisan serve
```

L'API sera accessible sur **http://localhost:8000**

Pour tester les routes:
```bash
curl http://localhost:8000/api/products
```

---

## 🔑 Authentification (JWT recommandé)

### Installation de Laravel Sanctum

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### Configurations dans `config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173,127.0.0.1:8000',
    env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

---

## ✅ Checklist de Démarrage

- [ ] PHP 8.1+ installé
- [ ] Composer installé
- [ ] MySQL/MariaDB configuré
- [ ] Projet Laravel créé
- [ ] .env configuré avec DB_*
- [ ] php artisan migrate exécuté
- [ ] Données initiales seedées
- [ ] CORS configuré
- [ ] php artisan serve en cours d'exécution
- [ ] http://localhost:8000/api accessible

---

## 🐛 Dépannage

### Erreur: "Connection refused"
- Vérifiez que MySQL est en cours d'exécution
- Vérifiez les paramètres de connexion dans .env

### Erreur: "No application encryption key has been defined"
- Exécutez: `php artisan key:generate`

### Erreur: "PDOException"
- Vérifiez que la base de données existe
- Exécutez: `php artisan migrate:fresh --seed`

### CORS Error du frontend
- Vérifiez la configuration de CORS dans Laravel
- Vérifiez que le frontend URL est dans la whitelist

---

## 📚 Ressources Utiles

- [Documentation Laravel](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [API RESTful Best Practices](https://restfulapi.net/)

---

**Prêt à développer! 🚀**
