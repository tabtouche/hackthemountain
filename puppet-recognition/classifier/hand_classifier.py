from abc import ABC, abstractmethod

from data.pose import Pose

class HandClassifier(ABC):
    @abstractmethod
    def classify(self, hand_landmarks) -> tuple[Pose, float]:
        """Returns (pose, confidence)."""
        pass
