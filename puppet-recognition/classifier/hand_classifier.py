from abc import ABC, abstractmethod
from typing import Optional

from data.pose import Pose
from data.raw_hand import RawHand

class HandClassifier(ABC):
    @abstractmethod
    def classify(self, hand_landmarks, hand: RawHand) -> tuple[Pose, float]:
        """Returns (pose, confidence)."""
        pass
