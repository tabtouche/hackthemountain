from data.pose import Pose
from classifier.hand_classifier import HandClassifier
from data.raw_hand import RawHand

class AlwaysRabbitClassifier(HandClassifier):
    def classify(self, hand_landmarks, hand: RawHand) -> tuple[Pose, float]:
        return Pose.RABBIT, 1.0
