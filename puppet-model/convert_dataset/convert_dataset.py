import os
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

for root, dirs, files in os.walk("../dataset/puppet_data_sample"):
    for fname in files:
        if fname.lower().endswith(".heic"):
            path = os.path.join(root, fname)
            img = Image.open(path)
            out = path.rsplit(".", 1)[0] + ".jpg"
            img.save(out, "JPEG")
            os.remove(path)
