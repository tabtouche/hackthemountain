from dataclasses import dataclass

@dataclass
class RawHand:
    landmarks: list
    x: float
    y: float
    gesture: str | None = None
    confidence: float | None = None
