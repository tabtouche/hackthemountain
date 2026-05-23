from dataclasses import dataclass
from data.direction import Direction
from data.pose import Pose

@dataclass
class HandState:
    pose: Pose
    x: float
    y: float
    facing: Direction
    orientation: float
    angleMouth: float
    confidence: float
