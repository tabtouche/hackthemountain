import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

// SSE stream of entities (reads sample.json and streams updates)
app.get('/avrage_rabbit.png', (req, res) => {
  const imagePath = path.join(process.cwd(), 'avrage_rabbit.png');
  if (!fs.existsSync(imagePath)) {
    res.status(404).send('avrage_rabbit.png not found');
    return;
  }
  res.sendFile(imagePath);
});

app.get('/stream/entities', (req, res) => {
  const samplePath = path.join(process.cwd(), 'sample.json');
  if (!fs.existsSync(samplePath)) {
    res.status(404).send('sample.json not found');
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  let seq = 0;
  const raw = fs.readFileSync(samplePath, 'utf8');
  let baseEntities = [];
  try {
    baseEntities = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid sample.json', e);
    res.end();
    return;
  }

  const rabbit = baseEntities.find((e: any) => e.animal === 'rabbit') || baseEntities[0] || {
    animal: 'rabbit',
    x: 50,
    y: 50,
    orientation: 0,
    angleMouth: 0,
    facing: 'right'
  };

  const rabbitState = {
    ...rabbit,
    id: 'rabbit',
    x: Math.max(0, Math.min(100, rabbit.x ?? 50)),
    y: Math.max(0, Math.min(100, rabbit.y ?? 50)),
    vx: 1.2,
    vy: 0.8,
    orientation: rabbit.orientation ?? 0,
    facing: rabbit.facing ?? 'right'
  };

  const sendEvent = () => {
    seq += 1;
    rabbitState.x += rabbitState.vx;
    rabbitState.y += rabbitState.vy;

    if (rabbitState.x <= 0 || rabbitState.x >= 100) {
      rabbitState.vx = -rabbitState.vx;
      rabbitState.x = Math.max(0, Math.min(100, rabbitState.x));
    }
    if (rabbitState.y <= 0 || rabbitState.y >= 100) {
      rabbitState.vy = -rabbitState.vy;
      rabbitState.y = Math.max(0, Math.min(100, rabbitState.y));
    }

    rabbitState.facing = rabbitState.vx > 0 ? 'right' : 'left';
    rabbitState.orientation = Math.atan2(rabbitState.vy, rabbitState.vx);

    const event = {
      type: 'entities',
      seq,
      timestamp: new Date().toISOString(),
      payload: [rabbitState]
    };
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // simulate a while loop with a continuous interval
  sendEvent();
  const iv = setInterval(sendEvent, 100);

  req.on('close', () => {
    clearInterval(iv);
  });
});

// Accept media upload as a base64 dataURL in JSON
app.post('/api/upload-media', (req, res) => {
  const { filename, dataUrl } = req.body;
  if (!filename || !dataUrl) {
    return res.status(400).json({ error: 'filename and dataUrl required' });
  }

  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: 'Invalid dataUrl format' });
  }

  const mime = matches[1];
  const b64 = matches[2];
  const buffer = Buffer.from(b64, 'base64');

  const uploadsDir = path.join(process.cwd(), 'backend_uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const savePath = path.join(uploadsDir, filename);
  fs.writeFile(savePath, buffer, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, path: `/backend_uploads/${filename}`, mime });
  });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
