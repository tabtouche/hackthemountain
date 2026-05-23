import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS Play (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      director_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Scene (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      play_id INTEGER,
      title TEXT NOT NULL,
      sequence_order INTEGER,
      FOREIGN KEY (play_id) REFERENCES Play(id)
    )`);
  }
});

// Phase 1 Routes
app.post('/api/plays', (req, res) => {
  const { title, director_name } = req.body;

  if (!title || !director_name) {
    return res.status(400).json({ error: 'Title and director_name are required' });
  }

  const query = `INSERT INTO Play (title, director_name) VALUES (?, ?)`;
  db.run(query, [title, director_name], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Return created play
    db.get(`SELECT * FROM Play WHERE id = ?`, [this.lastID], (err, row) => {
      res.status(201).json(row);
    });
  });
});

app.get('/api/plays/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM Play WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Play not found' });
    }
    res.json(row);
  });
});

app.get('/', (req, res) => {
  res.send('HackTheMountain Backend is running!');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
