# Le Loup de Broadway

A web app for creating puppet theater shows. Kids stage scenes using hand puppets detected by webcam, pick backgrounds and music, then watch their film play back.

## What it does

- **Real-time puppet detection** — hold up a rabbit or wolf hand puppet in front of the webcam; MediaPipe tracks your hand and animates the puppet on stage, including mouth movement
- **Scene composer** — build a play scene by scene: choose a background, record your puppets acting, add music
- **Film playback** — watch the finished play with all scenes, audio, and background music

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Angular 21, TypeScript, HTML5 Canvas |
| Backend | Node.js, Express 5, SQLite |
| Puppet service | Python, MediaPipe, OpenCV, WebSockets |

## Prerequisites

- Node.js 20+
- Python 3.8+

## Running the app

Install Python dependencies first:

```bash
cd puppet-recognition
python -m venv .venv
source .venv/bin/activate        # Mac/Linux
.venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

Then from the project root:

```bash
npm install
npm run dev
```

This starts everything concurrently:

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000 |
| Puppet WebSocket | ws://localhost:8765 |

The backend automatically spawns the Python puppet-recognition process on startup.

## Project structure

```
hackthemountain/
├── frontend/             # Angular app
│   └── src/
│       ├── app/          # Components, services, stage canvas
│       └── assets/       # Puppet images, backgrounds, music
├── backend/              # Express API + SQLite
│   └── src/
│       ├── index.ts      # Server entry point
│       ├── db.ts         # Database setup
│       └── routes/       # REST endpoints
├── puppet-recognition/   # Python WebSocket service
│   ├── main.py           # Entry point
│   ├── hand_tracker.py   # MediaPipe hand detection
│   ├── interpreter/      # Hand landmarks → puppet pose
│   └── classifier/       # Rabbit / wolf classification
└── puppet-model/         # Model training scripts (TensorFlow)
```
