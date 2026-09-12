// Pinned runtime. Loaded only after the student explicitly presses Run.
const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let python;
let globals;
let output = '';
const append = (text) => {
  if (output.length < 60000) output += `${text}\n`.slice(0, 60000 - output.length);
};
self.onmessage = async ({ data }) => {
  if (data.type !== 'run') return;
  output = '';
  try {
    if (!python) {
      self.postMessage({ type: 'status', text: 'Downloading Python and NumPy…' });
      const { loadPyodide } = await import(indexURL + 'pyodide.mjs');
      const loaded = await loadPyodide({ indexURL, stdout: append, stderr: append });
      await loaded.loadPackage('numpy');
      try { loaded.runPython('import numpy'); }
      catch {
        // A failed package fetch does not reject loadPackage. Retry once, then
        // report a startup error rather than running code without its library.
        self.postMessage({ type: 'status', text: 'Retrying the NumPy download…' });
        await loaded.loadPackage('numpy');
        loaded.runPython('import numpy');
      }
      python = loaded;
    }
    output = ''; // Runtime download messages are not the student's program output.
    self.postMessage({ type: 'running' });
    // Individual cells share a namespace. Run all explicitly rebuilds it.
    if (!globals || data.reset) {
      globals?.destroy();
      globals = python.runPython('dict(__name__="__main__")');
    }
    const readPlot = () => python.runPython(
      'import json as _workspace_json\n_workspace_json.dumps(globals().get("plot"), allow_nan=False)',
      { globals },
    );
    let previousPlot;
    try { previousPlot = readPlot(); } catch { previousPlot = undefined; }
    const result = await python.runPythonAsync(data.code, { globals });
    if (result !== undefined && result !== null) append(String(result));
    result?.destroy?.();
    // Only JSON data crosses into the UI. Never inject Python-generated HTML.
    const plot = readPlot();
    if (plot.length > 500000) throw new Error('Plot is too large. Limit it to 2,000 points per series.');
    self.postMessage({ type: 'done', output, plot: JSON.parse(plot), plotChanged: plot !== previousPlot || !!data.reset });
  } catch (error) {
    self.postMessage({ type: python ? 'error' : 'load-error', output, error: String(error).slice(0, 12000) });
  }
};
