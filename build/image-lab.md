## Open defects

- First-run assets are large: 87,132,983 bytes for the model and about 11 MB for WASM. Desktop recommended; no reduced-model substitution is made.
- Local files are limited to 2–8 images. Processing applies one crop/filter recipe to all candidate copies; independent reference/candidate dataset selection, per-image crop handles and video are outside this version. The tiny experiment is not a generative-model benchmark.
- Local image colour decoding and high-quality canvas resizing can vary across browsers. The local measurement record specifies that pipeline; its scores are not interchangeable with other FID preprocessing pipelines.
- Live inference has been verified in desktop Edge using WASM CPU. Narrow viewports are tested, but physical phones, Safari/Firefox and deployed GitHub Pages transfer times have not been verified.

## Accepted prototype

Route: `/image-lab/`, under Workspace and the shared three-tool lab navigation.
All execution is client-side. Static GitHub Pages hosting supplies images,
model and runtime. No API keys, upload requests, server inference, WebGPU or
cross-origin isolation headers are needed. The model/runtime are only requested
after the user explicitly starts a measurement. The model is SHA-256 checked.

The student compares original photo crops with JPEG-compressed versions,
measures actual image-based FID, then tries an identical-pixels control.
The output separates the mean and covariance contributions. A JSON export
retains runtime, model hash, pipeline settings, counts, score and feature
vectors. Results are not stored automatically. Changing settings, stopping,
or leaving terminates the worker and prevents stale results from being shown.
Failed runs present no score; there is a three-minute ceiling.

Prototype 02 adds candidate shuffling, a mean paired squared-feature-distance
readout (explicitly not FID), and local files. The paired readout is the sum of
squared differences over feature coordinates, averaged over displayed pairs.
Shuffling preserves the collection-level score and recomputes only the pairing
readout from cached features. The record retains the complete one-based
candidate permutation; feature arrays remain in original source order.

Local-file limits: JPEG/PNG only, 2–8 files, 5 MB each and 20 MB total,
4096 pixels per side, 16 MP each and 32 MP total. Header dimensions are
checked before decoding; animated PNG is rejected. Browser decode errors are
caught. Invalid selections leave previous images intact but invalidate results.
Replacing or clearing a selection cancels pending work; late decodes cannot
restore it. Original filenames are excluded from exported records.

`figures/image-lab-process.ts` generates the local previews. EXIF-oriented
images are composited on white and resized to at most 1024 pixels per side.
The fixed reference uses a centre-square crop to 128×128. Candidate controls
select square-crop zoom (1–3×), horizontal/vertical position and a pixel filter:
grayscale (.299R + .587G + .114B), edge-clamped 5×5 box blur, or brightness
×1.3 / ×0.7 with byte clipping. These operate on encoded RGB channel values,
not linear-light luminance. Apply updates the actual inference pixels and
previews together. Unapplied edits disable measurement and hide old results.

Local selection uses the browser's File API and image decoding, not an HTTP
upload. See [MDN's image decoding API](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap)
for orientation and colour-conversion behaviour. Browser-dependent resize
details are disclosed in the exported record. The record contains original
file hashes, dimensions, processing settings, crop rectangles and derived
feature vectors, but not filenames or original files. It should still be
treated as private image-derived data. Clear or leave to discard local state.

This extends Week 4's measurement contract to actual preprocessing and points
back to Week 5's finite-sample warning and the ongoing measurement log. There
is no quality verdict or leaderboard claim.

## Provenance and exact method

The public-domain NASA Eileen Collins photograph is supplied by scikit-image:
https://raw.githubusercontent.com/scikit-image/scikit-image/v0.19.3/skimage/data/astronaut.png

`figures/image-lab-export.py` generates every shipped image. It takes eight
fixed 256×256 crops, resizes them to 128×128 with Pillow Lanczos, then creates
the candidate with JPEG quality 10 and chroma subsampling 2. The JPEGs are
decoded and saved losslessly as PNG so Python and the browser consume the same
decoded RGB pixels. Crops overlap and are not independent samples.

The exported model is `pytorch-fid==0.3.0`'s **FID-specific** Inception-v3,
not the standard torchvision classification model. Input is float32 NCHW,
shape `[1,3,128,128]`, range [0,1]. The graph includes bilinear resize to
299×299 (`align_corners=False`) and mapping to [-1,1]. Pool3 output has
2,048 coordinates. ONNX opset 17, float32 weights; no quantisation.
The upstream licence accompanies the converted model in `public/image-lab/`.

Model SHA-256:
`0c9c5ec1201913dcdebdcccf8f6d8524145f599675a920c6f8995b4a0e4fbc73`

Feature means and full sample covariances use divisor n−1. For centred,
scaled sample factors X and Y, the covariance cross term equals the nuclear
norm of XYᵀ. Its small SVD evaluates the **same full 2,048-dimensional
covariance distance**, without PCA, diagonal approximation or discarded
correlations. A JavaScript one-sided Jacobi SVD uses float64 arithmetic.
Only tiny round-off residuals are clamped to zero. The Python reference uses
NumPy's independent SVD implementation.

`public/image-lab/reference.json` contains Python features, exact metadata,
source hash and reference scores for validation. The browser does **not**
fetch that file or use its values in live inference.

## Reproduce development assets

Python is for asset preparation and cross-validation only. It is not deployed.
The local export used Python 3.13, torch 2.11.0+cu128, torchvision, NumPy and
Pillow; exact versions are retained in the generated reference manifest.
Additional export packages were installed into the ignored local tools folder:

```powershell
python -m pip install --target assets/image-lab-tools --no-deps onnx==1.19.1 pytorch-fid==0.3.0 protobuf==6.33.0 ml_dtypes==0.5.3
python figures/image-lab-export.py
```

The script caches downloaded inputs in `assets/image-lab-cache`, generates
fixtures, exports the model if absent and prints the reference measurements.
The model cache avoids a repeat export; changing the export configuration
requires deliberately regenerating and validating the model and its pinned
hash together.

Browser dependency: `onnxruntime-web==1.22.0`; the prebundled runtime and WASM assets are
emitted by Vite and served from the site's own base path. Loading the prebuilt
runtime as an explicit asset also avoids Vite's worker-only dependency scan
missing it in development (an observed 504 Outdated Optimize Dep failure).
WASM uses one thread
inside a disposable Web Worker. The page itself remains responsive.

## Acceptance evidence, 15 September 2026

Production build and typecheck pass; 157 tests across 20 files pass. The build
checks 34 pages for accessibility and links, with no violations or broken links.

Real browser inference, against the production preview:

| Contribution | Browser WASM | Python reference |
| --- | ---: | ---: |
| Mean | 73.6605767092 | 73.6606346528 |
| Covariance | 160.0024415864 | 160.0025049676 |
| Total | 233.6630182956 | 233.6631396205 |

Maximum absolute feature difference: 0.000011682510375976562 across both
sets. Identical-pixels control: exactly 0 for both contributions. Local
desktop inference plus local asset transfer took about 5.3 seconds for JPEG
and 3.5 seconds for identity; these are not internet download estimates.

The browser regression checks export contents, download consent, worker
network requests, identity, cancellation, pending-result invalidation,
client-side navigation cleanup, unavailable assets and both themes at
1440/800/390. Both the usual development server and the built production
preview are exercised. Direct course navigation also passes its full browser
regression with the new third Workspace destination.
Screenshots: `build/image-lab-{sets,result}-{light,dark}-{width}.png`.
Numerical evidence: `build/image-lab-browser-result.json`.

Prototype 02 browser checks also select real local PNG files, run identity
and cropped/grayscale inference, compare every preview pixel with the worker
payload, verify shuffle without a new worker, inspect exported mappings and
settings, reject unsupported/oversized/corrupt selections, reset edits, clear
files and interrupt a pending decode. Editor screenshots are saved as
`build/image-lab-editor-{light,dark}-{width}.png`. Numerical input tests cover
file/count/byte limits, header dimensions, APNG rejection, crop geometry,
pixel filter arithmetic and permutation invariance versus pairing sensitivity.

Upload usability refinement: the chooser and prominent guidance explicitly
require 2–8 images selected together, with Ctrl/Command/Shift-click help.
Loading, rejection and success feedback is located immediately below the
chooser and announced as a live status. Single-file rejection names the count
instead of suggesting a file-size problem. Clear/cancel removes stale feedback;
a valid selection clears the error state. The hidden native file input is
explicitly hidden against theme overrides, while keyboard activation of the
custom button opens the multiple-file picker. Cross-section connections were
not changed. The browser test reproduces a single 1,800 KB selection and checks
feedback placement and recovery in both themes at 1440/800/390; screenshots:
`build/image-lab-upload-error-{light,dark}-{width}.png`.

```powershell
$env:SLOP_NO_SEARCH='1' # local Windows workaround only, never CI
pnpm.cmd check
node scripts/check-image-lab-browser.mjs
# For the built production preview:
$env:IMAGE_LAB_BASE='http://localhost:4323/comp4020-ass2-jnheinrich451-eng/'
node scripts/check-image-lab-browser.mjs
```

Windows environment note: pnpm's dependency-verification step attempted to
rerun the repository's Unix-only `prepare` hook after dependency addition.
`pnpm.cmd install --ignore-scripts --frozen-lockfile` completed the local
installation without changing that unrelated hook. The successful gate used
`$env:pnpm_config_verify_deps_before_run='false'` to avoid automatic reinstall
in the restricted shell; it did not skip typecheck, build, or tests.

Next decision belongs to the author: review the local-file interaction before
adding independent datasets or per-image editing. Keep the small-sample and
preprocessing limitations visible as the tool expands.
