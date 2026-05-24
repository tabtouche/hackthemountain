import express from 'express';
import cors from 'cors';
import playsRouter from './routes/plays';
import { playScenesRouter, scenesRouter } from './routes/scenes';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

// ── Python puppet process management ────────────────────────────────────────
const PUPPET_DIR = path.resolve(__dirname, '../../puppet-recognition');
const PYTHON_VENV_WIN = path.join(PUPPET_DIR, '.venv', 'Scripts', 'python.exe');
const PYTHON_BIN = fs.existsSync(PYTHON_VENV_WIN) ? PYTHON_VENV_WIN : 'python';

let puppetProcess: ChildProcess | null = null;

function startPuppet() {
  if (puppetProcess) return;
  puppetProcess = spawn(PYTHON_BIN, ['main.py'], {
    cwd: PUPPET_DIR,
    stdio: 'pipe',
    env: { ...process.env, HEADLESS: '1' },
  });
  puppetProcess.stdout?.on('data', (d) => process.stdout.write(`[puppet] ${d}`));
  puppetProcess.stderr?.on('data', (d) => process.stderr.write(`[puppet] ${d}`));
  puppetProcess.on('exit', () => { puppetProcess = null; });
  puppetProcess.on('error', (err) => {
    console.error('[puppet] Failed to start Python process:', err.message);
    puppetProcess = null;
  });
  console.log('[puppet] Python process started');
}

function stopPuppet() {
  if (!puppetProcess) return;
  puppetProcess.kill();
  puppetProcess = null;
  console.log('[puppet] Python process stopped');
}

process.on('exit', stopPuppet);
process.on('SIGINT', () => { stopPuppet(); process.exit(); });

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/backend_uploads', express.static(path.join(process.cwd(), 'backend_uploads')));

// Charger les routes
app.use('/api/plays', playsRouter);
app.use('/api/plays/:playId/scenes', playScenesRouter);
app.use('/api/scenes', scenesRouter);

app.get('/', (req, res) => {
  res.send('HackTheMountain Backend avec base SQLite persistante opérationnel!');
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

app.post('/api/puppet/start', (_req, res) => {
  startPuppet();
  res.json({ ok: true });
});

app.post('/api/puppet/stop', (_req, res) => {
  stopPuppet();
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});