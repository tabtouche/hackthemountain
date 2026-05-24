# PRD — Jeu de spectacle de marionnettes 2D

**Version** : 1.0  
**Date** : 2026-05-23  
**Statut** : Draft

---

## 1. Vue d'ensemble

### 1.1 Description du produit

Application web conçue comme une **démo en localhost pour un hackathon**, destinée à simuler un outil de création de spectacles de marionnettes en 2D pour enfants. L'utilisateur assemble plusieurs scènes pour composer une pièce complète, avec capture webcam des marionnettes, bande-son et décor. Le résultat final est un film animé visionnable et exportable.

### 1.2 Objectifs

- Démontrer la faisabilité technique lors du hackathon (détection caméra, montage média).
- Simuler une expérience de création simple, intuitive et ludique pour enfants.
- Permettre la création de contenus exportables localement.

### 1.3 Public cible

Jury du hackathon (mode démo) / Simulation pour enfants de 5 à 12 ans.

### 1.4 Plateformes cibles

Navigateur web exécuté strictement en **localhost** (desktop uniquement, le responsif n'étant pas une priorité pour la démo du hackathon).

---

## 2. Périmètre du projet

| Fonctionnalité | MVP1 | MVP2 |
|---|---|---|
| Création et nommage d'une pièce | ✅ | ✅ |
| Gestion des scènes (ajout, réorganisation, renommage) | ✅ | ✅ |
| Mise en scène via webcam (détection lapin / loup) | ✅ | ✅ |
| Choix de musique (upload + carrousel) | ✅ | ✅ |
| Choix de background (upload + liste) | ✅ | ✅ |
| Visualisation et export du film | ✅ | ✅ |
| Compte utilisateur | ❌ | ✅ |
| Bibliothèque (pièces et musiques sauvegardées) | ❌ | ✅ |
| Création de musique manuelle (type GarageBand, contrôle par les mains) | ❌ | ✅ |

### 2.1 Phases d'implémentation du MVP1

Le MVP1 est découpé en phases pour sécuriser la livraison et valider les briques les plus simples avant d'attaquer les fonctionnalités les plus risquées.

| Phase | Objectif | Inclus | Sortie attendue |
|---|---|---|---|
| Phase 1 | Fondations du produit | Accueil, création d'une pièce, navigation de base, structure de données d'une pièce et d'une scène | L'utilisateur peut créer une pièce et arriver sur l'écran principal de gestion |
| Phase 2 | Gestion des scènes | Ajout de scènes, renommage, réorganisation, miniatures de base, ouverture du sélecteur de contenu | L'utilisateur peut organiser une pièce composée de plusieurs scènes |
| Phase 3 | Contenus de scène | Upload / sélection de musique, upload / sélection de background, association des médias à une scène | Une scène peut être enrichie avec une musique et un décor |
| Phase 4 | Mise en scène webcam | Accès caméra, détection lapin / loup, enregistrement, pause / reprise, sauvegarde de scène | L'utilisateur peut capturer une scène jouable avec détection en temps réel |
| Phase 5 | Lecture et export | Assemblage des scènes, lecteur de film, téléchargement du rendu final | La pièce complète peut être visionnée puis exportée |

Ordre recommandé de livraison : Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5.

Priorités techniques par phase :
- Phase 1 : poser le modèle de données et le routage / navigation.
- Phase 2 : stabiliser les interactions de gestion d'une pièce.
- Phase 3 : brancher les assets et la persistance locale des choix.
- Phase 4 : traiter les contraintes navigateur et webcam.
- Phase 5 : finaliser l'assemblage et l'export vidéo.

---

## 3. Interfaces — MVP1

### 3.1 Interface d'accueil

**Rôle** : Point d'entrée de l'application.

**Éléments UI :**
- Logo / titre du jeu.
- Bouton principal : **« Créer un spectacle »**.

**Comportement :**
- Clic sur « Créer un spectacle » → ouvre le pop-up de création de pièce (voir 3.2).

---

### 3.2 Pop-up : Créer une nouvelle pièce

**Rôle** : Initialiser une pièce avec ses métadonnées.

**Éléments UI :**
- Champ texte : **Nom de la pièce** (obligatoire).
- Champ texte : **Nom du réalisateur** (obligatoire).
- Bouton **« Créer »** (désactivé si les champs sont vides).
- Bouton **« Annuler »**.

**Comportement :**
- Clic sur « Créer » avec les champs remplis → ferme le pop-up, crée la pièce et navigue vers l'Interface des scènes (3.3).
- Clic sur « Annuler » → ferme le pop-up, retour à l'accueil.

---

### 3.3 Interface des scènes de la pièce

**Rôle** : Vue principale de la pièce, liste et gestion des scènes.

**Éléments UI :**
- **Bannière** en haut avec le titre de la pièce.
- Sous-titre : **« Mes scènes »**.
- Bouton **« + »** pour ajouter une scène.
- **Bouton Play** pour lancer la visualisation du film (voir 3.5).
- Grille / liste des scènes existantes, chacune affichant :
  - Un **thumbnail** de la scène.
  - Un **titre** (par défaut : « Scène 1 », « Scène 2 », etc.).
  - Double-clic sur le titre → champ de saisie éditable pour renommer la scène.
- Les scènes sont **réordonnables par drag & drop**.

**Comportement — Ajout d'une scène :**
- Clic sur « + » → ouvre le pop-up de sélection de type de contenu (3.4).

**Comportement — Clic sur une scène existante :**
- Ouvre le pop-up de sélection de type de contenu (3.4) en mode édition pour cette scène.

---

### 3.4 Pop-up : Sélection du type de contenu de la scène

**Rôle** : Permettre à l'enfant de choisir quelle composante de la scène il souhaite créer ou modifier.

**Éléments UI :**
- Titre : **« Que veux-tu créer ? »** (ou équivalent ludique).
- Trois sphères / boutons iconiques :
  - 🎭 **Mise en scène** → navigue vers Interface de mise en scène (3.5).
  - 🎵 **Musique** → navigue vers Interface de choix de musique (3.6).
  - 🖼️ **Décor** → navigue vers Interface de choix de background (3.7).
- Bouton **« Fermer »**.

---

### 3.5 Interface de mise en scène des personnages

**Rôle** : Enregistrer une scène via la webcam avec détection de marionnettes.

**Éléments UI :**
- Vue **retour caméra** (webcam) en plein écran ou zone principale.
- Overlay de détection : affichage de l'image du **lapin** quand le lapin est détecté, affichage de l'image du **loup** quand le loup est détecté.
- Barre de contrôle avec les boutons suivants :
  - ▶️ **Commencer** / ⏸️ **Pause** : démarre ou met en pause l'enregistrement.
  - 🔄 **Recommencer** : réinitialise l'enregistrement en cours.
  - 💾 **Sauvegarder et quitter** : enregistre la scène et retourne à l'Interface des scènes (3.3).

**Comportement :**
- La détection de marionnettes (lapin / loup) se fait en temps réel via la webcam.
- L'enregistrement capture la vidéo avec les overlays des personnages détectés.
- « Sauvegarder et quitter » génère le thumbnail de la scène à partir d'une frame de l'enregistrement.

**Contraintes techniques :**
- Accès à la webcam nécessite une autorisation navigateur.
- Détection des marionnettes : à préciser (marqueurs visuels, couleurs, forme — à définir avec l'équipe technique).

---

### 3.6 Interface de choix de musique

**Rôle** : Associer une bande-son à la scène.

**Éléments UI :**
- Option **« Uploader une musique »** : bouton d'upload de fichier audio (formats acceptés : MP3, WAV, OGG).
- **Carrousel** de musiques pré-intégrées :
  - Chaque option affiche une vignette (illustration) et un titre.
  - Clic sur une option → prévisualisation audio.
- Bouton **« Choisir »** pour valider la sélection.
- Bouton **« Annuler »** pour revenir sans modification.

**Comportement :**
- La musique sélectionnée ou uploadée est associée à la scène en cours.
- Retour à l'Interface des scènes (3.3) après validation.

---

### 3.7 Interface de choix de background

**Rôle** : Associer un décor à la scène.

**Éléments UI :**
- Option **« Uploader un décor »** : bouton d'upload d'image (formats acceptés : JPG, PNG, GIF).
- **Liste / galerie** de backgrounds pré-intégrés :
  - Chaque option affiche une miniature et un titre.
  - Clic sur une miniature → prévisualisation en grand format.
- Bouton **« Choisir »** pour valider la sélection.
- Bouton **« Annuler »** pour revenir sans modification.

**Comportement :**
- Le background sélectionné ou uploadé est associé à la scène en cours.
- Retour à l'Interface des scènes (3.3) après validation.

---

### 3.8 Pop-up : Visualisation du film

**Rôle** : Permettre de visionner la pièce complète (toutes les scènes assemblées dans l'ordre).

**Déclencheur** : Clic sur le bouton Play dans l'Interface des scènes (3.3).

**Éléments UI :**
- **Lecteur vidéo** avec les scènes enchaînées dans l'ordre défini.
- Contrôles basiques : Play / Pause, barre de progression.
- Bouton **« Télécharger »** : exporte le film assemblé (format vidéo à définir, ex. MP4).
- Bouton **« Fermer »** : retour à l'Interface des scènes (3.3).

---

## 4. Interfaces — MVP2

### 4.1 Gestion de profils locaux (Compte utilisateur simulé)

**Rôle** : Simuler la gestion multi-utilisateurs pour la démo, via des profils locaux persistés localement ou en base SQlite.

**Éléments UI :**
- Création de profil basique (choix d'un pseudo et d'un avatar, sans mot de passe ni OAuth).
- Écran de sélection de profil (switch rapide).
- Page de profil (avatar, pseudo, historique des pièces créées dans la session).

---

### 4.2 Bibliothèque

**Rôle** : Accéder aux pièces et musiques précédemment créées ou sauvegardées.

**Éléments UI :**
- Onglet **« Mes pièces »** : liste des pièces créées avec thumbnail, titre, date de création.
  - Actions par pièce : ouvrir, renommer, supprimer, exporter.
- Onglet **« Mes musiques »** : liste des musiques uploadées ou créées.
  - Actions : écouter, renommer, supprimer.

---

### 4.3 Interface de création musicale (évolution de 3.6)

**Rôle** : Permettre à l'enfant de composer sa propre musique de façon intuitive, en contrôlant les instruments avec ses mains devant la caméra.

**Éléments UI :**
- Interface de composition façon **GarageBand simplifié** :
  - Pistes audio (percussions, mélodie, ambiance, etc.).
  - Boucles / samples déclenchables.
- **Contrôle par les mains** (via webcam) :
  - Détection des gestes des mains pour déclencher des sons ou des boucles.
  - Indicateur visuel des zones d'interaction détectées.
- Bouton **« Écouter »** pour prévisualiser la composition.
- Bouton **« Sauvegarder »** pour enregistrer la musique dans la Bibliothèque.
- Bouton **« Utiliser pour cette scène »** pour l'associer directement à une scène.

**Contraintes techniques :**
- Détection des mains en temps réel (ex. MediaPipe Hands ou équivalent).
- Gestion de la latence audio pour une expérience réactive.

---

## 5. Flux de navigation global

```
Accueil
  └─► Pop-up Créer une pièce
        └─► Interface des scènes
              ├─► Pop-up Sélection de contenu
              │     ├─► Interface de mise en scène (webcam)
              │     ├─► Interface de choix de musique
              │     └─► Interface de choix de background
              └─► Pop-up Visualisation du film
                    └─► Téléchargement
```

---

## 6. Exigences non-fonctionnelles

### 6.1 Performance
- Le retour caméra dans l'interface de mise en scène doit fonctionner en temps réel sans latence perceptible (< 100 ms).
- L'assemblage et la lecture du film dans le pop-up de visualisation doivent être fluides (minimum 24 fps).

### 6.2 Compatibilité
- Optimisé pour un usage desktop sur un navigateur moderne récent (ex. Chrome), environnement type pour la démo du hackathon.
- Le support mobile/tablette n'est pas requis pour la démo localhost.

### 6.3 Accessibilité
- Textes et icônes lisibles (simulation d'une UI pour enfants : taille de police ≥ 16px, contrastes élevés).
- Libellés des boutons clairs et illustrés d'icônes.

### 6.4 Sécurité et vie privée
- Le projet tournant exclusivement en localhost, aucune donnée n'est exposée sur internet. 
- Le traitement webcam reste confiné à la machine de démo (traitement côté client).

### 6.5 Stack technique cible

La stack retenue sert de base au produit complet, pas uniquement au MVP1.

- Frontend : Angular.
- Backend : Node.js.
- Base de données : SQLite.
- Communication : API HTTP entre le frontend Angular et le backend Node.js.
- Persistance des données : le backend Node.js centralise les écritures métier dans SQLite.

---

## 7. Hypothèses et décisions à valider

| # | Hypothèse / Question ouverte | Priorité |
|---|---|---|
| 1 | Mécanisme de détection des marionnettes (lapin / loup) : marqueurs colorés ? Silhouette ? À définir avec l'équipe tech. | Haute |
| 2 | Format d'export du film : MP4 côté client (via ffmpeg.wasm) ou rendu serveur ? | Haute |
| 3 | Nombre de musiques et de backgrounds fournis par défaut dans le carrousel/galerie. | Moyenne |
| 4 | Stockage des pièces : persistance serveur via backend Node.js + SQLite, avec cache local éventuel en complément. | Décision prise |
| 5 | Gestion des permissions webcam : tutoriel intégré si l'accès est refusé ? | Moyenne |
| 6 | Technologie de détection des mains pour MVP2 (MediaPipe, TensorFlow.js, autre). | Basse (MVP2) |

---

## 8. Hors périmètre (explicitement exclus de tout le projet)

- **Toute mise en production ou hébergement en ligne du jeu (le but final est strictement une démo localhost).**
- Véritable système d'authentification (mots de passe, OAuth, etc.). Les profils MVP2 seront purement simulés.
- Partage de pièces en ligne ou sur les réseaux sociaux (export local uniquement).
- Mode multijoueur / collaboration.
- Édition vidéo avancée après enregistrement (découpe, effets).
- Monétisation ou publicité.

---

*Fin du document PRD v1.0*