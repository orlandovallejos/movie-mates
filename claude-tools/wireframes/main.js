// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// The entry point that run.mjs bundles and loads in headless Chromium. It waits for Excalidraw's fonts,
// then builds every wireframe file and hands them back as text.
// The package comes from scripts/wireframes/node_modules, which run.mjs gives esbuild as a search path.
// eslint-disable-next-line import/no-unresolved
import { exportToBlob } from '@excalidraw/excalidraw';
import buildAuth from './auth';
import buildShell from './shell';
import buildStates from './states';
import buildKit from './kit';
import buildKitSheet from './sheet';

/**
 * Turns a drawing into the text of an `.excalidraw` file, as excalidraw.com saves it.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @returns {string} The file's JSON, indented by two spaces and ending with a new line.
 * @example
 * scene(new Doc('empty'));
 * // → '{\n  "type": "excalidraw",\n  "version": 2,\n  "source": "https://excalidraw.com",\n  "elements": [],\n …'
 */
function scene(d) {
  const file = {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements: d.elements,
    appState: {
      gridSize: 20,
      gridStep: 5,
      gridModeEnabled: false,
      viewBackgroundColor: '#ffffff',
    },
    files: {},
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/**
 * Loads Excalidraw's fonts (Nunito and Excalifont), so `measure` in lib.js measures text with them.
 *
 * Excalidraw only registers its fonts when it draws text, so this exports two tiny text elements.
 *
 * @returns {Promise<void>} Resolves once the fonts are ready.
 * @example
 * await loadFonts();
 * document.fonts.check('20px Nunito');
 * // → true
 */
async function loadFonts() {
  const text = {
    id: 'w',
    type: 'text',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    angle: 0,
    strokeColor: '#000',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: 1,
    version: 1,
    versionNonce: 1,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    text: 'Aa ção ñ · … ⌘K ›',
    originalText: 'Aa',
    fontSize: 20,
    fontFamily: 6,
    textAlign: 'left',
    verticalAlign: 'top',
    containerId: null,
    autoResize: true,
    lineHeight: 1.25,
  };
  await exportToBlob({
    elements: [text, { ...text, id: 'w2', fontFamily: 5 }],
    files: {},
    mimeType: 'image/png',
    appState: {},
  });
  await document.fonts.ready;
}

/**
 * Builds every drafted file. run.mjs calls it inside the page.
 *
 * @param {object[]} thirdParty - The kit items from "Basic UX/wireframing elements", copied as they are.
 * @returns {Promise<Record<string, string>>} The text of each file, by file name.
 * @example
 * const files = await window.draftAll(thirdParty);
 * Object.keys(files);
 * // → ['shell.excalidraw', 'states.excalidraw', 'kit.excalidrawlib', 'kit.excalidraw', 'auth.excalidraw']
 */
window.draftAll = async (thirdParty) => {
  await loadFonts();
  const kit = buildKit(thirdParty);
  return {
    'shell.excalidraw': scene(buildShell()),
    'states.excalidraw': scene(buildStates()),
    'kit.excalidrawlib': `${JSON.stringify(kit, null, 2)}\n`,
    'kit.excalidraw': scene(buildKitSheet(kit).d),
    'auth.excalidraw': scene(buildAuth()),
  };
};
window.draftsReady = true;
