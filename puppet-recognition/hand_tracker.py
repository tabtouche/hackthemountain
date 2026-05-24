import cv2
import time
import threading
import mediapipe as mp
from mediapipe.tasks.python.vision import drawing_utils
from mediapipe.tasks.python.vision.hand_landmarker import HandLandmarksConnections
from typing import Callable

from data.raw_hand import RawHand

BaseOptions = mp.tasks.BaseOptions
GestureRecognizer = mp.tasks.vision.GestureRecognizer
GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
GestureRecognizerResult = mp.tasks.vision.GestureRecognizerResult
VisionRunningMode = mp.tasks.vision.RunningMode


class HandTracker:
    def __init__(
        self,
        callback: Callable[[list[RawHand], int], None],
        model_path: str,
        camera_index: int = 0,
        show_preview: bool = True,
        max_hands: int = 2,
    ):
        self.callback = callback
        self.model_path = model_path
        self.camera_index = camera_index
        self.show_preview = show_preview
        self.max_hands = max_hands

        self._annotated_frame = None
        self._annotated_lock = threading.Lock()
        self._running = False

    def _extract_raw(self, hand_landmarks) -> RawHand:
        lm = hand_landmarks
        x = 1.0 - lm[0].x
        y = 1.0 - lm[0].y

        return RawHand(landmarks=lm, x=x, y=y)

    def _on_result(self, result, output_image: mp.Image, timestamp_ms: int):
        if self.show_preview:
            self._update_preview(result, output_image)

        hands = []
        for lm in (result.hand_landmarks or []):
            hand = self._extract_raw(lm)
            if result.gestures:
                hand.gesture = result.gestures[0][0].category_name
                hand.confidence = result.gestures[0][0].score
            hands.append(hand)

        self.callback(hands, timestamp_ms)

    def _update_preview(self, result, output_image: mp.Image):
        try:
            img = output_image.numpy_view()
        except Exception:
            return

        bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

        if result.hand_landmarks:
            for i, hand_landmarks in enumerate(result.hand_landmarks):
                drawing_utils.draw_landmarks(
                    bgr,
                    hand_landmarks,
                    HandLandmarksConnections.HAND_CONNECTIONS,
                )
                # Show gesture label instead of handedness
                label_parts = []
                if result.handedness and i < len(result.handedness):
                    label_parts.append(result.handedness[i][0].category_name)
                if result.gestures and i < len(result.gestures) and result.gestures[i]:
                    g = result.gestures[i][0]
                    label_parts.append(f"{g.category_name} ({g.score:.2f})")
                
                if label_parts:
                    wrist = hand_landmarks[0]
                    x_px = int(wrist.x * bgr.shape[1])
                    y_px = int(wrist.y * bgr.shape[0])
                    cv2.putText(bgr, " | ".join(label_parts), (x_px, max(0, y_px - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        with self._annotated_lock:
            self._annotated_frame = cv2.flip(bgr, 1)

    def run(self):
        options = GestureRecognizerOptions(
            base_options=BaseOptions(model_asset_path=self.model_path),
            running_mode=VisionRunningMode.LIVE_STREAM,
            result_callback=self._on_result,
            num_hands=self.max_hands,
        )

        self._running = True
        with GestureRecognizer.create_from_options(options) as recognizer:
            cap = cv2.VideoCapture(self.camera_index)
            try:
                while self._running and cap.isOpened():
                    success, frame = cap.read()
                    if not success:
                        continue

                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                    recognizer.recognize_async(mp_image, int(time.time() * 1000))

                    if self.show_preview:
                        with self._annotated_lock:
                            display = self._annotated_frame.copy() if self._annotated_frame is not None else frame
                        cv2.imshow("MediaPipe Hands", display)
                        if cv2.waitKey(5) & 0xFF == 27:
                            break
            finally:
                self._running = False
                cap.release()
                cv2.destroyAllWindows()

    def stop(self):
        self._running = False
