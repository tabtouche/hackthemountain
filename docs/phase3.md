# Phase 3 : Plan d'Implémentation du BackgroundEditorComponent

Ce document détaille le plan d'implémentation du composant `BackgroundEditorComponent`, qui servira d'interface de choix et de personnalisation du décor / background d'une scène.

## 1. UX de l'interface

Le composant offrira l'expérience utilisateur suivante :
- **Élément central** : Un canvas rectangulaire (avec un ratio 16:9) représentant le décor de la scène, affiché au centre de l'écran.
- **Navigation des décors** : Des flèches gauche / droite placées de chaque côté du canvas pour naviguer entre les fonds de décors disponibles (pour l'instant, des placeholders : "Décor 1", "Décor 2", "Décor 3" utilisant des couleurs unies ou des dégradés).
- **Panneau gauche (Stickers)** : Une bibliothèque de stickers (placeholders : "Objet 1", "Objet 2", "Objet 3" sous forme de blocs rectangulaires colorés). Au clic sur un sticker, il s'ajoute au centre du canvas. Il devient alors "draggable" (déplaçable) et peut être supprimé.
- **Panneau droit (Outils de dessin)** : Contient les outils permettant de dessiner librement sur la toile. Inclut un sélecteur de couleur, un slider pour la taille du pinceau (brush), un bouton "Gomme" et un bouton "Effacer tout le dessin".
- **Bouton "Valider"** : Permet d'aplatir toutes les couches superposées (fond + stickers + dessin libre) en utilisant `canvas.toDataURL()`. L'image générée est sauvegardée comme background de la scène courante.
- **Bouton "Annuler"** : Ferme l'éditeur sans appliquer ni sauvegarder les modifications.

## 2. Architecture Technique

### 2.1. Structure des fichiers Angular à créer

L'implémentation sera divisée en un composant parent et plusieurs sous-composants/services spécialisés :

```text
src/app/background-editor/
├── background-editor.component.ts   // Composant conteneur principal
├── background-editor.component.html
├── background-editor.component.scss
├── canvas.service.ts                // Logique du Canvas (dessin, interactions, rendu)
├── background-editor.store.ts       // NgRx SignalStore pour la gestion d'état local
├── sticker-panel/
│   ├── sticker-panel.component.ts   // Panneau gauche
│   └── ...
└── drawing-tools/
    ├── drawing-tools.component.ts   // Panneau droit
    └── ...
```

### 2.2. Modèles de Données (Interfaces TypeScript)

```typescript
export interface BackgroundAsset {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image';
  value: string; // ex: '#FF0000', 'linear-gradient(...)', ou URL
}

export interface Sticker {
  id: string;
  src: string; // Placeholders initiaux: couleurs HTML, classes, ou urls
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected?: boolean;
}

export interface BrushConfig {
  color: string;
  size: number;
  isEraser: boolean;
}

export interface DrawingPath {
  brush: BrushConfig;
  points: { x: number, y: number }[];
}
```

### 2.3. Gestion du canvas HTML5

La composition se fera via l'API native Canvas 2D.
- **3 couches logiques (Layers)** seront gérées lors du rendu de la boucle d'affichage :
  1. *Fond* : Dessiné en tout premier via `fillRect` ou image/dégradé.
  2. *Stickers* : Images ou formes peintes, ajoutées par-dessus le fond.
  3. *Dessin libre* : Tracés tracés aux coordonnées enregistrées, via `beginPath()` avec `moveTo()` / `lineTo()`.
- **Rendu dynamique** : Le canvas ne maintient pas d'état persistant dans l'image. Un *redraw* (redessin) complet est effectué à chaque interaction (clear du canvas (`clearRect`) → rendu fond → rendu stickers → rendu dessin libre).
- **Événements souris pour le dessin** : Écoute de `mousedown`, `mousemove` (ajout de points au path courant si la souris est enfoncée), et `mouseup`/`mouseleave` (fin et validation du path).
- **Drag des stickers** : Sur `mousedown`, on effectue un *hit-test* (vérification des coordonnées x/y du clic par rapport au bounding box rectangulaire de chaque sticker, du plus récent au plus ancien). Si un sticker est touché, un flag de drag s'active, et les événements `mousemove` mettent à jour les coordonnées locales `x` et `y` du sticker visé (suivis d'un redraw).

### 2.4. State management (NgRx SignalStore)

La gestion d'état reposera sur NgRx SignalStore pour une réactivité moderne et fine :
- `selectedBackgroundIndex` (`Signal<number>`) : Identifiant/Index de l'Asset de fond en cours.
- `stickers` (`Signal<Sticker[]>`) : Collection des éléments posés sur le canvas.
- `activeLayer` (`Signal<'drawing' | 'stickers'>`) : Précise quel mode d'interaction avec le pointeur est en cours sur le Canvas.
- `brushConfig` (`Signal<BrushConfig>`) : Configuration réactive de l'outil actif.
- `drawingPaths` (`Signal<DrawingPath[]>`) : Historique/Liste des tracés de dessin servant à recréer la version raster.

### 2.5. Dépendances npm nécessaires

**Aucune dépendance externe requise** (en dehors de `@ngrx/signals` si non présent) n'est nécessaire. L'intégralité du travail de drag & drop, manipulation vectorielle et bitmap est portée par les APIs web standards (Canvas API, HTML5).

## 3. Interactions Utilisateur (Étape par Étape)

1. **Ouverture** : L'utilisateur ouvre le composant `BackgroundEditorComponent`. Le store initial est instancié et la boucle Canvas démarre.
2. **Choix du fond** : Clic sur une Flèche Gauche ou Droite. Le store met à jour le selected background (`selectedBackgroundIndex`). Via Reactivité, le Canvas efface tout et redessine avec le nouveau fond au fond de la pile.
3. **Ajout de Sticker** : Clic sur le bouton interactif du Panneau Gauche. Le store crée une instance `Sticker` déposée au milieu du Canvas (`x: canvasWidth / 2`, `y: canvasHeight / 2`) dans son Signal `stickers[]`.
4. **Déplacement de Sticker** : L'utilisateur change peut-être son mode (`activeLayer = 'stickers'`), clique et glisse sur la forme. Le modèle `Sticker.x / y` se met à jour, forçant le redraw 60fps.
5. **Dessin libre** : Clic sur un bouton d'outil dans le panneau Web côté Droit. Update du signal `activeLayer = 'drawing'`. 
6. **Génération d'un tracé** : Drag sur le Canvas. Le `mousedown` ouvre l'entité `DrawingPath`, le `mousemove` y logue toutes les positions `{x,y}`, le renderer Canvas trace les lignes et rafraichit la scène.
7. **Effacement global** : L'appui sur le bouton d'effaçage de la partie dessin clear purement la pile `drawingPaths[]`. Le redraw reconstruit la vue sans eux.

## 4. Export Final et Contraintes

- **Rendu local pur** : Toute la composition de données se fait côté client. Aucune dépendance à un serveur back-end ou lambda n'est utilisée pour le générateur d'image composite final.
- **Export "Flatten"** : Lorsque l'utilisateur valide ses choix, le parent lance `canvas.toDataURL('image/png')`, qui fusionne tout directement dans un stream bitmap en pixelBase64.
- **Transport** : Le Blob généré / la chaîne dataURL est envoyé(e) au `SceneService` pour être lié définitivement (ou uploadé ultérieurement) à la scène ouverte.