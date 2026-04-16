# Utilise Node.js 22 comme base
FROM node:22

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port utilisé par Vite
EXPOSE 3000

# Lancer le serveur Vite
CMD ["npm", "run", "dev", "--", "--host"]
