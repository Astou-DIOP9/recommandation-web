# Recommandation Web (Frontend)

Frontend React + TypeScript pour un systeme de recommandation produit/article.

## Prerequis

- Node.js 20+
- Backend Laravel demarre (par defaut sur http://localhost:8000)

## Installation

```bash
npm install
```

## Configuration API

Le frontend utilise la variable Vite suivante:

- VITE_API_URL

Creer un fichier .env a la racine:

```env
VITE_API_URL=http://localhost:8000/api
```

## Lancer le projet

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Notes d integration backend

- Le service API normalise les reponses Laravel paginees (data, total, last_page)
- Le panier supporte les formats reponse directs et enveloppes dans data
- Les recommandations supportent les deux formats:
  - Liste de recommandations avec product
  - Liste directe de produits

## Devises

- Devises disponibles: EUR, USD, GBP, CAD, JPY, XOF
- La devise selectionnee est sauvegardee dans localStorage
- Si aucune devise n est deja sauvegardee, le frontend detecte une devise par region navigateur
