import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

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

export default router;