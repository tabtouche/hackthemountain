from data.pose import Pose
from classifier.hand_classifier import HandClassifier

class AlwaysRabbitClassifier(HandClassifier):
    def classify(self, hand_landmarks) -> tuple[Pose, float]:
        return Pose.RABBIT, 1.0
