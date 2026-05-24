import { Router, Request, Response } from 'express';
import { db } from '../db';

// Router pour les routes relatives à une pièce (ex: /api/plays/:playId/scenes)
export const playScenesRouter = Router({ mergeParams: true });

// Router pour les routes directes d'une scène (ex: /api/scenes/:id)
export const scenesRouter = Router();

// ==========================================
// ROUTES : /api/plays/:playId/scenes
// ==========================================

// Récupérer toutes les scènes d'une pièce
playScenesRouter.get('/', (req: Request, res: Response) => {
  const { playId } = req.params;
  db.all(`SELECT * FROM Scene WHERE play_id = ? ORDER BY sequence_order ASC`, [playId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Créer une nouvelle scène dans une pièce
playScenesRouter.post('/', (req: Request, res: Response) => {
  const { playId } = req.params;
  
  // Compter les scènes existantes pour déterminer sequence_order et le nom par défaut
  db.get(`SELECT MAX(sequence_order) as maxOrder, COUNT(id) as count FROM Scene WHERE play_id = ?`, [playId], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const nextOrder = (row && row.maxOrder !== null) ? row.maxOrder + 1 : 1;
    const title = req.body.title || `Scène ${row.count !== undefined ? row.count + 1 : 1}`;
    
    db.run(`INSERT INTO Scene (play_id, title, sequence_order) VALUES (?, ?, ?)`, [playId, title, nextOrder], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get(`SELECT * FROM Scene WHERE id = ?`, [this.lastID], (err, newRow) => {
        res.status(201).json(newRow);
      });
    });
  });
});

// ==========================================
// ROUTES : /api/scenes/:id
// ==========================================

// Mettre à jour une scène (titre ou ordre)
scenesRouter.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, sequence_order, background_image } = req.body;

  const updates: string[] = [];
  const params: any[] = [];

  if (title !== undefined) {
    updates.push('title = ?'); params.push(title);
  }
  if (sequence_order !== undefined) {
    updates.push('sequence_order = ?'); params.push(sequence_order);
  }
  if (background_image !== undefined) {
    updates.push('background_image = ?'); params.push(background_image);
  }
  
  if (updates.length === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });
  
  params.push(id);
  db.run(`UPDATE Scene SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get(`SELECT * FROM Scene WHERE id = ?`, [id], (err, updatedRow) => {
      res.json(updatedRow);
    });
  });
});

// Supprimer une scène
scenesRouter.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.run(`DELETE FROM Scene WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// Route Bulk pour le drag & drop (facilite la réorganisation depuis le frontend)
scenesRouter.put('/bulk/reorder', (req: Request, res: Response) => {
  const { scenes } = req.body; // array of { id, sequence_order }
  if (!Array.isArray(scenes)) return res.status(400).json({ error: 'Tableau scenes attendu' });
  
  let completed = 0;
  let hasError = false;
  
  if (scenes.length === 0) return res.json({ success: true });

  scenes.forEach(scene => {
    db.run(`UPDATE Scene SET sequence_order = ? WHERE id = ?`, [scene.sequence_order, scene.id], (err) => {
      if (err) hasError = true;
      completed++;
      if (completed === scenes.length) {
        if (hasError) return res.status(500).json({ error: 'Certaines mises à jour ont échoué.' });
        res.json({ success: true });
      }
    });
  });
});
