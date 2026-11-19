// Exports every frame in docs/design/wireframes/*.excalidraw to docs/design/wireframes/png/, and
// writes docs/design/wireframes/frames.md, a page with every frame.
//
//   npm --prefix scripts/wireframes ci
//   npm --prefix scripts/wireframes run setup       (once: downloads the headless browser)
//   npm --prefix scripts/wireframes run export      (all files)
//   npm --prefix scripts/wireframes run export -- browse.excalidraw --light
//
// It runs Excalidraw's own exportToBlob in headless Chromium, with the fonts served from the package,
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

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
