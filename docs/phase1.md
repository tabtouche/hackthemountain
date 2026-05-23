# Plan: Phase 1 - Fondations du produit

Mise en place de l'environnement de développement complet (Angular + Node.js/SQLite) et création des interfaces d'accueil et de configuration initiale d'une pièce.

## Pré-requis

- Node.js installé sur la machine de développement.
- Angular CLI installé.
- Le projet doit être subdivisé en deux structures (pour la rapidité du développement hackathon) : un dossier `frontend/` (Angular) et `backend/` (Node.js).

## Étapes d'implémentation (Steps)

### 1. Initialisation de l'environnement (en parallèle)
- Initialiser l'application Angular (dossier `frontend/`) pour l'interface client.
- Initialiser le projet Node.js + Express (dossier `backend/`) avec le client SQLite pris en charge.
- Configurer un orchestrateur au niveau racine (par exemple `concurrently` dans un `package.json` global) pour pouvoir lancer `npm run dev` et démarrer à la fois le client et le serveur.

### 2. Phase Backend : Modélisation et API
- Configurer la base logicielle pour instancier un fichier SQLite (`database.sqlite`).
- Créer le schéma initial: table `Play` (`id`, `title`, `director_name`, `created_at`).
- Créer les APIs de base: `POST /api/plays` (Créer la pièce) et `GET /api/plays/:id` (Récupérer la pièce).

### 3. Phase Frontend : Architecture et Routage
- Définir les routes Angular de base: `/` (Accueil) et `/plays/:id` (Interface des scènes).
- Créer un service HTTP Angular `PlayService` qui fera le lien avec l'API métier en local (ex: `localhost:3000`).

### 4. Phase Frontend : Interfaces UI (dépend de l'étape 3)
- **Accueil (3.1)** : Vue avec logo et bouton "Créer un spectacle".
- **Pop-up Création (3.2)** : Affichage d'une modale (ou d'un composant superposé), reliée à un formulaire réactif (Titre, Réalisateur). Validation: bloquer l'appel si les champs sont vides.
- **Scènes (3.3 - Squelette)** : Vue de gestion qui, pour le moment, récupère la pièce par son ID dans l'URL et affiche simplement la bannière avec le titre du spectacle.

## Fichiers pertinents (Relevant files)

- `backend/src/db.ts` — Configuration de la connexion et initialisation SQLite.
- `backend/src/routes/plays.ts` — Contrôleurs de création et de récupération.
- `frontend/src/app/app.routes.ts` — Routes de l'application cliente.
- `frontend/src/app/home.component.ts` — Page d'accueil appelant la création.
- `frontend/src/app/play-creation-modal.component.ts` — Modal de création et validations UI.
- `frontend/src/app/play-dashboard.component.ts` — Nouvelle route pour l'affichage de la pièce.

## Méthode de validation (Verification)

1. Démarrage de la stack locale (Backend : `3000`, Frontend : `4200`). Ouvrir `http://localhost:4200/`.
2. L'interface d'accueil s'affiche. L'ouverture de la pop-up se fait au clic sur "Créer un spectacle".
3. **Validation UI** : Vérifier que le bouton "Créer" reste inactif tant que les deux textes (Titre, Réalisateur) ne sont pas remplis.
4. **Validation Données** : Soumettre le formulaire avec des données valides, vérifier qu'une requête HTTP `POST /api/plays` est envoyée. Vérifier via un outil SQLite (ou les logs de la console Backend) que la nouvelle ligne de base de données a été insérée.
5. **Validation Routage** : Après la sauvegarde logicielle, s'assurer que le navigateur du client redirige bien vers `/plays/{id_de_la_nouvelle_piece}`.
6. Le titre de la pièce s'affiche correctement sur la nouvelle page en exécutant `GET /api/plays/{id_de_la_nouvelle_piece}` à son chargement.

## Décisions en attente à confirmer ensemble pour se lancer :

- Souhaites-tu un framework CSS particulier pour être rapide sur ce Hackathon (ex: TailwindCss, Angular Material, ou tu feras du SCSS classique) ?
- Est-ce que ce type d'architecture avec des dossiers séparés `/backend` et `/frontend` te convient ?