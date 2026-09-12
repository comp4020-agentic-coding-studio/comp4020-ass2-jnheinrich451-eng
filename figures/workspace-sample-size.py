"""An editable 1D Gaussian experiment, not full Inception-feature FID.

Runs in the browser or ordinary Python with NumPy installed.
The browser draws the JSON-compatible `plot` variable after execution.
"""
import numpy as np

# Change these, then run again. Keep both candidates at the same N.
seed = 8412
sample_sizes = [16, 32, 64, 128, 512]
repeats = 100
mean_a, variance_a = 0.20, 1.0
mean_b, variance_b = 0.0, 1.5


def gaussian_distance(mean_r, variance_r, mean_g, variance_g):
    """Squared 2-Wasserstein distance between two 1D Gaussians."""
    return (mean_r - mean_g) ** 2 + (np.sqrt(variance_r) - np.sqrt(variance_g)) ** 2


def estimate(reference, candidate):
    return gaussian_distance(
        reference.mean(axis=1), reference.var(axis=1, ddof=1),
        candidate.mean(axis=1), candidate.var(axis=1, ddof=1),
    )


rng = np.random.default_rng(seed)
population_a = float(gaussian_distance(0, 1, mean_a, variance_a))
population_b = float(gaussian_distance(0, 1, mean_b, variance_b))
estimated_a, estimated_b = [], []
print(f"seed={seed}; repeats={repeats}; reference=N(0, 1)")
print(f"A=N({mean_a}, {variance_a}); B=N({mean_b}, {variance_b}) [mean, variance]")
print(f"Population: A={population_a:.8f}, B={population_b:.8f}")
print("N       mean A       mean B       fraction of trials A < B")
for n in sample_sizes:
    if n < 2 or repeats < 1:
        raise ValueError("Use N >= 2 and repeats >= 1")
    reference = rng.normal(0, 1, (repeats, n))
    a = rng.normal(mean_a, np.sqrt(variance_a), (repeats, n))
    b = rng.normal(mean_b, np.sqrt(variance_b), (repeats, n))
    scores_a, scores_b = estimate(reference, a), estimate(reference, b)
    estimated_a.append(float(scores_a.mean()))
    estimated_b.append(float(scores_b.mean()))
    print(f"{n:<7} {estimated_a[-1]:.8f}   {estimated_b[-1]:.8f}   {np.mean(scores_a < scores_b):.3f}")

# The workspace accepts up to 8 series of finite [x, y] coordinates.
# Rename, replace or add series here to visualise your own computations.
plot = {
    "title": "Fixed distributions, changing sample size",
    "xLabel": "Sample size N (linear scale)",
    "yLabel": "1D Gaussian distance",
    "series": [
        {"name": "A · mean estimate", "points": list(zip(sample_sizes, estimated_a))},
        {"name": "B · mean estimate", "points": list(zip(sample_sizes, estimated_b))},
        {"name": "A · population", "points": [[n, population_a] for n in sample_sizes]},
        {"name": "B · population", "points": [[n, population_b] for n in sample_sizes]},
    ],
}
print("\nPlot coordinates:")
for series in plot["series"]:
    print(series["name"], series["points"])
