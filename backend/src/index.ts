import express from 'express';
import cors from 'cors';
import playsRouter from './routes/plays';
import { playScenesRouter, scenesRouter } from './routes/scenes';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Charger les routes
app.use('/api/plays', playsRouter);
app.use('/api/plays/:playId/scenes', playScenesRouter);
app.use('/api/scenes', scenesRouter);

app.get('/', (req, res) => {
  res.send('HackTheMountain Backend avec base SQLite persistante opérationnel!');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});