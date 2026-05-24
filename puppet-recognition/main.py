import asyncio
import base64
import json
import logging
import math
import os
import threading

import cv2
import websockets

logging.getLogger('websockets').setLevel(logging.CRITICAL)

from classifier.always_rabbit import AlwaysRabbitClassifier
from classifier.always_wolf import AlwaysWolfClassifier
from data.hand_state import HandState
from data.pose import Pose
from data.raw_hand import RawHand
from hand_tracker import HandTracker
from interpreter.interpreter import interpret_landmarks
from landmark_normalizer import LandmarkNormalizer

POSE: Pose = Pose.WOLF
WS_HOST = "localhost"
WS_PORT = 8765
HEADLESS = os.environ.get("HEADLESS", "0") == "1"

# ── WebSocket server ────────────────────────────────────────────────────────
_ws_loop: asyncio.AbstractEventLoop = asyncio.new_event_loop()
_clients: set = set()


async def _ws_handler(ws):
    _clients.add(ws)
    try:
        await ws.wait_closed()
    finally:
        _clients.discard(ws)


async def _serve():
    async with websockets.serve(_ws_handler, WS_HOST, WS_PORT):
        print(f"[WS] Puppet WebSocket server on ws://{WS_HOST}:{WS_PORT}")
        await asyncio.Future()  # run forever


def _start_ws_thread():
    asyncio.set_event_loop(_ws_loop)
    _ws_loop.run_until_complete(_serve())


threading.Thread(target=_start_ws_thread, daemon=True).start()


def _broadcast(payload: dict):
    """Thread-safe broadcast to all connected WebSocket clients."""
    if not _clients:
        return
    msg = json.dumps(payload)
    for client in list(_clients):
        asyncio.run_coroutine_threadsafe(client.send(msg), _ws_loop)


# ── Hand callback ───────────────────────────────────────────────────────────

def on_frame(bgr_frame):
    small = cv2.resize(bgr_frame, (320, 240))
    _, buf = cv2.imencode('.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 55])
    b64 = base64.b64encode(buf.tobytes()).decode()
    _broadcast({"type": "frame", "data": b64})


def on_hands(hands: list[HandState], timestamp_ms: int):
    if not hands:
        return
    entities = []
    for i, hand in enumerate(hands):
        entities.append({
            "animal": hand.pose.value,
            "x": round(hand.x * 100, 2),
            "y": round(hand.y * 100, 2),
            "orientation": hand.orientation,
            "angleMouth": hand.angleMouth,
            "facing": hand.facing.value,
        })
        print(f"[hand {i}] x={entities[-1]['x']} y={entities[-1]['y']} facing={entities[-1]['facing']} orientation={round(math.degrees(entities[-1]['orientation']), 1)}°", flush=True)
    _broadcast({"type": "hands", "entities": entities})


# ── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    normalizer = LandmarkNormalizer()
    match POSE:
        case Pose.RABBIT:
            classifier = AlwaysRabbitClassifier()
        case Pose.WOLF:
            classifier = AlwaysWolfClassifier()

    def on_raw_hands(raw_hands: list[RawHand], timestamp_ms: int):
        states = [
            state
            for hand in raw_hands
            if (state := interpret_landmarks(hand, normalizer, classifier)) is not None
        ]
        on_hands(states, timestamp_ms)

    tracker = HandTracker(callback=on_raw_hands, show_preview=not HEADLESS, max_hands=2, frame_callback=on_frame)
    tracker.run()
