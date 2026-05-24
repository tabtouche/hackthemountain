from data.raw_hand import RawHand
from classifier.hand_classifier import HandClassifier
from data.pose import Pose

class Model(HandClassifier):
    def classify(self, hand_landmarks, hand: RawHand) -> tuple[Pose, float]:
        pose: Pose
        match hand.gesture:
            case "rabbit":
                pose = Pose.RABBIT
            case "wolf":
                pose = Pose.WOLF
            case _:
                pose = Pose.UNKNOWN
        return pose, hand.confidence if hand.confidence is not None else 1.0
