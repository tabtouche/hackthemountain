import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// Récupérer toutes les pièces
router.get('/', (req: Request, res: Response) => {
  db.all(`SELECT * FROM Play ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Créer une pièce
router.post('/', (req: Request, res: Response) => {
  const { title, director_name } = req.body;

  if (!title || !director_name) {
    return res.status(400).json({ error: 'Le titre et le nom du réalisateur sont requis' });
  }

  const query = `INSERT INTO Play (title, director_name) VALUES (?, ?)`;
  
  db.run(query, [title, director_name], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Retourner la pièce fraîchement créée
    db.get(`SELECT * FROM Play WHERE id = ?`, [this.lastID], (err, row) => {
      res.status(201).json(row);
    });
  });
});

// Récupérer une pièce par son ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM Play WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Pièce introuvable' });
    }
    res.json(row);
  });
});

// Supprimer une pièce
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Delete all scenes associated with this play first
  db.run(`DELETE FROM Scene WHERE play_id = ?`, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Then delete the play
    db.run(`DELETE FROM Play WHERE id = ?`, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pièce introuvable' });
      }
      res.json({ message: 'Pièce supprimée avec succès' });
    });
  });
});

export default router;