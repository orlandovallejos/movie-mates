// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// Drafts the wireframes from code: shell.excalidraw, states.excalidraw, kit.excalidrawlib and kit.excalidraw.
// The drawing code runs in headless Chromium, so text is measured with the fonts Excalidraw uses, and the
// files are written into docs/design/wireframes.
//
//   node claude-tools/wireframes/run.mjs                    draft every file
//   node claude-tools/wireframes/run.mjs shell.excalidraw   draft only the files named
//   node claude-tools/wireframes/run.mjs --out <folder>     write into another folder, to compare
//
// It never overwrites hand edits. drafted.json keeps a fingerprint (SHA-256) of each file as this script
// last wrote it. A file that doesn't match its fingerprint was changed by a person (or is new and was never
// drafted), so the run stops, names the file and writes nothing. From then on that file is edited directly.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '../..');
const WIREFRAMES = path.join(repo, 'docs/design/wireframes');
const FINGERPRINTS = path.join(here, 'drafted.json');
// The packages come from the export script's folder, so both use the same Excalidraw version and
// Dependabot updates them once. Install them with: npm --prefix scripts/wireframes ci
const PACKAGES = path.join(repo, 'scripts/wireframes');
const requireFromPackages = createRequire(path.join(PACKAGES, 'package.json'));
const { build } = requireFromPackages('esbuild');
const { chromium } = requireFromPackages('playwright');

const FILES = [
  'shell.excalidraw',
  'states.excalidraw',
  'kit.excalidrawlib',
  'kit.excalidraw',
];
// A made-up origin that only exists inside the headless browser; every other request is blocked
const ORIGIN = 'http://drafts.localhost';
const NOTE =
  "Fingerprints of the wireframe files as Claude last drafted them. Written by run.mjs; don't edit. See claude-tools/README.md.";

/**
 * Fingerprints a file's content, to tell later whether someone changed it.
 *
 * @param {string} text - The file's content.
 * @returns {string} The SHA-256 hash, as 64 hexadecimal characters.
 * @example
 * sha256('hello');
 * // → '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
 */
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Reads the command line: an optional `--out <folder>` and the names of the files to draft.
 *
 * @param {string[]} args - The arguments after the script's name.
 * @returns {{ out: string | null, files: string[], problems: string[] }} The folder to write into (null for
 *   docs/design/wireframes), the files to draft (all of them when none is named), and what was wrong.
 * @example
 * parseArgs(['--out', '/tmp/drafts', 'shell.excalidraw']);
 * // → { out: '/tmp/drafts', files: ['shell.excalidraw'], problems: [] }
 * parseArgs(['auth.excalidraw']);
 * // → { out: null, files: [], problems: ['auth.excalidraw: not drafted here; drafted files are
 * //    shell.excalidraw, states.excalidraw, kit.excalidrawlib, kit.excalidraw'] }
 */
function parseArgs(args) {
  const outAt = args.indexOf('--out');
  const out = outAt === -1 ? null : (args[outAt + 1] ?? null);
  const named = args.filter(
    (_, i) => outAt === -1 || (i !== outAt && i !== outAt + 1)
  );
  const problems = [];
  if (outAt !== -1 && !out) problems.push('--out needs a folder');
  for (const name of named) {
    if (!FILES.includes(name))
      problems.push(
        `${name}: not drafted here; drafted files are ${FILES.join(', ')}`
      );
  }
  const files = named.filter((name) => FILES.includes(name));
  return { out, files: named.length ? files : FILES, problems };
}

/**
 * Finds the files a person changed since they were last drafted, so they aren't overwritten.
 *
 * A file is safe to write when it doesn't exist yet, when it still matches its fingerprint, or when it
 * already equals the new draft. Anything else is a hand edit, or a file a person made.
 *
 * @param {string[]} names - The files about to be written.
 * @param {Record<string, string>} drafts - The new content of each file, by name.
 * @param {Record<string, string>} fingerprints - The SHA-256 of each file when it was last drafted.
 * @returns {string[]} The names that must not be overwritten.
 * @example
 * // states.excalidraw was opened and saved in Excalidraw since the last draft
 * handEdited(['shell.excalidraw', 'states.excalidraw'], drafts, fingerprints);
 * // → ['states.excalidraw']
 */
function handEdited(names, drafts, fingerprints) {
  return names.filter((name) => {
    const target = path.join(WIREFRAMES, name);
    if (!fs.existsSync(target)) return false;
    const now = sha256(fs.readFileSync(target, 'utf8'));
    return now !== fingerprints[name] && now !== sha256(drafts[name]);
  });
}

/**
 * Bundles the drawing code, runs it in headless Chromium and returns every drafted file.
 *
 * The browser can only reach the made-up origin: the page, the bundle and Excalidraw's fonts are served
 * from disk and every other request is blocked, so drafting works offline.
 *
 * @returns {Promise<Record<string, string>>} The content of every file in FILES, by name.
 * @example
 * const drafts = await draftAll();
 * Object.keys(drafts);
 * // → ['shell.excalidraw', 'states.excalidraw', 'kit.excalidrawlib', 'kit.excalidraw']
 */
async function draftAll() {
  const bundle = await build({
    entryPoints: [path.join(here, 'main.js')],
    nodePaths: [path.join(PACKAGES, 'node_modules')],
    bundle: true,
    format: 'esm',
    write: false,
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'error',
  });
  const js = bundle.outputFiles[0].text;
  const assets = path.join(
    PACKAGES,
    'node_modules/@excalidraw/excalidraw/dist/prod'
  );
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('Error in the page:', e.message));
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== ORIGIN) return route.abort();
      if (url.pathname === '/') {
        return route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><meta charset="utf-8"><script>window.EXCALIDRAW_ASSET_PATH="${ORIGIN}/assets/"</script><script type="module" src="/drafts.js"></script>`,
        });
      }
      if (url.pathname === '/drafts.js')
        return route.fulfill({ contentType: 'text/javascript', body: js });
      const file = path.join(
        assets,
        decodeURIComponent(url.pathname.replace('/assets/', ''))
      );
      if (fs.existsSync(file)) return route.fulfill({ path: file });
      return route.fulfill({ status: 404 });
    });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => window.draftsReady);
    // The toggles and checkboxes from "Basic UX/wireframing elements" aren't drawn here: they are copied
    // from the kit file as it is in the repo.
    const kit = JSON.parse(
      fs.readFileSync(path.join(WIREFRAMES, 'kit.excalidrawlib'), 'utf8')
    );
    const thirdParty = kit.libraryItems.filter((item) =>
      item.name.includes('from Basic UX')
    );
    return await page.evaluate((items) => window.draftAll(items), thirdParty);
  } finally {
    await browser.close();
  }
}

/**
 * Drafts the files named on the command line and writes the ones that are safe to write.
 *
 * @returns {Promise<number>} The exit code: 0 when everything was written, 1 when nothing was.
 * @example
 * // node claude-tools/wireframes/run.mjs states.excalidraw
 * await main();
 * // prints "Drafted states.excalidraw" and returns 0
 */
async function main() {
  const { out, files, problems } = parseArgs(process.argv.slice(2));
  if (problems.length) {
    for (const problem of problems) console.error(problem);
    return 1;
  }
  const drafts = await draftAll();
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    for (const name of files)
      fs.writeFileSync(path.join(out, name), drafts[name]);
    console.log(`Drafted ${files.join(', ')} into ${out}`);
    return 0;
  }
  const { $comment, ...fingerprints } = fs.existsSync(FINGERPRINTS)
    ? JSON.parse(fs.readFileSync(FINGERPRINTS, 'utf8'))
    : {};
  const edited = handEdited(files, drafts, fingerprints);
  if (edited.length) {
    console.error(
      `Changed by hand since the last draft, so nothing was written: ${edited.join(', ')}.`
    );
    console.error(
      'Edit those files directly, or draft only the others by naming them.'
    );
    return 1;
  }
  for (const name of files) {
    fs.writeFileSync(path.join(WIREFRAMES, name), drafts[name]);
    fingerprints[name] = sha256(drafts[name]);
  }
  const sorted = Object.fromEntries(
    Object.entries(fingerprints).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(
    FINGERPRINTS,
    `${JSON.stringify({ $comment: NOTE, ...sorted }, null, 2)}\n`
  );
  console.log(`Drafted ${files.join(', ')}`);
  return 0;
}

process.exitCode = await main();
