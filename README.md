# Fractal Art Explorer — Telegram Mini App v4.5

**Static web app for GitHub Pages.** This update starts from v4.4, retains the existing fractal catalog, artistic presets, palettes, animated five-second splash, 2D CPU worker, BigInt deep zoom and WebGL2 3D engine.

## What changed in v4.5

### Full-screen: expand the real world instead of cropping or stretching

Tapping `⛶` retains the **current center, color palette, fractal, zoom per screen pixel, and (for 3D) viewing direction**. The image already visible remains in the center at the same apparent scale. The rendering engine recalculates the newly uncovered edges as the viewport grows. On exit, it adjusts scale back to the original stage size without losing the explored region.

A temporary image preview stays visible while the worker calculates the new viewport. Rendering progress is shown during the first fullscreen render, and disappears at completion. Subsequent navigation stays interactive. The fullscreen backdrop is a clean canvas, without `object-fit: cover`.

### Bottom PNG button: 3 qualities

Tap **↓ IMMAGINE** at the bottom of the fullscreen view (or **↓ PNG** on the regular screen), then select:

| Export | Pixel multiplier relative to screen | 2D maximum | 3D maximum |
|---|---:|---:|---:|
| Normale | 1× | 3 megapixels | 1 megapixel |
| HD | 2× | 8 megapixels | 1.7 megapixels |
| Ultra | 3× | 12 megapixels | 2.6 megapixels |

The pixel dimensions are also limited by device memory, aspect ratio and WebGL maximum buffer size. PNG export is **rendered separately** from the fullscreen canvas; selecting quality does not change the viewed artwork. The worker reports progress for pixel-based fractals. The three options can be expanded again after tapping the canvas. The bottom button fades out after a few seconds, leaving a clear screen for Android screenshots. To leave fullscreen, use Telegram Back, Esc on desktop, or hold your finger at the upper-right corner.

PNG downloads in Android Telegram WebView may be handled differently depending on the Telegram and Android versions. This app uses a Blob download link and additionally shows an image preview to long-press/save manually if the WebView blocks the download. **A static Mini App cannot force saving directly to a private Telegram storage directory.**

### Performance and compatibility

- Fast direct quadratic iteration for power=2 Mandelbrot/Julia/Multibrot, avoiding expensive trigonometry on every pixel.
- Cancelable worker render jobs; transformed preview while moving and zooming.
- WebGL2 3D render with separate export context where supported.
- Corrects pointer capture so taps on export controls aren't swallowed by canvas dragging.
- Offline service worker cache updated to v4.5; navigation is now network-first, with offline fallback.
- No external backend is needed. Fonts and Telegram script load over HTTPS when available.

## Deploy on GitHub Pages

1. Extract the ZIP **contents directly into your GitHub repository root**, retaining `js/` and `assets/`.
2. Open **Settings → Pages → Deploy from a branch** and choose the `main` branch and `/ (root)`.
3. Wait for GitHub to publish the `https://USERNAME.github.io/REPOSITORY/` URL.
4. Configure that HTTPS URL as your bot's Telegram Mini App URL in BotFather.
5. Relaunch the Mini App to load the new cache. A stubborn previous offline cache may require closing and reopening the Telegram Mini App.

## Verification

- JavaScript syntax checks and HTML selector checks.
- Local rendering worker test for Mandelbrot.
- Browser-integrated checks of 2D fullscreen center and zoom preservation, Sierpiński zoom, 1× PNG download and return to normal layout.
- The 3D GPU path is **not verified on Telegram Android** in this environment: it requires device testing.

Licensed under the terms of `LICENSE`.
