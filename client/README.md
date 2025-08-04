## Nom Prénom
Hookoom Hans

---

## Liste des fonctionnalités

- Routage avec `react-router-dom` (navigation multi-pages)
- Responsive (Mobile First)
- Authentification complète (inscription, connexion, déconnexion)
- Routes protégées selon le rôle de l’utilisateur
- CSS classique (modules CSS, aucune librairie externe)
- Structure claire et découpée (components, pages, hooks, context, services)
- Code moderne (ES6+, hooks, context, arrow functions, destructuring)
- Retour utilisateur (affichage des erreurs, loaders, notifications de succès/échec)
- State global via Context API (thème, utilisateur)
- Hooks personnalisés (`useApi`, `useAuth`, `useDebounce`, etc.)
- Thème sombre/clair (context + variables CSS globales)
- Système de thème global (aucune couleur en dur)
- Animations (ex : `AnimatedText`, transitions CSS)
- Multilingue (i18n complet, changement de langue dynamique)

---

## Liste des bonus

- **Mini-jeu Sonic** accessible sur la page d’erreur 404
- **Service Worker** pour une expérience offline et un chargement plus rapide
- **Déconnexion automatique** après 5 minutes d’inactivité
- **Chargement des images avec skeleton loader** (effet de chargement progressif)
- **Favicon dynamique** selon le thème du navigateur
- **Gestion avancée des erreurs API** (affichage personnalisé)
- **Animations supplémentaires** sur les transitions de pages et boutons (bouton de like d'un contenu avec animation de sonic)

---

## Lancer le serveur front

```bash
cd client
npm install
npm start react
```

---

## Structure du dossier /client/

- `src/components/` : Composants réutilisables (UI, sections, admin…)
- `src/pages/` : Pages principales du site
- `src/hooks/` : Hooks personnalisés
- `src/context/` : Context API (thème, auth…)
- `src/services/` : Appels API
- `src/styles/` : Styles globaux et variables CSS
- `src/locales/` : Fichiers de traduction

---

### IMPORTANT

- En développement dans le fichier /client/public/index.html
---> mettre la bonne URL dans le header du CSP en fonction de l'environnement 