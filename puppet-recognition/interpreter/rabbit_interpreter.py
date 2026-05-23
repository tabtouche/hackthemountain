import math
from data.direction import Direction

class RabbitInterpreter:
    ORIENTATION_CORRECTION_RAD = math.radians(-18)
    MOUTH_CORRECTION_RAD = math.radians(-29)  # tuned for better "mouth open" detection

    @staticmethod
    def interpret(landmarks) -> tuple[Direction, float, float]:
        wrist    = landmarks[0]
        pinkyTip = landmarks[20]

        indexVec  = (landmarks[7].x - landmarks[5].x, landmarks[7].y - landmarks[5].y)
        middleVec = (landmarks[11].x - landmarks[9].x, landmarks[11].y - landmarks[9].y)
        thumbVec  = (landmarks[4].x - landmarks[2].x, landmarks[4].y - landmarks[2].y)
        noseVec   = ((indexVec[0] + middleVec[0]) / 2, (indexVec[1] + middleVec[1]) / 2)
        beakVec   = ((noseVec[0] + thumbVec[0]) / 2, (noseVec[1] + thumbVec[1]) / 2)

        noseUnit = RabbitInterpreter._normalize(noseVec)
        thumbUnit = RabbitInterpreter._normalize(thumbVec)
        angleMouth = math.acos(noseUnit[0] * thumbUnit[0] + noseUnit[1] * thumbUnit[1])  # dot product
        angleMouth += RabbitInterpreter.MOUTH_CORRECTION_RAD

        orientation = math.atan2(-beakVec[1], beakVec[0])
        orientation += RabbitInterpreter.ORIENTATION_CORRECTION_RAD

        pinkyVec = (pinkyTip.x - wrist.x, pinkyTip.y - wrist.y)
        det = beakVec[0] * pinkyVec[1] - beakVec[1] * pinkyVec[0]
        facing = Direction.RIGHT if det > 0 else Direction.LEFT

        return (facing, orientation, angleMouth)
    
    def _normalize(v: tuple[float, float]) -> tuple[float, float]:
        mag = math.sqrt(v[0]**2 + v[1]**2)
        return (v[0] / mag, v[1] / mag) if mag > 0 else (0.0, 0.0)
