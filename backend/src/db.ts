import sqlite3 from 'sqlite3';
import path from 'path';

// Utiliser un fichier physique à la racine du backend
const dbPath = path.resolve(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données', err.message);
  } else {
    console.log(`Connecté à la base de données SQLite (${dbPath}).`);

    // Création des tables initiales (Schéma)
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
      background_image TEXT,
      music_path TEXT,
      music_track TEXT,
      FOREIGN KEY (play_id) REFERENCES Play(id)
    )`, () => {
      // Add columns for existing databases that don't have them yet
      db.run(`ALTER TABLE Scene ADD COLUMN background_image TEXT`, () => {});
      db.run(`ALTER TABLE Scene ADD COLUMN music_path TEXT`, () => {});
      db.run(`ALTER TABLE Scene ADD COLUMN music_track TEXT`, () => {});
    });
  }
});