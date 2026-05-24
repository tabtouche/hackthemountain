import os
import cv2
import tensorflow as tf
assert tf.__version__.startswith('2')

from mediapipe_model_maker import gesture_recognizer

import matplotlib.pyplot as plt


#############################################################
# Get the dataset
#############################################################

dataset_path = "dataset/puppet_data_sample"

print(dataset_path)
labels = []
for i in os.listdir(dataset_path):
  if os.path.isdir(os.path.join(dataset_path, i)):
    labels.append(i)
print(labels)

if (not os.path.exists("preview")):
  os.makedirs("preview")

NUM_EXAMPLES = 5

for label in labels:
  label_dir = os.path.join(dataset_path, label)
  example_filenames = os.listdir(label_dir)[:NUM_EXAMPLES]
  fig, axs = plt.subplots(1, NUM_EXAMPLES, figsize=(10,2))
  for i in range(NUM_EXAMPLES):
    axs[i].imshow(plt.imread(os.path.join(label_dir, example_filenames[i])))
    axs[i].get_xaxis().set_visible(False)
    axs[i].get_yaxis().set_visible(False)
  fig.suptitle(f'Showing {NUM_EXAMPLES} examples for {label}')
  plt.savefig(f"preview/preview_{label}.png")


#############################################################
# Augment the dataset (once)
#############################################################

def augment_dataset(dataset_path: str, rotations: list[float] = [-30, -15, 15, 30]):
    sentinel = os.path.join(dataset_path, ".augmented")
    if os.path.exists(sentinel):
        print("Dataset already augmented, skipping.")
        return

    for label in os.listdir(dataset_path):
        label_dir = os.path.join(dataset_path, label)
        if not os.path.isdir(label_dir):
            continue

        originals = [
            f for f in os.listdir(label_dir)
            if not f.endswith("_rot") and f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        for filename in originals:
            img_path = os.path.join(label_dir, filename)
            img = cv2.imread(img_path)
            if img is None:
                continue

            h, w = img.shape[:2]
            center = (w // 2, h // 2)

            for angle in rotations:
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

                stem, ext = os.path.splitext(filename)
                out_name = f"{stem}_rot{int(angle)}{ext}"
                cv2.imwrite(os.path.join(label_dir, out_name), rotated)

        print(f"{label}: {len(originals)} originals -> {len(originals) * (1 + len(rotations))} total")

augment_dataset(dataset_path, rotations=[-30, -15, 15, 30])


#############################################################
# Load the dataset
#############################################################

data = gesture_recognizer.Dataset.from_folder(
    dirname=dataset_path,
    hparams=gesture_recognizer.HandDataPreprocessingParams()
)
train_data, rest_data = data.split(0.8)
validation_data, test_data = rest_data.split(0.5)


#############################################################
# Train the model
#############################################################

hparams = gesture_recognizer.HParams(export_dir="exported_model")
hparams.epochs = 40
options = gesture_recognizer.GestureRecognizerOptions(hparams=hparams)
model = gesture_recognizer.GestureRecognizer.create(
    train_data=train_data,
    validation_data=validation_data,
    options=options
)


#############################################################
# Evaluate the model performance
#############################################################

loss, acc = model.evaluate(test_data, batch_size=1)
print(f"Test loss:{loss}, Test accuracy:{acc}")


#############################################################
# Evaluate the model performance
#############################################################

model.export_model()
