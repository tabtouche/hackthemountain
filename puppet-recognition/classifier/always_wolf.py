from data.pose import Pose
from classifier.hand_classifier import HandClassifier

class AlwaysWolfClassifier(HandClassifier):
    def classify(self, hand_landmarks) -> tuple[Pose, float]:
        return Pose.WOLF, 1.0
