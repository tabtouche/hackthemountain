# Plan: Phase 3 - Contenus de scène (Focus Musique)

Ce document décrit le plan d'implémentation de la Phase 3, et plus spécifiquement l'ajout d'une bande sonore à une scène (Interface 3.6 du PRD).

## Objectif (TL;DR)
Associer le bouton "🎵 Musique" de la Pop-up (modale) d'une scène vers une nouvelle page dédiée. Cette page permettra :
1. De parcourir son ordinateur pour uploader un fichier `.mp3` ou `.wav`.
2. De pré-écouter le son.
3. De sauvegarder la musique pour cette scène pour plus tard lancer le film total.

## Pré-requis
- La fonctionnalité glisser-déposer de la Phase 2 fonctionne.
- Savoir comment gérer l'upload de médias depuis Angular (`FormData`) vers Express.

---

## Étapes d'implémentation (Steps)

### 1. Stockage de médias (Backend / BDD) (*depends on Phase 2*)
- **Base de données (`db.ts`)** : Ajouter dynamiquement une colonne `music_url TEXT` sur la table existante `Scene` dans le `CREATE TABLE`.
- **Dépendances** : Installer le middleware `multer` dans le dossier backend.
- **Serveur web (`index.ts`)** : Exposer le dossier physique `backend/public/uploads` publiquement (`app.use('/uploads', express.static(...))`).
- **Nouveau Endpoint (API)** : Créer une route spécifique `POST /api/scenes/:id/music` qui reçoit le fichier binaire audio et le met à jour en BDD (colonne `music_url`).

### 2. Connecter le Frontend (Routing & Service)
- Ajouter la route `/plays/:playId/scenes/:sceneId/music` branchée à un nouveau composant Angular (fichier `app.routes.ts`).
- Modifier le composant `SceneContentModalComponent` pour rediriger vers cette route Angular au clic du bouton "🎵 Musique".
- Rajouter une fonction `uploadMusic(sceneId: number, file: File)` sur le service `SceneService.ts`.

### 3. Interface Choix de Musique (`MusicChooserComponent` - 3.6)
- Implémenter ce composant (Stand-alone).
- **Architecture de la vue** :
  - Haut gauche : Bouton `< Annuler` qui réoriente sur le tableau de bord de la création en cours.
  - Centre : Une case visuelle (Input de type `file` limité en `.mp3, .wav`) afin de charger son fichier.
  - Bas : Si un fichier est temporairement chargé/testé -> Utiliser une balise basique `<audio controls>` pour la pré-écoute.
  - Validation : Bouton **"Choisir"** rouge/bleu ou vert avec un appel à l'API d'Upload et le routeur validant qui retourne au Dashboard.

---

## Fichiers pertinents
- `backend/src/db.ts` — Mise à jour table SQLite.
- `backend/src/routes/scenes.ts` — Implémentation du routeur d'upload `multer`.
- `backend/package.json` — Ajout dépendance multer.
- `frontend/src/app/app.routes.ts` — Déclaration de la route de musique.
- `frontend/src/app/scene-content-modal/scene-content-modal.component.ts` — RouterLink sur le clic 🎵.
- `frontend/src/app/services/scene.service.ts` — Service POST de la musique en `FormData`.
- `frontend/src/app/music-chooser/music-chooser.component.ts` — (Nouveau) Vue du choix final.

---

## Méthode de validation (Verification)

1. **Navigation Modale** : L'appui sur le bouton "🎵 Musique" t'envoie vers un lien tel que `/plays/1/scenes/3/music` et l'interface s'affiche bien.
2. **Choix Fichier** : Option "Uploader" te fait chercher des fichiers `.mp3` de ton bureau. Le lecteur audio HTML5 s'active en bas.
3. **Transmission BDD** : En cliquant sur "Choisir", l'API répondra par un 200 OK et ton terminal validera un fichier dans le tout nouveau dossier `backend/public/uploads` avec le même nom (modifié pour d'éventuels conflits).
4. **Validation de Retour** : Tu seras redirigé au Dashboard et ton backend t'annoncera fièrement un lien `http://localhost:3000/uploads/music.mp3` dans l'API liée.

**Decisions / Restrictions**
- **MVP Simplifé** : Le PRD original évoque un grand carrousel de vieilles musiques disponibles (ex: comptines générées). Pour aller vite en Hackathon, l'Upload pur d'un média remplit toutes les contraintes de faisabilité tout de suite.