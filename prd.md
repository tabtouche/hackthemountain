# PRD — Jeu de spectacle de marionnettes 2D

**Version** : 1.0  
**Date** : 2026-05-23  
**Statut** : Draft

---

## 1. Vue d'ensemble

### 1.1 Description du produit

Application web destinée aux enfants leur permettant de créer des spectacles de marionnettes en 2D. L'enfant assemble plusieurs scènes pour composer une pièce complète. Chaque scène comprend une mise en scène avec des marionnettes (capturées via webcam), une bande-son et un décor (background). Le résultat final est un film animé que l'enfant peut visionner et télécharger.

### 1.2 Objectifs

- Stimuler la créativité et l'imaginaire des enfants.
- Offrir une expérience de création simple, intuitive et ludique.
- Permettre la création de contenus exportables et partageables.

### 1.3 Public cible

Enfants de 5 à 12 ans, accompagnés ou non d'un adulte.

### 1.4 Plateformes cibles

Navigateur web (desktop en priorité pour MVP1, responsive à prévoir pour MVP2).

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

### 4.1 Interface de compte utilisateur

**Rôle** : Permettre à l'utilisateur de créer un compte, se connecter et gérer son profil.

**Éléments UI :**
- Formulaire de création de compte (nom d'utilisateur, mot de passe ou OAuth).
- Formulaire de connexion.
- Page de profil (avatar, nom, historique des pièces créées).

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
- MVP1 : navigateurs modernes (Chrome, Firefox, Edge, Safari) sur desktop.
- MVP2 : responsive mobile/tablette.

### 6.3 Accessibilité
- Textes et icônes lisibles pour des enfants (taille de police ≥ 16px, contrastes élevés).
- Libellés des boutons clairs et illustrés d'icônes.

### 6.4 Sécurité et vie privée
- Aucune image ou vidéo capturée par la webcam n'est transmise à un serveur sans consentement explicite.
- En MVP1, tout le traitement webcam est local (client-side).

---

## 7. Hypothèses et décisions à valider

| # | Hypothèse / Question ouverte | Priorité |
|---|---|---|
| 1 | Mécanisme de détection des marionnettes (lapin / loup) : marqueurs colorés ? Silhouette ? À définir avec l'équipe tech. | Haute |
| 2 | Format d'export du film : MP4 côté client (via ffmpeg.wasm) ou rendu serveur ? | Haute |
| 3 | Nombre de musiques et de backgrounds fournis par défaut dans le carrousel/galerie. | Moyenne |
| 4 | Stockage des pièces en MVP1 : local storage navigateur ou backend léger ? | Haute |
| 5 | Gestion des permissions webcam : tutoriel intégré si l'accès est refusé ? | Moyenne |
| 6 | Technologie de détection des mains pour MVP2 (MediaPipe, TensorFlow.js, autre). | Basse (MVP2) |

---

## 8. Hors périmètre (explicitement exclus de MVP1)

- Compte utilisateur et authentification.
- Partage de pièces en ligne ou sur les réseaux sociaux.
- Mode multijoueur / collaboration.
- Édition de la vidéo après enregistrement (découpe, effets).
- Monétisation ou publicité.

---

*Fin du document PRD v1.0*