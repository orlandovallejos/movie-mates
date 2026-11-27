// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// Flowcharts drawn in the same style as the wireframes, so a flow can sit next to its screens and export
// to a PNG the same way: boxes for screens and states, diamonds for questions, arrows with labels.
import { C } from './lib';

/** How each kind of box looks: a screen, a state on a screen, a start or end, or a question. */
const STYLE = {
  screen: { r: 10, fill: C.white, stroke: C.ink, sw: 1.5 },
  state: { r: 10, fill: C.fill, stroke: C.dim, dash: true },
  end: { r: 32, fill: C.mid, stroke: C.ink, sw: 1.5 },
};

/**
 * Draws a flowchart box centered on (cx, cy), with its text centered inside, and gives back its edges for
 * the arrows.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @param {string} text - What it says; the story IDs go on a last line of their own.
 * @param {object} [o] - `kind` ('screen', 'state', 'end' or 'question'), `w` (230; 220 for a question),
 *   `h` (70; 116 for a question), `ids` (the story IDs, smaller and gray), `size` (14).
 * @returns {{ cx: number, cy: number, l: number, r: number, t: number, b: number }} Its center and its
 *   left, right, top and bottom edges.
 * @example
 * flowBox(d, 710, 330, 'Enter your email', { ids: 'AUTH-2' });
 * // → { cx: 710, cy: 330, l: 595, r: 825, t: 295, b: 365 }
 */
export function flowBox(d, cx, cy, text, o = {}) {
  const kind = o.kind ?? 'screen';
  const question = kind === 'question';
  const w = o.w ?? (question ? 220 : 230);
  const h = o.h ?? (question ? 116 : 70);
  const box = {
    cx,
    cy,
    l: cx - w / 2,
    r: cx + w / 2,
    t: cy - h / 2,
    b: cy + h / 2,
  };
  d.group(() => {
    if (question) {
      d.diamond(box.l, box.t, w, h, { fill: C.white, stroke: C.ink, sw: 1.5 });
    } else {
      d.rect(box.l, box.t, w, h, STYLE[kind]);
    }
    const size = o.size ?? (question ? 13 : 14);
    const t = d.text(cx, cy, text, {
      size,
      align: 'center',
      wrap: question ? w * 0.62 : w - 24,
    });
    const idH = o.ids ? 18 : 0;
    t.y = cy - (t.height + idH) / 2;
    if (o.ids) {
      d.text(cx, t.y + t.height + 2, o.ids, {
        size: 11,
        color: C.muted,
        align: 'center',
      });
    }
  });
  return box;
}

/**
 * Draws an arrow through the given points, with an optional label on a small patch of background, so
 * it stays readable where it crosses the line.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {Array<[number, number]>} pts - The points, from the start to the head.
 * @param {object} [o] - `label`, and `at` (the label's center; by default the middle of the first
 *   segment), `dash` (for a way back, such as Try again).
 * @returns {void}
 * @example
 * flowArrow(d, [[710, 365], [710, 412]], { label: 'Send link' });
 */
export function flowArrow(d, pts, o = {}) {
  d.arrow(pts, { stroke: C.ink, sw: 1.5, dash: o.dash });
  if (!o.label) return;
  const [x, y] = o.at ?? [
    (pts[0][0] + pts[1][0]) / 2,
    (pts[0][1] + pts[1][1]) / 2,
  ];
  const t = d.text(x, y, o.label, { size: 12, color: C.text, align: 'center' });
  t.y = y - t.height / 2;
  const bg = d.rect(t.x - 6, t.y - 2, t.width + 12, t.height + 4, {
    r: 4,
    fill: C.white,
    stroke: C.white,
  });
  // the patch goes under the text
  d.elements.splice(d.elements.indexOf(bg), 1);
  d.elements.splice(d.elements.indexOf(t), 0, bg);
}
