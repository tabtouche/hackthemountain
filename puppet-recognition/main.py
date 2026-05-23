from classifier.always_rabbit import AlwaysRabbitClassifier
from data.raw_hand import RawHand
from hand_tracker import HandTracker
from data.hand_state import HandState
from interpreter.interpreter import interpret_landmarks
from landmark_normalizer import LandmarkNormalizer

def on_hands(hands: list[HandState], timestamp_ms: int):
    if not hands:
        print(f"[{timestamp_ms}] No hands detected")
        return

    for hand in hands:
        print(
            f"[{timestamp_ms}] "
            f"pose={hand.pose} ({hand.confidence:.2f})  "
            f"pos=({hand.x:.2f}, {hand.y:.2f})  "
            f"facing={hand.facing}  "
            f"angle={hand.orientation:.1f}°  "
            f"mouth={hand.angleMouth:.2f}"
        )

if __name__ == "__main__":
    normalizer = LandmarkNormalizer()
    classifier = AlwaysRabbitClassifier()
    
    def on_raw_hands(raw_hands: list[RawHand], timestamp_ms: int):
        states = [
            state
            for hand in raw_hands
            if (state := interpret_landmarks(hand, normalizer, classifier)) is not None
        ]
        on_hands(states, timestamp_ms)

    tracker = HandTracker(callback=on_raw_hands, show_preview=True, max_hands=2)
    tracker.run()
