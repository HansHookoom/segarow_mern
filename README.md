# SEGAROW - Site Web Gaming

## 🎮 Description
SEGAROW est un site web moderne dédié au gaming, développé avec la stack MERN (MongoDB, Express.js, React, Node.js). Le site propose des articles, reviews, vidéos et un système d'authentification complet avec support multilingue.

## 🚀 Fonctionnalités

### Frontend (React)
- Interface responsive et moderne avec styled-components
- Système d'authentification complet
- Support multilingue (FR/EN) avec i18next
- Éditeur de contenu riche avec TipTap
- Système de notifications avec react-hot-toast
- Gestion des images et vidéos YouTube
- Interface d'administration

### Backend (Node.js/Express)
- API REST complète avec authentification JWT
- Gestion des fichiers avec GridFS et Sharp
- Base de données MongoDB avec Mongoose
- Système de commentaires et likes
- Service de traduction automatique
- Envoi d'emails avec Nodemailer
- Scripts de maintenance et sécurité



## 🏗️ Structure du projet

```
segarow_mern/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   │   ├── admin/      # Composants d'administration
│   │   │   ├── common/     # Composants communs
│   │   │   ├── ProtectedRoute/ # Route protégée
│   │   │   ├── sections/   # Sections de page
│   │   │   └── ui/         # Composants d'interface
│   │   ├── pages/         # Pages principales
│   │   │   ├── AboutUs/    # Page À propos
│   │   │   ├── ForgotPassword/ # Mot de passe oublié
│   │   │   ├── Home/       # Page d'accueil
│   │   │   ├── LegalNotice/ # Mentions légales
│   │   │   ├── Login/      # Page de connexion
│   │   │   ├── News/       # Page actualités
│   │   │   ├── NotFound/   # Page 404
│   │   │   ├── PrivacyPolicy/ # Politique de confidentialité
│   │   │   ├── Profile/    # Page profil
│   │   │   ├── ResetPassword/ # Réinitialisation mot de passe
│   │   │   ├── Reviews/    # Page reviews
│   │   │   ├── SingleContent/ # Contenu unique
│   │   │   └── Video/      # Page vidéos
│   │   ├── hooks/         # Hooks personnalisés
│   │   │   ├── useApi.js   # Hook API
│   │   │   ├── useAuth.js  # Hook authentification
│   │   │   ├── useDebounce.js # Hook debounce
│   │   │   ├── useInactivityTimeout.js # Timeout inactivité
│   │   │   ├── useLocalStorage.js # Hook localStorage
│   │   │   ├── useNetworkStatus.js # Statut réseau
│   │   │   ├── useServerStatus.js # Statut serveur
│   │   │   ├── useShare.js # Hook partage
│   │   │   └── useToggle.js # Hook toggle
│   │   ├── services/      # Services API
│   │   │   ├── ApiService.js # Service API principal
│   │   │   ├── ArticleService.js # Service articles
│   │   │   ├── AssetService.js # Service assets
│   │   │   ├── ConsoleLogosService.js # Logos consoles
│   │   │   ├── ImageService.js # Service images
│   │   │   ├── LikeService.js # Service likes
│   │   │   ├── ReviewService.js # Service reviews
│   │   │   ├── TranslationService.js # Service traduction
│   │   │   └── YouTubeService.js # Service YouTube
│   │   ├── context/       # Contextes React
│   │   │   └── ThemeContext.jsx # Contexte thème
│   │   ├── config/        # Configuration
│   │   ├── locales/       # Fichiers de traduction
│   │   │   ├── fr/        # Traductions français
│   │   │   │   └── translation.json
│   │   │   └── en/        # Traductions anglais
│   │   │       └── translation.json
│   │   ├── styles/        # Styles globaux
│   │   ├── utils/         # Utilitaires
│   │   └── assets/        # Assets statiques
│   ├── public/            # Assets publics
│   ├── package.json       # Dépendances frontend
│   └── README.md          # Documentation frontend
└── server/                # Backend Node.js
    ├── controllers/       # Contrôleurs
    │   ├── adminController.js # Contrôleur admin
    │   ├── articleController.js # Contrôleur articles
    │   ├── authController.js # Contrôleur authentification
    │   ├── commentController.js # Contrôleur commentaires
    │   ├── imageController.js # Contrôleur images
    │   ├── likeController.js # Contrôleur likes
    │   └── reviewController.js # Contrôleur reviews
    ├── models/           # Modèles MongoDB
    │   ├── Article.js    # Modèle article
    │   ├── Comment.js    # Modèle commentaire
    │   ├── Like.js       # Modèle like
    │   ├── Log.js        # Modèle log
    │   ├── Review.js     # Modèle review
    │   └── User.js       # Modèle utilisateur
    ├── routes/           # Routes API
    │   ├── adminRoutes.js # Routes administration
    │   ├── articleRoutes.js # Routes articles
    │   ├── authRoutes.js # Routes authentification
    │   ├── commentRoutes.js # Routes commentaires
    │   ├── imageRoutes.js # Routes images
    │   ├── likeRoutes.js # Routes likes
    │   ├── reviewRoutes.js # Routes reviews
    │   └── translationRoutes.js # Routes traduction
    ├── middleware/       # Middlewares
    │   ├── auth.js       # Middleware authentification
    │   └── security.js   # Middleware sécurité
    ├── services/         # Services métier
    │   ├── autoCleanupService.js # Service nettoyage auto
    │   ├── mongoLogService.js # Service logs MongoDB
    │   └── translationService.js # Service traduction
    ├── config/           # Configuration
    ├── scripts/          # Scripts utilitaires
    │   ├── cleanupInactiveAccounts.js # Nettoyage comptes
    │   └── securityAudit.js # Audit sécurité
    ├── app.js            # Configuration Express
    ├── server.js         # Point d'entrée serveur
    ├── package.json      # Dépendances backend
    └── README.md         # Documentation backend
```

## 🔧 Scripts disponibles

### Backend
- `npm start` : Lance le serveur en production
- `npm run dev` : Lance le serveur en mode développement avec nodemon
- `npm run cleanup` : Nettoie les comptes inactifs
- `npm run security:audit` : Audit de sécurité

### Frontend
- `npm start` : Lance l'application React
- `npm run build` : Build de production
- `npm test` : Lance les tests

## 🛡️ Sécurité

- Variables d'environnement pour les secrets
- Authentification JWT avec bcryptjs
- Validation des données avec Joi
- Rate limiting avec express-rate-limit
- Headers de sécurité avec Helmet
- Protection CORS configurée
- Scripts de nettoyage automatique

## 🌐 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/forgot-password` - Mot de passe oublié

### Articles & Reviews
- `GET /api/articles` - Liste des articles
- `POST /api/articles` - Créer un article
- `GET /api/reviews` - Liste des reviews

### Commentaires & Likes
- `POST /api/comments` - Ajouter un commentaire
- `POST /api/likes` - Gérer les likes

### Administration
- `GET /api/admin/users` - Gestion des utilisateurs
- `POST /api/admin/cleanup` - Nettoyage des comptes

### Traduction
- `POST /api/translate` - Service de traduction

## 📝 Auteur
**Hookoom Hans** - Étudiant à EPITA

## 📄 Licence
Ce projet est développé pour la communauté SEGAROW.

---