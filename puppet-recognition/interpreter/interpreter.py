from classifier.hand_classifier import HandClassifier
from data.direction import Direction
from data.hand_state import HandState
from data.pose import Pose
from data.raw_hand import RawHand
from interpreter.rabbit_interpreter import RabbitInterpreter
from interpreter.wolf_interpreter import WolfInterpreter
from landmark_normalizer import LandmarkNormalizer


_INTERPRETERS = {
    Pose.RABBIT: RabbitInterpreter.interpret,
    Pose.WOLF: WolfInterpreter.interpret,
}

def interpret_landmarks(hand: RawHand, normalizer: LandmarkNormalizer, classifier: HandClassifier) -> HandState | None:
    normalized = normalizer.normalize(hand.landmarks)
    pose, confidence = classifier.classify(normalized)

    interpreter = _INTERPRETERS.get(pose)
    if interpreter is None:
        return None

    facing, orientation, angleMouth = interpreter(hand.landmarks)  # raw landmarks, not normalized

    return HandState(
        pose=pose,
        x=hand.x,
        y=hand.y,
        facing=facing,
        orientation=orientation,
        angleMouth=angleMouth,
        confidence=confidence,
    )