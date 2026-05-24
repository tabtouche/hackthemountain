# Plan: Phase 2 - Gestion des scènes

Permettre à l'utilisateur d'ajouter, renommer et réorganiser (drag & drop) les scènes au sein d'une pièce, et implémenter la modale (3.4) servant de carrefour vers les contenus spécifiques.

## Étapes d'implémentation (Steps)

### 1. API Backend pour les Scènes (`Scene`)
- Créer un contrôleur `scenes.ts` sur le backend.
- Endpoint : `GET /api/plays/:playId/scenes` (récupérer toutes les scènes triées par `sequence_order` ascendant).
- Endpoint : `POST /api/plays/:playId/scenes` (créer une scène avec un titre par défaut "Scène X" et l'ajouter à la suite).
- Endpoint : `PUT /api/scenes/:id` (mettre à jour le `title` ou re-calculer globalement le `sequence_order` après un remaniement).
- Endpoint : `DELETE /api/scenes/:id` (optionnel mais utile en cas d'erreur de clic).

### 2. Intégration Frontend (`SceneService`)
- Créer un service HTTP Angular dédié : `scene.service.ts` pour définir les requêtes REST au client vers notre base SQLite.

### 3. Mise à jour du Tableau de Bord (`PlayDashboardComponent`)
- Brancher l'appel `GET` pour lister les scènes sous forme de grille.
- Brancher le clic du bouton `+ Ajouter une scène` au `POST` backend.
- Ajouter l'installation et l'import de `@angular/cdk/drag-drop` pour activer le glisser-déposer réordonnable.
- Gérer le double-clic sur un titre de scène pour le basculer en champ `<input>`, et sauvegarder en BDD au signal *blur* (perte de focus) ou touche "Entrée".

### 4. Implémentation de la Pop-up Sélecteur de Contenu (3.4)
- Créer un nouveau composant `SceneContentModalComponent`.
- Brancher l'ouverture de la pop-up au simple clic sur le visuel (thumbnail) d'une scène sur le tableau de bord.
- UI de la pop-up : Bouton "🎭 Mise en scène (webcam)", Bouton "🎵 Musique" et Bouton "🖼️ Décor". Pour le moment (Phase 2), ce seront uniquement des éléments statiques marquant les emplacements des futures Phases 3 et 4.

## Fichiers pertinents (Relevant files)

- `backend/src/routes/scenes.ts` — Contrôleurs CRUD des scènes.
- `backend/src/index.ts` — Ajout des routers Express `/api/plays/:playId/scenes` et `/api/scenes`.
- `frontend/src/app/services/scene.service.ts` — Actions HTTP associées Angular.
- `frontend/src/app/play-dashboard/play-dashboard.component.ts` — Enrichissement de la vue principale.
- `frontend/src/app/scene-content-modal/scene-content-modal.component.ts` — Création du sélecteur ludique (3.4).

## Méthode de validation (Verification)

1. **Vérification Initiale** : Lancer la stack locale, ouvrir une pièce créée (ex: `/plays/1`). Constater que la zone "Mes scènes" est vide.
2. **Ajout** : Cliquer 3 fois sur "Ajouter une scène" -> on vérifie que "Scène 1", "Scène 2", "Scène 3" s'affichent correctement en grilles, sans devoir rafraîchir manuellement la page.
3. **Renommage** : Double-cliquer sur le titre de "Scène 1", écrire "L'arrivée du loup" puis appuyer sur "Entrée". Les données en local BDD doivent être altérées instantanément (vérifier l'appel PUT dans la console réseau).
4. **Réorganisation (Drag&Drop)** : À la souris, faire glisser la *Scène 3* devant *L'arrivée du loup*. Rafraîchir entièrement la page de son navigateur (F5) et s'assured que la *Scène 3* est bel et bien restée épinglée à la première position (sauvegarde de la métadonnée `sequence_order` valide).
5. **Navigation Modale** : Cliquer sur le gros carré (thumbnail) d'une scène : cela bascule bien la modale (3.4) transparente à l'écran avec les 3 gros boutons d'action.