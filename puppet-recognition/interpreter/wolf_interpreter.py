import math

from data.direction import Direction


class WolfInterpreter:
    ORIENTATION_CORRECTION_RAD = math.radians(0)
    MOUTH_CORRECTION_RAD = math.radians(-7)

    @staticmethod
    def interpret(landmarks) -> tuple[Direction, float, float]:
        """Returns (direction, orientation, angleMouth)."""

        wrist     = landmarks[0]
        thumbVec  = (landmarks[2].x - wrist.x, landmarks[2].y - wrist.y)
        middleVec = (landmarks[11].x - landmarks[9].x, landmarks[11].y - landmarks[9].y)

        ringVec   = (landmarks[15].x - landmarks[13].x, landmarks[15].y - landmarks[13].y)
        pinkyVec  = (landmarks[19].x - landmarks[17].x, landmarks[19].y - landmarks[17].y)
        ringUnit  = WolfInterpreter._normalize(ringVec)
        pinkyUnit = WolfInterpreter._normalize(pinkyVec)
        angleMouth = math.acos(ringUnit[0] * pinkyUnit[0] + ringUnit[1] * pinkyUnit[1])  # dot product
        angleMouth += WolfInterpreter.MOUTH_CORRECTION_RAD

        det = middleVec[0] * thumbVec[1] - middleVec[1] * thumbVec[0]
        facing = Direction.RIGHT if det > 0 else Direction.LEFT

        orientation = WolfInterpreter.ORIENTATION_CORRECTION_RAD
        if facing == Direction.LEFT:
            orientation += math.atan2(middleVec[1], middleVec[0])
        else:
            orientation += math.atan2(middleVec[1], -middleVec[0])
            orientation *= -1
        
        return (facing, orientation, angleMouth)
    
    def _normalize(v: tuple[float, float]) -> tuple[float, float]:
        mag = math.sqrt(v[0]**2 + v[1]**2)
        return (v[0] / mag, v[1] / mag) if mag > 0 else (0.0, 0.0)
