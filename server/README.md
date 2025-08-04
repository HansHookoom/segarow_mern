# Segarow - Backend (API Node.js / MongoDB)

## Nom Prénom
Hookoom Hans

---

## Liste des fonctionnalités

- Routes CRUD pour articles, reviews, commentaires, images, likes, users
- Structure MVC (dossiers `controllers/`, `models/`, `middleware/`)
- Authentification JWT (création, vérification, middleware de protection)
- Routes protégées par middleware JWT
- Base MongoDB (connexion centralisée, modèles Mongoose)
- Vérification des champs (types, required, etc. dans Mongoose)
- Validation avancée avec Joi sur tous les endpoints sensibles
- Codes status HTTP adéquats (200, 201, 400, 401, 403, 404, 500…)

---

## Structure du dossier /server/

- `controllers/` : Logique métier (CRUD, auth…)
- `models/` : Schémas Mongoose pour chaque entité
- `routes/` : Définition des endpoints
- `middleware/` : Authentification, gestion des erreurs
- `config/` : Connexion à la base MongoDB

---