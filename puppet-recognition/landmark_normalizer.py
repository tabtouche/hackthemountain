import numpy as np

class LandmarkNormalizer:
    def __init__(self, anchor: int = 0, scale_ref: tuple[int, int] = (0, 9)):
        """
        anchor      — landmark index to translate to origin (default: wrist)
        scale_ref   — pair of landmark indices whose distance defines the scale unit
                      (default: wrist to middle-finger MCP)
        """
        self.anchor = anchor
        self.scale_ref = scale_ref

    def normalize(self, landmarks) -> np.ndarray:
        pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])

        # Translate
        pts -= pts[self.anchor]

        # Scale
        scale = np.linalg.norm(pts[self.scale_ref[1]] - pts[self.scale_ref[0]])
        if scale > 0:
            pts /= scale

        return pts.flatten()  # shape: (63,)
