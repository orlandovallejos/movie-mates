// Runs inside the headless browser: Excalidraw's own export function, so the PNGs look exactly like
// excalidraw.com. esbuild bundles this file; export.mjs serves it and calls window.exportFrame.
import { exportToCanvas } from '@excalidraw/excalidraw';

// Excalidraw's dark mode is the CSS filter "invert(93%) hue-rotate(180deg)". Drawing through that filter
// takes seconds per frame in headless Chromium (no GPU), so the PNG is drawn light and the same filter
// is applied here as a color matrix, which takes milliseconds.
const INVERT = 0.93;
const HUE_180 = [
  [-0.574, 1.43, 0.144],
  [0.426, 0.43, 0.144],
  [0.426, 1.43, -0.856],
];

/**
 * Turns a light export into Excalidraw's dark mode in place, pixel by pixel: the same result as the CSS
 * filter "invert(93%) hue-rotate(180deg)", in milliseconds instead of seconds.
 *
 * @param {HTMLCanvasElement} canvas - The canvas Excalidraw drew the frame on, light.
 * @returns {void} The canvas itself is changed.
 * @example
 * toDark(canvas);
 * // a white pixel (255, 255, 255) becomes (18, 18, 18); black (0, 0, 0) becomes (237, 237, 237)
 */
function toDark(canvas) {
  const ctx = canvas.getContext('2d');
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = INVERT * 255 + (1 - 2 * INVERT) * px[i];
    const g = INVERT * 255 + (1 - 2 * INVERT) * px[i + 1];
    const b = INVERT * 255 + (1 - 2 * INVERT) * px[i + 2];
    px[i] = HUE_180[0][0] * r + HUE_180[0][1] * g + HUE_180[0][2] * b;
    px[i + 1] = HUE_180[1][0] * r + HUE_180[1][1] * g + HUE_180[1][2] * b;
    px[i + 2] = HUE_180[2][0] * r + HUE_180[2][1] * g + HUE_180[2][2] * b;
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * Draws one frame with Excalidraw's own export and returns it as a PNG. export.mjs calls it once per frame.
 *
 * @param {object} input - What to draw.
 * @param {object[]} input.elements - The frame's children, then the frame.
 * @param {object} input.files - The scene's images, by ID (`{}` when there are none).
 * @param {boolean} input.dark - `true` for a dark background, as in Excalidraw's dark mode.
 * @param {number} input.scale - Pixels per Excalidraw unit; 2 for the repo's PNGs.
 * @returns {Promise<string>} The PNG, base64-encoded, to cross from the browser back to Node.
 * @example
 * await window.exportFrame({ elements, files: {}, dark: true, scale: 2 });
 * // 'iVBORw0KGgoAAAANSUhEUgAA…' (a 1280 × 800 frame with notes gives about 3,300 × 1,700 px)
 */
window.exportFrame = async ({ elements, files, dark, scale }) => {
  const canvas = await exportToCanvas({
    elements,
    files,
    exportPadding: 24,
    appState: {
      exportBackground: true,
      exportWithDarkMode: false,
      viewBackgroundColor: '#ffffff',
    },
    getDimensions: (width, height) => ({
      width: width * scale,
      height: height * scale,
      scale,
    }),
  });
  if (dark) toDark(canvas);
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

window.exporterReady = true;
