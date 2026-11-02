# Fractint Mobile — Telegram Mini App

Static HTML/JavaScript mini app, no backend required. Uses WebGL for interactive Mandelbrot, Julia and Burning Ship rendering.

## GitHub Pages
1. Upload the contents of this folder to the root of a GitHub repository.
2. In **Settings → Pages**, publish from the `main` branch and `/ (root)`.
3. Use the resulting HTTPS URL as the Telegram bot's Mini App URL.

`index.html` loads the Telegram Web App SDK from Telegram's official CDN. The fractal renderer and app code are local files.

## Controls
- Drag: pan
- Pinch: zoom around the midpoint
- Double tap: zoom in
- Top-left menu: formula, palette, iterations, detail
- PNG button: export the current canvas

For deeper zooms beyond ordinary WebGL floating-point precision, a future version can add perturbation / high-precision rendering.
