// Exports every frame in docs/design/wireframes/*.excalidraw to docs/design/wireframes/png/, and
// writes docs/design/wireframes/frames.md, a page with every frame.
//
//   npm --prefix scripts/wireframes ci
//   npm --prefix scripts/wireframes run setup       (once: downloads the headless browser)
//   npm --prefix scripts/wireframes run export      (all files)
//   npm --prefix scripts/wireframes run export -- browse.excalidraw --light
//
// It runs Excalidraw's own export (exportToCanvas, in page.js) in headless Chromium, with the fonts served from the package,
// so it needs no network and the PNGs match excalidraw.com.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const wireframes = path.resolve(here, '../../docs/design/wireframes');
const pngDir = path.join(wireframes, 'png');
const assets = path.join(here, 'node_modules/@excalidraw/excalidraw/dist/prod');
const SCALE = 2;
const ORIGIN = 'http://wireframes.localhost';

const args = process.argv.slice(2);
const dark = !args.includes('--light');
const only = args.filter((a) => !a.startsWith('--'));

// "Check your email · wrong code · M · AUTH-3 AUTH-5" → screen, state…, clients, story IDs
const CLIENTS = /^(D|W|M)( (D|W|M))*$/;
const IDS = /^[A-Z][A-Z0-9]*-\d+( [A-Z][A-Z0-9]*-\d+)*$/;

/**
 * Turns part of a frame name into the part of a file name it gives: lowercase words joined by hyphens,
 * without accents or punctuation.
 *
 * @param {string} text - Any text, such as a screen or a state from a frame name.
 * @returns {string} The slug. Empty when the text has no letters or digits.
 * @example
 * slugify('Check your email'); // 'check-your-email'
 * slugify('Text at 200%'); // 'text-at-200'
 * slugify('Añadir a la lista'); // 'anadir-a-la-lista'
 */
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Reads a frame name written as "Screen · state · layout · story IDs" (see the wireframes README).
 *
 * @param {string} name - The frame's name in Excalidraw. The state and the story IDs are optional; the
 *   layout is `D W`, `M` or `D W M`.
 * @returns {{ title: string, slug: string, ids: string[] } | { error: string }} The name without the IDs
 *   (`title`), the part of the PNG file name it gives (`slug`) and the story IDs (`ids`); or an `error`
 *   saying what the name should look like.
 * @example
 * parseName('Check your email · wrong code · M · AUTH-3 AUTH-5');
 * // { title: 'Check your email · wrong code · M', slug: 'check-your-email--wrong-code--m',
 * //   ids: ['AUTH-3', 'AUTH-5'] }
 * parseName('Home · D W');
 * // { title: 'Home · D W', slug: 'home--dw', ids: [] }
 * parseName('Home');
 * // { error: 'expected "Screen · state · D W · ID-1 ID-2" (state and IDs optional)' }
 */
function parseName(name) {
  const parts = name.split(' · ').map((p) => p.trim());
  const ids =
    parts.length > 1 && IDS.test(parts.at(-1)) ? parts.pop().split(' ') : [];
  const clients = parts.at(-1);
  if (parts.length < 2 || !CLIENTS.test(clients ?? '')) {
    return {
      error:
        'expected "Screen · state · D W · ID-1 ID-2" (state and IDs optional)',
    };
  }
  parts.pop();
  const slug = [
    ...parts.map(slugify),
    clients.replace(/ /g, '').toLowerCase(),
  ].join('--');
  return { title: [...parts, clients].join(' · '), slug, ids };
}

/**
 * Finds the frames in one .excalidraw file, with the elements to export for each and its PNG name, and
 * collects the names that need fixing.
 *
 * @param {{ elements: object[] }} scene - The parsed .excalidraw file.
 * @param {string} file - The file name, such as `shell.excalidraw`; its base name starts each PNG name.
 * @returns {{ area: string, frames: object[], problems: string[] }} The base name (`area`); one entry per
 *   frame with `frame`, `title`, `slug`, `ids`, `png` and `elements` (the frame's children, then the
 *   frame itself, which is what Excalidraw draws); and one message per bad or duplicate name.
 * @example
 * framesOf({ elements: [{ id: 'f1', type: 'frame', name: 'Home · D W' }] }, 'browse.excalidraw');
 * // { area: 'browse', problems: [], frames: [{ png: 'browse--home--dw.png', title: 'Home · D W', … }] }
 */
function framesOf(scene, file) {
  const live = scene.elements.filter((e) => !e.isDeleted);
  const frames = live.filter(
    (e) => e.type === 'frame' || e.type === 'magicframe'
  );
  const area = path.basename(file, '.excalidraw');
  const problems = [];
  const seen = new Map();
  const out = frames.map((frame) => {
    const parsed = parseName(frame.name ?? '');
    if (parsed.error)
      problems.push(`"${frame.name ?? '(no name)'}": ${parsed.error}`);
    const png = `${area}--${parsed.slug}.png`;
    if (seen.has(png))
      problems.push(
        `"${frame.name}" and "${seen.get(png)}" give the same file name`
      );
    seen.set(png, frame.name);
    const children = live.filter((e) => e.frameId === frame.id);
    return { frame, ...parsed, png, elements: [...children, frame] };
  });
  return { area, frames: out, problems };
}

/**
 * Bundles page.js with esbuild and opens it in headless Chromium. Every request is answered from disk
 * (the page, then Excalidraw's fonts from node_modules) and anything else is blocked, so the export never
 * uses the network.
 *
 * @returns {Promise<{ browser: import('playwright').Browser, page: import('playwright').Page }>} The
 *   browser, to close when done, and the page, where `window.exportFrame` is ready to call.
 * @example
 * const { browser, page } = await startBrowser();
 * const base64 = await page.evaluate((input) => window.exportFrame(input), input);
 * await browser.close();
 */
async function startBrowser() {
  const bundle = await build({
    entryPoints: [path.join(here, 'page.js')],
    bundle: true,
    format: 'esm',
    write: false,
    minify: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'error',
  });
  const js = bundle.outputFiles[0].text;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) return route.abort(); // never touch the network
    if (url.pathname === '/') {
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><meta charset="utf-8"><script>window.EXCALIDRAW_ASSET_PATH = "${ORIGIN}/assets/";</script><script type="module" src="/page.js"></script>`,
      });
    }
    if (url.pathname === '/page.js') {
      return route.fulfill({ contentType: 'text/javascript', body: js });
    }
    const file = path.join(
      assets,
      decodeURIComponent(url.pathname.replace(/^\/assets\//, ''))
    );
    if (
      url.pathname.startsWith('/assets/') &&
      file.startsWith(assets) &&
      fs.existsSync(file)
    ) {
      return route.fulfill({ path: file });
    }
    return route.fulfill({ status: 404 });
  });
  await page.goto(`${ORIGIN}/`);
  await page.waitForFunction(() => window.exporterReady);
  return { browser, page };
}

/**
 * Writes the Markdown of frames.md: one section per .excalidraw file, and under it every frame with its
 * story IDs and its PNG.
 *
 * @param {{ area: string, frames: { title: string, ids: string[], png: string }[] }[]} results - What
 *   `framesOf` returned for each file, in file name order.
 * @returns {string} The whole page, ending with one newline.
 * @example
 * galleryPage([{ area: 'browse', frames: [{ title: 'Home · D W', ids: ['HOME-1'], png: 'browse--home--dw.png' }] }]);
 * // '# Every frame\n\n…## browse\n\n…### Home · D W\n\nStories: HOME-1\n\n![Home · D W](png/browse--home--dw.png)\n'
 */
function galleryPage(results) {
  const lines = [
    '# Every frame',
    '',
    "Written by `scripts/wireframes/export.mjs` from the `.excalidraw` files; don't edit it by hand. How to",
    'edit and export the wireframes: [README](README.md).',
    '',
  ];
  for (const { area, frames } of results) {
    lines.push(
      `## ${area}`,
      '',
      `From [\`${area}.excalidraw\`](${area}.excalidraw).`,
      ''
    );
    for (const f of frames) {
      lines.push(`### ${f.title}`, '');
      if (f.ids.length) lines.push(`Stories: ${f.ids.join(', ')}`, '');
      lines.push(`![${f.title}](png/${f.png})`, '');
    }
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/**
 * Runs the export: checks every frame name, writes one PNG per frame of the chosen files, removes the PNGs
 * of renamed or deleted frames, and rewrites frames.md. Exits with code 1, listing the names to fix,
 * before writing anything when a name is wrong.
 *
 * @returns {Promise<void>} Resolves when every file is exported.
 * @example
 * // node export.mjs                      every file, dark background
 * // node export.mjs browse.excalidraw    one file
 * // node export.mjs --light              light background
 * await main();
 */
async function main() {
  const files = fs
    .readdirSync(wireframes)
    .filter((f) => f.endsWith('.excalidraw'))
    .sort();
  const selected = only.length ? files.filter((f) => only.includes(f)) : files;
  if (!selected.length)
    throw new Error(`No .excalidraw files to export in ${wireframes}`);

  const all = files.map((file) => {
    const scene = JSON.parse(
      fs.readFileSync(path.join(wireframes, file), 'utf8')
    );
    return { file, scene, ...framesOf(scene, file) };
  });
  const problems = all.flatMap((r) => r.problems.map((p) => `${r.file}: ${p}`));
  if (problems.length) {
    console.error(`Frame names to fix:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }

  fs.mkdirSync(pngDir, { recursive: true });
  const { browser, page } = await startBrowser();
  try {
    for (const r of all.filter((x) => selected.includes(x.file))) {
      const keep = new Set();
      for (const f of r.frames) {
        // One frame at a time: the page holds one export in memory at once.
        // eslint-disable-next-line no-await-in-loop
        const base64 = await page.evaluate(
          (input) => window.exportFrame(input),
          {
            elements: f.elements,
            files: r.scene.files ?? {},
            dark,
            scale: SCALE,
          }
        );
        fs.writeFileSync(
          path.join(pngDir, f.png),
          Buffer.from(base64, 'base64')
        );
        keep.add(f.png);
      }
      // PNGs of frames that were renamed or deleted
      for (const old of fs.readdirSync(pngDir)) {
        if (old.startsWith(`${r.area}--`) && !keep.has(old)) {
          fs.rmSync(path.join(pngDir, old));
          console.log(`  removed ${old}`);
        }
      }
      console.log(`${r.file}: ${r.frames.length} frames`);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(wireframes, 'frames.md'), galleryPage(all));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
