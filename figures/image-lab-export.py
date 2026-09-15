"""Reproduce the small Image lab fixture and FID-specific ONNX encoder.

Development only, never executed by the deployed website. Dependencies are
isolated in assets/image-lab-tools; install commands are in build/image-lab.md.
The images are deterministic crops of NASA's public-domain Eileen Collins
photograph, distributed by scikit-image. They are NOT independent samples.
"""
from pathlib import Path
import hashlib
import io
import json
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'assets/image-lab-tools'))
import numpy as np
import torch
from PIL import Image
from pytorch_fid.inception import InceptionV3

OUT = ROOT / 'public/image-lab'
OUT.mkdir(parents=True, exist_ok=True)
CACHE = ROOT / 'assets/image-lab-cache'
CACHE.mkdir(parents=True, exist_ok=True)
torch.hub.set_dir(str(CACHE))
torch.set_num_threads(4)
SOURCE = 'https://raw.githubusercontent.com/scikit-image/scikit-image/v0.19.3/skimage/data/astronaut.png'
source = CACHE / 'astronaut.png'
if not source.exists():
    urllib.request.urlretrieve(SOURCE, source)
photo = Image.open(source).convert('RGB')
boxes = [(0,0), (128,0), (256,0), (0,128), (128,128), (256,128), (64,256), (256,256)]
arrays = {'reference': [], 'jpeg': []}
for i, (x, y) in enumerate(boxes):
    original = photo.crop((x,y,x+256,y+256)).resize((128,128), Image.Resampling.LANCZOS)
    encoded = io.BytesIO()
    original.save(encoded, format='JPEG', quality=10, subsampling=2)
    encoded.seek(0)
    compressed = Image.open(encoded).convert('RGB')
    for name, image in [('reference', original), ('jpeg', compressed)]:
        image.save(OUT / f'{name}-{i+1}.png')
        arrays[name].append(np.asarray(image, dtype=np.float32).transpose(2,0,1) / 255)

class Features(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = InceptionV3([3], use_fid_inception=True).eval()
    def forward(self, x):
        return self.encoder(x)[0].flatten(1)

model = Features().eval()
target = OUT / 'fid-inception-v3.onnx'
if not target.exists():
    with torch.no_grad():
        torch.onnx.export(model, torch.from_numpy(arrays['reference'][0][None]), str(target),
                          input_names=['images'], output_names=['features'], opset_version=17,
                          dynamo=False, external_data=False)
print(f'ONNX bytes: {target.stat().st_size}', flush=True)
features = {}
with torch.no_grad():
    for name, inputs in arrays.items():
        features[name] = np.concatenate([model(torch.from_numpy(a[None])).numpy() for a in inputs]).astype(np.float64)

def distance(a, b):
    mean = np.square(a.mean(0) - b.mean(0)).sum()
    x = (a - a.mean(0)) / np.sqrt(len(a)-1)
    y = (b - b.mean(0)) / np.sqrt(len(b)-1)
    # Same full 2048-dimensional covariance distance, evaluated through its
    # small sample factors. No PCA, projection, or diagonal approximation.
    cross = np.linalg.svd(x @ y.T, compute_uv=False).sum()
    covariance = np.square(x).sum() + np.square(y).sum() - 2 * cross
    return {'mean': float(mean), 'covariance': float(covariance), 'total': float(mean+covariance)}

scores = {name: distance(features['reference'], values) for name, values in features.items()}
manifest = {
    'version': 1, 'count': 8, 'width': 128, 'height': 128, 'dimensions': 2048,
    'source': SOURCE, 'credit': 'NASA / Eileen Collins, via scikit-image (public domain)',
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'modelSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'modelBytes': target.stat().st_size,
    'encoder': 'pytorch-fid 0.3.0 / FID Inception-v3 / pool3 2048 / float32 / ONNX opset 17',
    'preprocessing': 'Lossless 128x128 RGB fixture pixels divided by 255; model resizes bilinearly to 299x299 with align_corners=False, then maps [0,1] to [-1,1].',
    'candidate': 'Pillow JPEG quality=10, subsampling=2, decoded and saved losslessly as PNG.',
    'covariance': 'Full covariance, ddof=1; sample-factor SVD identity; no dimensionality reduction.',
    'versions': {'torch': torch.__version__, 'numpy': np.__version__, 'pillow': Image.__version__},
    'scores': scores,
    'features': {name: values.tolist() for name, values in features.items()},
}
(OUT / 'reference.json').write_text(json.dumps(manifest, separators=(',',':')), encoding='utf8')
for name, score in scores.items():
    print(name, json.dumps(score), flush=True)
print('Model SHA256:', manifest['modelSha256'], flush=True)
# Keep original upstream license with the redistributed converted model.
urllib.request.urlretrieve('https://raw.githubusercontent.com/mseitzer/pytorch-fid/master/LICENSE', OUT / 'FID-LICENSE.txt')
