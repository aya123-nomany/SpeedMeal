<div align="center">

# 🍔 SpeedMeal

### Plateforme de livraison de repas en ligne — Maroc

![SpeedMeal Banner](./frontend/src/assets/logo.png)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io)](https://socket.io)

</div>

---

## 📌 Présentation

**SpeedMeal** est une application web full-stack de livraison de repas à domicile, inspirée de plateformes comme Glovo et Uber Eats, adaptée au marché marocain.  
Elle met en relation **clients**, **restaurants**, **livreurs** et un **administrateur** dans un écosystème complet avec suivi en temps réel, système de coupons, groupes de commandes, analytics avancés et bien plus.

---

## 🌐 URL de production

| Service   | URL                                      |
|-----------|------------------------------------------|
| Frontend  | https://speed-meal.vercel.app            |
| Backend   | `http://localhost:5000` (dev local)      |

---

## 🔐 Comptes de démonstration

> Ces comptes sont prêts à l'emploi pour tester toutes les fonctionnalités de la plateforme.

| Rôle          | Email                              | Mot de passe    | Accès                          |
|---------------|------------------------------------|-----------------|--------------------------------|
| 👑 Admin       | *(compte admin)*                   | *(privé)*       | Dashboard admin complet        |
| 🏪 Restaurant  | karim.benali@example.com           | `Medina@2026`   | Dashboard restaurant           |
| 🏍️ Livreur    | imad.khatib.delivery@gmail.com     | `Deliver@2026`  | Dashboard livreur + carte      |
| 👤 Client      | aya.ayaty@gmail.com                | `ayaty123`      | Commande, panier, historique   |

---

## 🏗️ Architecture du projet

```
SpeedMeal/
├── frontend/          # React 19 + Vite (SPA)
│   └── src/
│       ├── pages/     # Toutes les pages (Menu, Dashboard, Admin…)
│       ├── components/# Composants réutilisables
│       ├── context/   # Contextes React (Cart, Auth, Notification)
│       └── services/  # Appels API (OpenMenu, etc.)
│
├── backend/           # Node.js + Express REST API
│   └── src/
│       ├── controllers/  # Logique métier
│       ├── routes/       # 20+ routes API
│       ├── middleware/   # Auth JWT, rôles
│       └── config/       # Connexion MySQL
│
└── forecast-service/  # Microservice Python (prévisions de demande)
    ├── app.py
    └── requirements.txt
```

---

## ✨ Fonctionnalités

### 👤 Côté Client
- 🔐 Inscription / Connexion avec JWT
- 🍽️ Parcourir les restaurants et leurs menus
- 🔍 Recherche et filtrage (catégorie, ville, note)
- 🛒 Panier avec gestion des items
- 📦 Suivi des commandes en temps réel (Socket.io)
- 🗺️ Carte interactive Leaflet (position livreur en live)
- ❤️ Favoris (restaurants et plats)
- 🎟️ Application de coupons de réduction
- 👥 Commandes de groupe (group orders)
- ⭐ Système d'avis et de notes
- 🔔 Notifications en temps réel
- 📍 Gestion des adresses de livraison
- 💳 Paiement via Stripe
- 💬 Chat IA intégré (assistant virtuel)

### 🏪 Côté Restaurant
- 📋 Dashboard de gestion des commandes
- 🍕 Gestion complète du menu (CRUD)
- 📊 Analytics et statistiques de ventes
- 🔔 Notifications de nouvelles commandes
- 🎟️ Création et gestion de coupons
- ⏰ Gestion des horaires d'ouverture
- 💰 Suivi des revenus et commissions
- 🔄 Toggle ouvert / fermé en temps réel

### 🏍️ Côté Livreur
- 🗺️ Carte Leaflet avec géolocalisation GPS live
- 📦 Liste des commandes disponibles à accepter
- 🚦 Statuts de livraison en temps réel
- 💸 Suivi des revenus et historique des livraisons
- ⭐ Avis clients reçus
- 🔔 Notifications de nouvelles missions
- 📱 Toggle disponibilité (actif / inactif)

### 👑 Côté Admin
- 📊 Dashboard analytique complet (stats, graphiques, KPIs)
- 👥 Gestion des utilisateurs (activation, rôles, reset MDP)
- 🏪 Gestion des restaurants (validation, activation/désactivation)
- ✅ Validation des demandes (restaurants + livreurs)
- 🏍️ Gestion des livreurs approuvés
- 📦 Gestion et suivi de toutes les commandes
- ⭐ Modération des avis
- 🎟️ Gestion des coupons globaux
- 💰 Tableau financier et commissions
- 🗺️ Gestion des zones de livraison
- 📣 Système de promotions
- 🤖 Assistant IA intégré (NVIDIA NIM)
- 📥 Export PDF / Excel des rapports
- 🔔 Gestion des réclamations
- ⚙️ Paramètres globaux de la plateforme

---

## 🛠️ Technologies & Bibliothèques

### Frontend

| Technologie         | Version  | Usage                                      |
|---------------------|----------|--------------------------------------------|
| **React**           | 19       | Framework UI                               |
| **Vite**            | 8        | Build tool & dev server                    |
| **React Router DOM**| 7        | Navigation SPA                             |
| **Axios**           | 1.16     | Appels HTTP vers l'API                     |
| **Framer Motion**   | 12       | Animations fluides                         |
| **Lucide React**    | 1.14     | Icônes SVG                                 |
| **Socket.io Client**| 4.8      | Temps réel (commandes, notifications)      |
| **React Leaflet**   | 5        | Cartes interactives                        |
| **Leaflet**         | 1.9      | Moteur cartographique                      |
| **Chart.js**        | 4.5      | Graphiques statistiques                    |
| **React ChartJS 2** | 5.3      | Wrapper React pour Chart.js                |
| **jsPDF**           | 4.2      | Génération de rapports PDF                 |
| **jsPDF AutoTable** | 5        | Tableaux dans les PDFs                     |
| **XLSX**            | 0.18     | Export Excel                               |

### Backend

| Technologie     | Version | Usage                                        |
|-----------------|---------|----------------------------------------------|
| **Node.js**     | —       | Runtime JavaScript serveur                   |
| **Express**     | 5       | Framework REST API                           |
| **MySQL2**      | 3.22    | Base de données relationnelle                |
| **Socket.io**   | 4.8     | WebSockets temps réel                        |
| **JWT**         | 9       | Authentification par token                   |
| **Bcryptjs**    | 3       | Hachage des mots de passe                    |
| **Dotenv**      | 17      | Variables d'environnement                    |
| **Helmet**      | 8       | Sécurité des headers HTTP                    |
| **Morgan**      | 1.10    | Logging des requêtes                         |
| **CORS**        | 2.8     | Gestion des origines cross-domain            |
| **Stripe**      | 22      | Paiement en ligne                            |
| **Twilio**      | 6       | SMS / notifications téléphoniques            |
| **Nodemailer**  | —       | Envoi d'emails (OTP, reset MDP)              |

### Microservice IA / Forecast

| Technologie      | Usage                                      |
|------------------|--------------------------------------------|
| **Python / Flask**| Service de prévision de demande           |
| **NVIDIA NIM**   | LLM pour l'assistant IA admin              |

### Base de données

| Aspect              | Détail                                      |
|---------------------|---------------------------------------------|
| SGBD                | MySQL 8                                     |
| ORM / Driver        | mysql2 (requêtes préparées)                 |
| Auth                | JWT + Bcrypt                                |
| Temps réel          | Socket.io rooms par commande/restaurant     |

---

## 🚀 Lancer le projet en local

### Prérequis
- Node.js ≥ 18
- MySQL 8
- Python 3.9+ (pour le forecast service)

### 1. Backend

```bash
cd backend
npm install
# Configurer .env (DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, ...)
npm start
# API disponible sur http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App disponible sur http://localhost:5173
```

### 3. Forecast Service (optionnel)

```bash
cd forecast-service
pip install -r requirements.txt
python app.py
```

---

## 🔌 API — Endpoints principaux

| Route                        | Description                          |
|------------------------------|--------------------------------------|
| `POST /api/auth/login`       | Connexion                            |
| `POST /api/auth/register`    | Inscription                          |
| `GET  /api/restaurants`      | Liste des restaurants (isVerified)   |
| `GET  /api/restaurants/:id`  | Détails + menu d'un restaurant       |
| `POST /api/orders`           | Créer une commande                   |
| `GET  /api/delivery/available-orders` | Commandes disponibles livreur |
| `GET  /api/admin/stats`      | KPIs admin                           |
| `PUT  /api/admin/pending/restaurants/:id/approve` | Valider restaurant |
| `GET  /api/notifications`    | Notifications utilisateur            |
| `POST /api/ai/chat`          | Chat IA (NVIDIA NIM)                 |

---

## 🔄 Flux des rôles & validation

```
Inscription Restaurant
        ↓
  isVerified = false (en attente)
        ↓
  Admin valide → isVerified = true
        ↓
  Restaurant visible sur le site

Inscription Livreur
        ↓
  isVerified = false (en attente)
        ↓
  Admin valide → isVerified = true
        ↓
  Livreur peut accepter des missions
```

---

## 📁 Variables d'environnement (backend/.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=speedmeal
JWT_SECRET=your_jwt_secret
PORT=5000
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
STRIPE_SECRET_KEY=sk_test_...
TWILIO_SID=...
TWILIO_TOKEN=...
NVIDIA_API_KEY=...
```

---

## 👨‍💻 Développé par

> Projet académique — Plateforme de livraison de repas pour le marché marocain  
> Stack : **React · Node.js · MySQL · Socket.io · Leaflet · Stripe**

---

<div align="center">
  <sub>Built with ❤️ — SpeedMeal © 2026</sub>
</div>
