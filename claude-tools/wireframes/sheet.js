// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// kit.excalidraw: every kit piece laid out on one frame, so the kit can be reviewed as a PNG.
import { C, Doc } from './lib';
import { Board } from './frames';

/**
 * Finds the box around a set of elements, counting every point of a line.
 *
 * @param {object[]} els - Excalidraw elements.
 * @returns {{ x: number, y: number, w: number, h: number }} The left and top edges, width and height.
 * @example
 * bbox([
 *   { x: 0, y: 0, width: 10, height: 10 },
 *   { x: 20, y: 5, points: [[0, 0], [5, 30]] },
 * ]);
 * // → { x: 0, y: 0, w: 25, h: 35 }
 */
function bbox(els) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const e of els) {
    if (e.points) {
      for (const [px, py] of e.points) {
        x0 = Math.min(x0, e.x + px);
        y0 = Math.min(y0, e.y + py);
        x1 = Math.max(x1, e.x + px);
        y1 = Math.max(y1, e.y + py);
      }
    } else {
      x0 = Math.min(x0, e.x);
      y0 = Math.min(y0, e.y);
      x1 = Math.max(x1, e.x + e.width);
      y1 = Math.max(y1, e.y + e.height);
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Lays out every kit piece on one 2000 px wide frame, each with its name under it. Pieces taller than
 * 500 px (the sidebar, the windows) are only listed by name. Pieces from "Basic UX/wireframing
 * elements" are marked with *, and the credit is at the bottom.
 *
 * @param {{ libraryItems: object[] }} kit - The library, from `buildKit`.
 * @returns {{ d: import('./lib').Doc, frame: object }} The drawing, and its one frame.
 * @example
 * const { d, frame } = buildKitSheet(buildKit(thirdParty));
 * frame.name;
 * // → 'Kit · D W M'
 */
export default function buildKitSheet(kit) {
  const d = new Doc('kitsheet');
  const B = new Board(d);
  const W = 2000;
  B.frame(
    'Kit · D W M',
    { w: W, h: 2600 },
    (s) => {
      let x = s.x + 32;
      let y = s.y + 32;
      let rowH = 0;
      d.text(
        x,
        y,
        'kit.excalidrawlib: open the library panel in Excalidraw and drag these in.',
        { size: 18, color: C.muted }
      );
      y += 56;
      const pieces = kit.libraryItems.map((it) => ({
        it,
        b: bbox(it.elements),
      }));
      const big = pieces.filter(({ b }) => b.h > 500).map(({ it }) => it.name);
      for (const { it, b } of pieces.filter((p) => p.b.h <= 500)) {
        const cellW = Math.max(b.w, 120);
        if (x + cellW > s.x + W - 32) {
          x = s.x + 32;
          y += rowH + 56;
          rowH = 0;
        }
        // Each copy gets new ids, so the sheet never shares an id with the library
        const ids = new Map();
        const map = (id) => {
          if (!ids.has(id)) ids.set(id, d.nextId());
          return ids.get(id);
        };
        for (const e of it.elements) {
          const seed = d.seed();
          d.elements.push({
            ...e,
            id: map(e.id),
            x: e.x - b.x + x,
            y: e.y - b.y + y,
            groupIds: (e.groupIds ?? []).map(map),
            frameId: d.frameId,
            containerId: e.containerId
              ? map(e.containerId)
              : (e.containerId ?? null),
            boundElements: e.boundElements
              ? e.boundElements.map((be) => ({ ...be, id: map(be.id) }))
              : null,
            seed: e.seed ?? seed,
          });
        }
        d.text(x, y + b.h + 8, it.name.replace(/ · from Basic UX.*$/, ' *'), {
          size: 12,
          color: C.muted,
          wrap: Math.max(cellW, 140),
        });
        x += Math.max(cellW, 140) + 40;
        rowH = Math.max(rowH, b.h + 30);
      }
      y += rowH + 40;
      d.text(
        s.x + 32,
        y,
        `Also in the library, too big to show here: ${big.join(', ')}.`,
        { size: 14, color: C.muted }
      );
      y += 32;
      d.text(
        s.x + 32,
        y,
        '* From "Basic UX/wireframing elements" by Gabriela Macakova, libraries.excalidraw.com, MIT licence.',
        { size: 14, color: C.muted }
      );
      s.usedH = y + 40 - s.y;
    },
    { bare: true }
  );
  return { d, frame: d.elements.at(-1) };
}
