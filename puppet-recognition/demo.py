import cv2
import time
import threading
import mediapipe as mp
from mediapipe.tasks.python.vision import drawing_utils
from mediapipe.tasks.python.vision.hand_landmarker import HandLandmarksConnections

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
HandLandmarkerResult = mp.tasks.vision.HandLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode

# Create a hand landmarker instance with the live stream mode:
annotated_frame = None
annotated_lock = threading.Lock()


def print_result(result: HandLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
  # Convert MediaPipe Image -> numpy (RGB), then to BGR for OpenCV drawing
  try:
    img = output_image.numpy_view()
  except Exception:
    return

  bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

  # Draw hand landmarks and connections
  if result.hand_landmarks:
    for i, hand_landmarks in enumerate(result.hand_landmarks):
      drawing_utils.draw_landmarks(
        bgr,
        hand_landmarks,
        HandLandmarksConnections.HAND_CONNECTIONS,
      )

      # Draw handedness label if available
      if result.handedness and i < len(result.handedness):
        category = result.handedness[i][0]
        label = f"{category.category_name}: {category.score:.2f}"
        # Use landmark 0 (wrist) to place the label
        if hand_landmarks and len(hand_landmarks) > 0:
          wrist = hand_landmarks[0]
          x_px = int(wrist.x * bgr.shape[1])
          y_px = int(wrist.y * bgr.shape[0])
          cv2.putText(bgr, label, (x_px, max(0, y_px - 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

  # Store annotated frame for the main loop to display
  with annotated_lock:
    global annotated_frame
    annotated_frame = bgr.copy()


options = HandLandmarkerOptions(
  base_options=BaseOptions(model_asset_path='hand_landmarker.task'),
  running_mode=VisionRunningMode.LIVE_STREAM,
  result_callback=print_result)
with HandLandmarker.create_from_options(options) as landmarker:
  # Use OpenCV's VideoCapture to start capturing from the webcam.
  cap = cv2.VideoCapture(0)

  try:
    while cap.isOpened():
      success, frame = cap.read()
      if not success:
        print('Ignoring empty camera frame.')
        continue

      # Convert BGR (OpenCV) to RGB
      rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

      # Create a MediaPipe Image and send it to the landmarker in live-stream mode
      mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
      timestamp_ms = int(time.time() * 1000)
      landmarker.detect_async(mp_image, timestamp_ms)

      # Optional: show the camera feed locally. Prefer annotated frame if available.
      with annotated_lock:
        frame_to_show = annotated_frame.copy() if annotated_frame is not None else None

      if frame_to_show is not None:
        display_frame = frame_to_show
      else:
        display_frame = frame

      cv2.imshow('MediaPipe Hands (live)', display_frame)
      if cv2.waitKey(5) & 0xFF == 27:
        break
  finally:
    cap.release()
    cv2.destroyAllWindows()