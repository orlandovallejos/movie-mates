// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// The icons and components of the lo-fi kit. Every function draws into a Doc at absolute positions.
import { C, measure, pick, wrap } from './lib';

/** The icons' line style. */
const ICON = { sw: 1.5, rough: 0 };

/**
 * Lists points along part of a circle, to draw curves with a line.
 *
 * @param {number} cx - The circle's center, across.
 * @param {number} cy - The circle's center, down.
 * @param {number} r - The radius.
 * @param {number} a0 - The start angle, in radians (0 points right, π/2 down).
 * @param {number} a1 - The end angle, in radians.
 * @param {number} [n] - How many pieces the curve is made of (12).
 * @returns {Array<[number, number]>} n + 1 points.
 * @example
 * arc(0, 0, 10, 0, Math.PI, 2);
 * // → [[10, 0], [0, 10], [-10, 0]] (up to rounding)
 */
function arc(cx, cy, r, a0, a1, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * Draws one icon, centered on (cx, cy), as one group.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {string} name - One of ICONS in kit.js, such as 'heart', 'search' or 'bell'. An unknown name draws
 *   a dashed square, so a missing icon is easy to spot.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @param {number} [s] - The size in pixels (20).
 * @param {object} [o] - `color` (ink) and `sw` (stroke width, 1.5).
 * @returns {void}
 * @example
 * icon(d, 'heart', 10, 10, 20);
 * // adds 1 element: a closed line in the shape of a heart
 * icon(d, 'search', 10, 10, 20);
 * // adds 2 elements: the lens (an ellipse) and the handle (a line)
 */
export function icon(d, name, cx, cy, s = 20, o = {}) {
  const st = { ...ICON, stroke: o.color ?? C.ink, sw: o.sw ?? ICON.sw };
  const h = s / 2;
  return d.group(() => {
    switch (name) {
      case 'heart':
      case 'heart-filled': {
        const pts = [];
        for (let i = 0; i <= 32; i += 1) {
          const t = (Math.PI * 2 * i) / 32;
          const x = 16 * Math.sin(t) ** 3;
          const y =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);
          pts.push([cx + (x / 17) * h, cy - (y / 17) * h - h * 0.1]);
        }
        d.line(pts, {
          ...st,
          closed: true,
          fill: name === 'heart-filled' ? (o.color ?? C.ink) : 'transparent',
        });
        break;
      }
      case 'search':
        d.circle(cx - h * 0.15, cy - h * 0.15, s * 0.6, st);
        d.line(
          [
            [cx + h * 0.3, cy + h * 0.3],
            [cx + h * 0.85, cy + h * 0.85],
          ],
          { ...st, sw: st.sw + 0.5 }
        );
        break;
      case 'home':
        d.line(
          [
            [cx - h * 0.9, cy - h * 0.05],
            [cx, cy - h * 0.85],
            [cx + h * 0.9, cy - h * 0.05],
          ],
          st
        );
        d.line(
          [
            [cx - h * 0.6, cy - h * 0.25],
            [cx - h * 0.6, cy + h * 0.8],
            [cx + h * 0.6, cy + h * 0.8],
            [cx + h * 0.6, cy - h * 0.25],
          ],
          st
        );
        break;
      case 'list':
        for (const dy of [-0.55, 0, 0.55]) {
          d.circle(cx - h * 0.7, cy + dy * h, s * 0.08, {
            ...st,
            fill: st.stroke,
          });
          d.line(
            [
              [cx - h * 0.35, cy + dy * h],
              [cx + h * 0.85, cy + dy * h],
            ],
            st
          );
        }
        break;
      case 'matches':
        d.circle(cx - h * 0.3, cy, s * 0.62, st);
        d.circle(cx + h * 0.3, cy, s * 0.62, st);
        break;
      case 'people':
        d.circle(cx - h * 0.35, cy - h * 0.35, s * 0.32, st);
        d.line(
          arc(cx - h * 0.35, cy + h * 0.75, h * 0.55, Math.PI, Math.PI * 2),
          st
        );
        d.circle(cx + h * 0.45, cy - h * 0.45, s * 0.26, st);
        d.line(
          arc(
            cx + h * 0.5,
            cy + h * 0.55,
            h * 0.45,
            Math.PI * 1.15,
            Math.PI * 2
          ),
          st
        );
        break;
      case 'person':
        d.circle(cx, cy - h * 0.35, s * 0.4, st);
        d.line(arc(cx, cy + h * 0.9, h * 0.75, Math.PI, Math.PI * 2), st);
        break;
      case 'bell':
        d.line(
          [
            [cx - h * 0.75, cy + h * 0.45],
            [cx - h * 0.55, cy + h * 0.1],
            [cx - h * 0.55, cy - h * 0.25],
            ...arc(cx, cy - h * 0.25, h * 0.55, Math.PI, Math.PI * 2, 10).slice(
              1,
              -1
            ),
            [cx + h * 0.55, cy - h * 0.25],
            [cx + h * 0.55, cy + h * 0.1],
            [cx + h * 0.75, cy + h * 0.45],
            [cx - h * 0.75, cy + h * 0.45],
          ],
          st
        );
        d.line(arc(cx, cy + h * 0.5, h * 0.25, 0, Math.PI, 6), st);
        break;
      case 'gear':
        d.circle(cx, cy, s * 0.6, st);
        d.circle(cx, cy, s * 0.22, st);
        for (let i = 0; i < 8; i += 1) {
          const a = (Math.PI * 2 * i) / 8;
          d.line(
            [
              [cx + Math.cos(a) * h * 0.6, cy + Math.sin(a) * h * 0.6],
              [cx + Math.cos(a) * h * 0.95, cy + Math.sin(a) * h * 0.95],
            ],
            { ...st, sw: st.sw + 1 }
          );
        }
        break;
      case 'lock':
        d.rect(cx - h * 0.6, cy - h * 0.1, h * 1.2, h * 0.95, { ...st, r: 2 });
        d.line(
          arc(cx, cy - h * 0.1, h * 0.38, Math.PI, Math.PI * 2, 8).concat([
            [cx + h * 0.38, cy - h * 0.1],
          ]),
          st
        );
        d.line(
          [
            [cx - h * 0.38, cy - h * 0.1],
            [cx - h * 0.38, cy - h * 0.35],
          ],
          st
        );
        break;
      case 'back':
        d.line(
          [
            [cx + h * 0.3, cy - h * 0.7],
            [cx - h * 0.4, cy],
            [cx + h * 0.3, cy + h * 0.7],
          ],
          { ...st, sw: st.sw + 0.5 }
        );
        break;
      case 'forward':
        d.line(
          [
            [cx - h * 0.3, cy - h * 0.7],
            [cx + h * 0.4, cy],
            [cx - h * 0.3, cy + h * 0.7],
          ],
          { ...st, sw: st.sw + 0.5 }
        );
        break;
      case 'down':
        d.line(
          [
            [cx - h * 0.6, cy - h * 0.25],
            [cx, cy + h * 0.35],
            [cx + h * 0.6, cy - h * 0.25],
          ],
          st
        );
        break;
      case 'close':
        d.line(
          [
            [cx - h * 0.6, cy - h * 0.6],
            [cx + h * 0.6, cy + h * 0.6],
          ],
          st
        );
        d.line(
          [
            [cx + h * 0.6, cy - h * 0.6],
            [cx - h * 0.6, cy + h * 0.6],
          ],
          st
        );
        break;
      case 'plus':
        d.line(
          [
            [cx - h * 0.7, cy],
            [cx + h * 0.7, cy],
          ],
          st
        );
        d.line(
          [
            [cx, cy - h * 0.7],
            [cx, cy + h * 0.7],
          ],
          st
        );
        break;
      case 'more':
        for (const dx of [-0.6, 0, 0.6])
          d.circle(cx + dx * h, cy, s * 0.13, { ...st, fill: st.stroke });
        break;
      case 'check':
        d.line(
          [
            [cx - h * 0.65, cy],
            [cx - h * 0.15, cy + h * 0.5],
            [cx + h * 0.7, cy - h * 0.55],
          ],
          { ...st, sw: st.sw + 0.5 }
        );
        break;
      case 'play':
        d.line(
          [
            [cx - h * 0.4, cy - h * 0.6],
            [cx + h * 0.6, cy],
            [cx - h * 0.4, cy + h * 0.6],
            [cx - h * 0.4, cy - h * 0.6],
          ],
          { ...st, closed: true }
        );
        break;
      case 'offline':
        d.line(
          arc(cx, cy + h * 0.6, h * 1.1, Math.PI * 1.25, Math.PI * 1.75, 8),
          st
        );
        d.line(
          arc(cx, cy + h * 0.6, h * 0.65, Math.PI * 1.25, Math.PI * 1.75, 6),
          st
        );
        d.circle(cx, cy + h * 0.55, s * 0.12, { ...st, fill: st.stroke });
        d.line(
          [
            [cx - h * 0.8, cy - h * 0.8],
            [cx + h * 0.8, cy + h * 0.8],
          ],
          { ...st, sw: st.sw + 0.5 }
        );
        break;
      case 'alert':
        d.line(
          [
            [cx, cy - h * 0.85],
            [cx + h * 0.9, cy + h * 0.75],
            [cx - h * 0.9, cy + h * 0.75],
            [cx, cy - h * 0.85],
          ],
          { ...st, closed: true }
        );
        d.line(
          [
            [cx, cy - h * 0.3],
            [cx, cy + h * 0.25],
          ],
          st
        );
        d.circle(cx, cy + h * 0.5, s * 0.08, { ...st, fill: st.stroke });
        break;
      case 'trash':
        d.line(
          [
            [cx - h * 0.8, cy - h * 0.55],
            [cx + h * 0.8, cy - h * 0.55],
          ],
          st
        );
        d.line(
          [
            [cx - h * 0.25, cy - h * 0.55],
            [cx - h * 0.2, cy - h * 0.85],
            [cx + h * 0.2, cy - h * 0.85],
            [cx + h * 0.25, cy - h * 0.55],
          ],
          st
        );
        d.line(
          [
            [cx - h * 0.6, cy - h * 0.55],
            [cx - h * 0.45, cy + h * 0.85],
            [cx + h * 0.45, cy + h * 0.85],
            [cx + h * 0.6, cy - h * 0.55],
          ],
          st
        );
        break;
      case 'sort':
        d.line(
          [
            [cx - h * 0.4, cy + h * 0.8],
            [cx - h * 0.4, cy - h * 0.8],
            [cx - h * 0.8, cy - h * 0.35],
          ],
          st
        );
        d.line(
          [
            [cx + h * 0.4, cy - h * 0.8],
            [cx + h * 0.4, cy + h * 0.8],
            [cx + h * 0.8, cy + h * 0.35],
          ],
          st
        );
        break;
      case 'refresh':
        d.line(arc(cx, cy, h * 0.75, Math.PI * 0.1, Math.PI * 1.75, 14), st);
        d.line(
          [
            [cx + h * 0.75, cy - h * 0.85],
            [cx + h * 0.6, cy - h * 0.35],
            [cx + h * 0.1, cy - h * 0.5],
          ],
          st
        );
        break;
      case 'pointer':
        d.line(
          [
            [cx - h * 0.5, cy - h],
            [cx - h * 0.5, cy + h * 0.55],
            [cx - h * 0.12, cy + h * 0.2],
            [cx + h * 0.15, cy + h * 0.85],
            [cx + h * 0.4, cy + h * 0.72],
            [cx + h * 0.13, cy + h * 0.1],
            [cx + h * 0.6, cy + h * 0.1],
            [cx - h * 0.5, cy - h],
          ],
          { ...st, closed: true, fill: C.white, sw: 1.5 }
        );
        break;
      default:
        d.rect(cx - h, cy - h, s, s, { ...st, dash: true });
    }
  });
}

// --- Controls -------------------------------------------------------------------------------------

/** Button sizes: height, side padding and text size. 'lg' is the phone's 48 px target. */
const BTN = {
  md: { h: 36, pad: 16, size: 14 },
  lg: { h: 48, pad: 20, size: 16 },
  sm: { h: 28, pad: 10, size: 13 },
};

/**
 * Draws a button: a box, an optional icon, the label, and for a two-part button the ▾ part.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x0 - The left edge, or the center with `center: true`.
 * @param {number} y - The top edge.
 * @param {string} label - The text; '' for an icon-only button.
 * @param {object} [o] - `variant` ('primary', 'secondary' (the default), 'ghost', 'destructive'), `size`
 *   ('sm' 28 px, 'md' 36 px, 'lg' 48 px), `icon`, `w` (a fixed width), `menu` (adds the ▾ part),
 *   `disabled` (dashed and gray), `focused` (the focus ring), `center`.
 * @returns {{ w: number, h: number }} The size it takes.
 * @example
 * button(d, 0, 0, 'Like', { variant: 'primary', icon: 'heart' });
 * // → { w: 80, h: 36 }
 * button(d, 0, 0, 'Add to Watch later', { menu: true });
 * // → { w: 186, h: 36 }
 */
export function button(d, x0, y, label, o = {}) {
  const sz = BTN[o.size ?? 'md'];
  const iconW = o.icon ? sz.size + 8 : 0;
  const tw = label ? measure(label, sz.size).w : 0;
  const menuW = o.menu ? 32 : 0;
  const w =
    o.w ?? Math.max(sz.h, tw + iconW + (label ? sz.pad * 2 : 0) + menuW);
  const x = o.center ? x0 - w / 2 : x0;
  const v = o.variant ?? 'secondary';
  const { disabled } = o;
  const fg = pick(
    [
      [disabled, C.muted],
      [v === 'primary', C.white],
    ],
    C.ink
  );
  d.group(() => {
    if (v !== 'ghost' || o.focused) {
      d.rect(x, y, w, sz.h, {
        r: 8,
        rough: 1,
        stroke: disabled ? C.line : C.ink,
        fill: pick(
          [
            [disabled, C.fill],
            [v === 'primary', C.ink],
          ],
          C.white
        ),
        sw: v === 'destructive' ? 2 : 1,
        dash: disabled,
      });
    }
    if (o.focused)
      d.rect(x - 4, y - 4, w + 8, sz.h + 8, {
        r: 10,
        stroke: C.dim,
        sw: 2,
        dash: true,
      });
    const contentW = tw + iconW;
    let cx = x + (w - menuW - contentW) / 2;
    if (o.icon) {
      icon(d, o.icon, cx + sz.size / 2, y + sz.h / 2, sz.size, { color: fg });
      cx += iconW;
    }
    if (label) d.textMid(cx, y + sz.h / 2, label, { size: sz.size, color: fg });
    if (o.menu) {
      d.line(
        [
          [x + w - 32, y + 6],
          [x + w - 32, y + sz.h - 6],
        ],
        { stroke: v === 'primary' ? C.white : C.ink }
      );
      icon(d, 'down', x + w - 16, y + sz.h / 2, 12, { color: fg });
    }
  });
  return { w, h: sz.h };
}

/**
 * Draws a count badge ("3"), or a dot when the value is ''.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @param {number | string} value - The count, or '' for a dot.
 * @returns {void}
 * @example
 * badge(d, 9, 9, 3);
 * // adds a rounded rectangle and the text '3'
 * badge(d, 5, 5, '');
 * // adds one filled circle
 */
export function badge(d, cx, cy, value) {
  if (value === '') {
    d.circle(cx, cy, 9, { fill: C.ink, stroke: C.white, sw: 2 });
    return;
  }
  const w = Math.max(18, measure(String(value), 11).w + 10);
  d.group(() => {
    d.rect(cx - w / 2, cy - 9, w, 18, {
      r: 9,
      fill: C.ink,
      stroke: C.white,
      sw: 1.5,
    });
    d.textMid(cx, cy, String(value), {
      size: 11,
      color: C.white,
      align: 'center',
    });
  });
}

/**
 * Draws an icon-only button, with an optional circle around it and a badge.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @param {string} name - The icon, as for `icon`.
 * @param {object} [o] - `target` (the touch target: 24 px desktop, 44 iOS, 48 Android; 36 by default),
 *   `outline` (draws the circle), `fill`, `size` (of the icon, 20), `color`, `badge` (as for `badge`).
 * @returns {void}
 * @example
 * iconButton(d, 20, 20, 'bell', { badge: 2, target: 44 });
 * // adds the bell (two lines) and the badge (a rectangle and the text '2')
 */
export function iconButton(d, cx, cy, name, o = {}) {
  const t = o.target ?? 36;
  d.group(() => {
    if (o.outline)
      d.circle(cx, cy, t, { stroke: C.ink, fill: o.fill ?? C.white, rough: 0 });
    icon(d, name, cx, cy, o.size ?? 20, { color: o.color });
    if (o.badge != null) badge(d, cx + t * 0.32, cy - t * 0.3, o.badge);
  });
}

/**
 * Draws a filter chip. A picked chip is filled and has a check, so color isn't the only cue.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string} label - The text.
 * @param {object} [o] - `on` (picked), `size` (14), `h` (32), `skeleton` (dashed, no text).
 * @returns {{ w: number, h: number }} The size it takes.
 * @example
 * chip(d, 0, 0, 'Trending', { on: true });
 * // → { w: 102, h: 32 }
 */
export function chip(d, x, y, label, o = {}) {
  const size = o.size ?? 14;
  const h = o.h ?? 32;
  const tw = measure(label, size).w;
  const w = tw + 28 + (o.on ? 18 : 0);
  d.group(() => {
    d.rect(x, y, w, h, {
      r: 8,
      rough: 1,
      fill: o.on ? C.mid : C.white,
      stroke: o.on ? C.ink : C.line,
      sw: o.on ? 1.5 : 1,
      dash: o.skeleton,
    });
    let tx = x + 14;
    if (o.on) {
      icon(d, 'check', tx + 6, y + h / 2, 12);
      tx += 18;
    }
    if (!o.skeleton)
      d.textMid(tx, y + h / 2, label, { size, color: o.on ? C.ink : C.text });
  });
  return { w, h };
}

/**
 * Draws a row of chips, the first one picked, wrapping to a new row at maxW.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string[]} labels - The chips' text.
 * @param {object} [o] - `maxW` (wrap width), `on` (the picked one, 0), and the options of `chip`.
 * @returns {number} The height it takes.
 * @example
 * chips(d, 0, 0, ['Trending', 'Movies', 'TV shows', 'Comedy', 'Sci-Fi and Fantasy'], { maxW: 300 });
 * // → 72 (two rows)
 */
export function chips(d, x, y, labels, o = {}) {
  let cx = x;
  let cy = y;
  const gap = 8;
  labels.forEach((label, i) => {
    const w =
      measure(label, o.size ?? 14).w + 28 + (i === (o.on ?? 0) ? 18 : 0);
    if (o.maxW && cx + w > x + o.maxW) {
      cx = x;
      cy += (o.h ?? 32) + gap;
    }
    chip(d, cx, cy, label, { ...o, on: i === (o.on ?? 0) });
    cx += w + gap;
  });
  return cy + (o.h ?? 32) - y;
}

/**
 * Draws a text field, with a label above and an error or hint below.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {object} [o] - `label`, `value` or `placeholder`, `icon` (inside, on the left), `shortcut` or
 *   `counter` (inside, on the right), `error` (thicker border, alert icon and the message) or `hint`,
 *   `h` (40), `size` (15).
 * @returns {number} The height it takes.
 * @example
 * field(d, 0, 0, 320, { label: 'Email', error: 'Enter an email address' });
 * // → 86
 * field(d, 0, 0, 320, { placeholder: 'Search' });
 * // → 40
 */
export function field(d, x, y, w, o = {}) {
  const h = o.h ?? 40;
  let top = y;
  d.group(() => {
    if (o.label) {
      d.text(x, y, o.label, { size: 13, color: C.text });
      top += 22;
    }
    d.rect(x, top, w, h, {
      r: 8,
      rough: 1,
      fill: C.white,
      stroke: o.error ? C.ink : C.line,
      sw: o.error ? 2 : 1,
    });
    let tx = x + 12;
    if (o.icon) {
      icon(d, o.icon, tx + 8, top + h / 2, 16, { color: C.muted });
      tx += 26;
    }
    if (o.value) d.textMid(tx, top + h / 2, o.value, { size: o.size ?? 15 });
    else if (o.placeholder)
      d.textMid(tx, top + h / 2, o.placeholder, {
        size: o.size ?? 15,
        color: C.muted,
      });
    if (o.shortcut)
      d.textMid(x + w - 12, top + h / 2, o.shortcut, {
        size: 12,
        color: C.muted,
        align: 'right',
      });
    if (o.counter)
      d.textMid(x + w - 12, top + h / 2, o.counter, {
        size: 12,
        color: C.muted,
        align: 'right',
      });
    if (o.error) {
      icon(d, 'alert', x + 8, top + h + 14, 14);
      d.text(x + 22, top + h + 5, o.error, { size: 13 });
    } else if (o.hint)
      d.text(x, top + h + 5, o.hint, { size: 13, color: C.muted });
  });
  return top + h - y + (o.error || o.hint ? 24 : 0);
}

/**
 * Draws a poster tile: a crossed-out 2:3 image, the heart in the top right corner, title and year under it.
 *
 * On desktop and web the empty heart and the ⋯ button only show on hover or keyboard focus
 * (`hoverable`); a filled heart always shows (HOME-4, LIST-2).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; the image is 1.5 × as tall.
 * @param {object} [o] - `title` (false for none) and `year`, `heart` ('empty', 'filled', 'disabled' or
 *   false), `hoverable` and `hovered`, `menu` (shows the ⋯ button), `badgeAvatar` (the match badge's
 *   initial), `plain` (no image: the title inside), `skeleton`, `textSize` (13), `wrapTitle` (two lines),
 *   `heartTarget` (the heart's circle).
 * @returns {number} The height it takes.
 * @example
 * poster(d, 0, 0, 140, { title: 'Arrival', year: '2016', heart: 'empty' });
 * // → 251.25
 * poster(d, 0, 0, 140, { title: false });
 * // → 210 (the image alone)
 */
export function poster(d, x, y, w, o = {}) {
  const ph = Math.round(w * 1.5);
  const ts = o.textSize ?? 13;
  d.group(() => {
    if (o.skeleton) {
      d.rect(x, y, w, ph, { r: 6, fill: C.faint, stroke: C.faint });
      d.rect(x, y + ph + 8, w * 0.8, 10, {
        r: 4,
        fill: C.faint,
        stroke: C.faint,
      });
      d.rect(x, y + ph + 24, w * 0.35, 10, {
        r: 4,
        fill: C.faint,
        stroke: C.faint,
      });
      return;
    }
    d.rect(x, y, w, ph, {
      r: 6,
      rough: 1,
      fill: C.fill,
      stroke: o.hovered ? C.ink : C.line,
      sw: o.hovered ? 2 : 1,
    });
    if (o.plain) {
      d.text(x + w / 2, y + ph / 2 - 10, o.title ?? 'Title', {
        size: ts,
        align: 'center',
        color: C.muted,
        wrap: w - 16,
      });
    } else {
      d.line(
        [
          [x + 10, y + 10],
          [x + w - 10, y + ph - 10],
        ],
        { stroke: C.mid }
      );
      d.line(
        [
          [x + w - 10, y + 10],
          [x + 10, y + ph - 10],
        ],
        { stroke: C.mid }
      );
    }
    const showHeart =
      o.heart && (!o.hoverable || o.hovered || o.heart === 'filled');
    if (showHeart) {
      const hs = o.heartTarget ?? (w < 120 ? 28 : 32);
      const cx = x + w - hs / 2 - 6;
      const cy = y + hs / 2 + 6;
      d.circle(cx, cy, hs, {
        fill: C.white,
        stroke: o.heart === 'disabled' ? C.line : C.ink,
        dash: o.heart === 'disabled',
      });
      icon(
        d,
        o.heart === 'filled' ? 'heart-filled' : 'heart',
        cx,
        cy,
        hs * 0.5,
        { color: o.heart === 'disabled' ? C.muted : C.ink }
      );
    }
    if (o.menu || o.hovered) {
      d.circle(x + 6 + 14, y + 6 + 14, 28, { fill: C.white, stroke: C.ink });
      icon(d, 'more', x + 20, y + 20, 14);
    }
    if (o.hovered && !o.menu)
      icon(d, 'pointer', x + w * 0.55, y + ph * 0.55, 22);
    if (o.badgeAvatar) {
      d.circle(x + 18, y + ph - 18, 24, {
        fill: C.mid,
        stroke: C.white,
        sw: 2,
      });
      d.textMid(x + 18, y + ph - 18, o.badgeAvatar, {
        size: 11,
        align: 'center',
      });
    }
    if (o.title !== false) {
      const t = d.text(x, y + ph + 6, o.title ?? 'Title', {
        size: ts,
        wrap: o.wrapTitle ? w : undefined,
      });
      d.text(x, t.y + t.height + 1, o.year ?? '2024', {
        size: ts - 1,
        color: C.muted,
      });
    }
  });
  return (
    ph +
    (o.title === false
      ? 0
      : ts * 1.25 * (o.wrapTitle ? 2 : 1) + (ts - 1) * 1.25 + 10)
  );
}

/** Titles and years the grids cycle through, mixed movies and shows of different lengths. */
const SAMPLE = [
  ['Dune: Part Two', '2024'],
  ['The Bear', '2022'],
  ['Past Lives', '2023'],
  ['Severance', '2022'],
  ['Wolverine', '2009'],
  ['Shōgun', '2024'],
  ['Arrival', '2016'],
  ['Fleabag', '2016'],
  ['Lady Bird', '2017'],
  ['Andor', '2022'],
  ['Perfect Days', '2023'],
  ['Slow Horses', '2022'],
  ['Spirited Away', '2001'],
  ['Succession', '2018'],
  ['Inside Out 2', '2024'],
  ['Arcane', '2021'],
  ['Aftersun', '2022'],
  ['The Office', '2005'],
];

/**
 * Draws a grid of posters from SAMPLE, in rows, stopping before maxY.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width to fill.
 * @param {object} [o] - `cols` (by default as many 140 px posters as fit, at least 2; or `minW`), `gap`
 *   (16), `n` (how many; two rows by default), `maxY`, `offset` (where in SAMPLE to start), `liked` (the
 *   indexes with a filled heart, [1, 4]) or `allLiked`, `heart` (false or 'disabled' for all), `hover`
 *   (desktop and web: the index under the pointer, -1 for none), `menuOn` (the index with its menu open),
 *   and `skeleton`, `plain`, `textSize`, `wrapTitle`, `rowExtra` (the room for the text, 48).
 * @returns {{ h: number, cols: number, pw: number }} The height it takes, the columns, the poster width.
 * @example
 * grid(d, 0, 0, 976, { n: 12 });
 * // → { h: 553.25, cols: 6, pw: 149 }
 * grid(d, 0, 0, 358, { cols: 3, gap: 12, n: 9, maxY: 600 });
 * // → { h: 435.25, cols: 3, pw: 111 } (two rows fit above y 600)
 */
export function grid(d, x, y, w, o = {}) {
  const gap = o.gap ?? 16;
  const cols =
    o.cols ?? Math.max(2, Math.floor((w + gap) / ((o.minW ?? 140) + gap)));
  const pw = Math.floor((w - gap * (cols - 1)) / cols);
  const n = o.n ?? cols * 2;
  let usedH = 0;
  for (let i = 0; i < n; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sample = SAMPLE[(i + (o.offset ?? 0)) % SAMPLE.length];
    const rowH = Math.round(pw * 1.5) + (o.rowExtra ?? 48);
    const py = y + row * (rowH + gap);
    if (o.maxY && py + Math.round(pw * 1.5) > o.maxY) break;
    const liked = (o.liked ?? [1, 4]).includes(i);
    const h = poster(d, x + col * (pw + gap), py, pw, {
      title: sample[0],
      year: sample[1],
      heart: pick(
        [
          [o.heart === false, false],
          [o.heart === 'disabled', 'disabled'],
          [liked || o.allLiked, 'filled'],
        ],
        'empty'
      ),
      skeleton: o.skeleton,
      textSize: o.textSize,
      wrapTitle: o.wrapTitle,
      menu: o.menuOn === i,
      plain: o.plain,
      hoverable: o.hover !== undefined,
      hovered: o.hover === i || o.menuOn === i,
    });
    usedH = py - y + h;
  }
  return { h: usedH, cols, pw };
}

/**
 * Draws a box with one corner radius at the top and another at the bottom, as one closed line.
 *
 * Excalidraw rectangles have one radius for all corners, and this is needed for the phone's rounded
 * screen: the tab bar is square at the top and round at the bottom.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @param {number} rTop - The top corners' radius; 0 for square.
 * @param {number} rBottom - The bottom corners' radius; 0 for square.
 * @param {object} [o] - Style, as for `Doc.base`.
 * @returns {object} The line element.
 * @example
 * panel(d, 0, 0, 390, 83, 0, 48).points.length;
 * // → 17 (2 square corners, 2 round ones of 7 points, and the closing point)
 */
export function panel(d, x, y, w, h, rTop, rBottom, o = {}) {
  const pts = [];
  /**
   * Adds a quarter circle of 7 points to pts.
   *
   * @param {number} cx - The corner circle's center, across.
   * @param {number} cy - The corner circle's center, down.
   * @param {number} r - The radius.
   * @param {number} a0 - The start angle, in radians.
   * @returns {void}
   * @example
   * corner(48, 48, 48, Math.PI); // the top left corner of a 48 px radius
   */
  const corner = (cx, cy, r, a0) => {
    for (let i = 0; i <= 6; i += 1) {
      const a = a0 + (Math.PI / 2) * (i / 6);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  if (rTop) corner(x + rTop, y + rTop, rTop, Math.PI);
  else pts.push([x, y]);
  if (rTop) corner(x + w - rTop, y + rTop, rTop, -Math.PI / 2);
  else pts.push([x + w, y]);
  if (rBottom) corner(x + w - rBottom, y + h - rBottom, rBottom, 0);
  else pts.push([x + w, y + h]);
  if (rBottom) corner(x + rBottom, y + h - rBottom, rBottom, Math.PI / 2);
  else pts.push([x, y + h]);
  pts.push([...pts[0]]);
  return d.line(pts, { closed: true, ...o });
}

// --- Chrome ---------------------------------------------------------------------------------------

/**
 * Draws the desktop window's title bar: three dots and the app name.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @returns {number} Its height, 28.
 * @example
 * windowBar(d, 0, 0, 1280);
 * // → 28
 */
export function windowBar(d, x, y, w) {
  d.group(() => {
    d.rect(x, y, w, 28, { fill: C.fill, stroke: C.line });
    [0, 1, 2].forEach((i) =>
      d.circle(x + 16 + i * 20, y + 14, 12, { fill: C.mid, stroke: C.dim })
    );
    d.textMid(x + w / 2, y + 14, 'Movie Mates', {
      size: 12,
      color: C.muted,
      align: 'center',
    });
  });
  return 28;
}

/** The sidebar's main items: icon, name, and a badge (a count, or '' for a dot). */
export const SIDEBAR_ITEMS = [
  ['home', 'Home'],
  ['heart', 'Likes'],
  ['list', 'Your lists'],
  ['matches', 'Matches', 3],
  ['people', 'Connections', ''],
];

/**
 * Draws the logo (two overlapping circles) and the app name.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {object} [o] - `iconOnly` (no name), `size` (of the name, 17).
 * @returns {void}
 * @example
 * logo(d, 0, 0);
 * // adds two ellipses and the text 'Movie Mates'
 */
export function logo(d, x, y, o = {}) {
  d.group(() => {
    d.circle(x + 9, y + 12, 16, { stroke: C.ink, sw: 2 });
    d.circle(x + 19, y + 12, 16, { stroke: C.ink, sw: 2 });
    if (!o.iconOnly)
      d.textMid(x + 36, y + 12, 'Movie Mates', { size: o.size ?? 17 });
  });
}

/**
 * Draws the desktop and web sidebar: logo, search, the main items, and at the bottom the bell, you and
 * Settings (navigation.md).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} h - The height.
 * @param {object} [o] - `active` (the current item, 'Home'), `collapsed` (icons only, for windows under
 *   1024 px), `labels` (translated words, by English word).
 * @returns {number} Its width: 240, or 64 when collapsed.
 * @example
 * sidebar(d, 0, 0, 772, { active: 'Home' });
 * // → 240
 * sidebar(d, 0, 0, 572, { collapsed: true });
 * // → 64
 */
export function sidebar(d, x, y, h, o = {}) {
  const w = o.collapsed ? 64 : 240;
  const L = o.labels ?? {};
  const active = o.active ?? 'Home';
  d.group(() => {
    d.rect(x, y, w, h, { fill: C.fill, stroke: C.line });
    if (o.collapsed) {
      logo(d, x + 18, y + 16, { iconOnly: true });
      d.rect(x + 12, y + 56, 40, 36, {
        r: 8,
        rough: 1,
        fill: C.white,
        stroke: C.line,
      });
      icon(d, 'search', x + 32, y + 74, 16, { color: C.muted });
    } else {
      logo(d, x + 20, y + 16);
      field(d, x + 16, y + 56, w - 32, {
        placeholder: L.search ?? 'Search',
        icon: 'search',
        shortcut: '⌘K',
        h: 36,
        size: 14,
      });
    }
    SIDEBAR_ITEMS.forEach(([ic, label, b], i) => {
      const iy = y + 112 + i * 44;
      const text = L[label] ?? label;
      const isActive = active === label;
      d.group(() => {
        if (isActive) {
          d.rect(x + 8, iy, w - 16, 40, { r: 8, fill: C.mid, stroke: C.mid });
          d.rect(x + 8, iy + 8, 4, 24, { r: 2, fill: C.ink, stroke: C.ink });
        }
        icon(
          d,
          isActive && ic === 'heart' ? 'heart-filled' : ic,
          x + 32,
          iy + 20,
          20
        );
        if (!o.collapsed) {
          d.textMid(x + 54, iy + 20, text, { size: 15 });
          if (b === '') badge(d, x + w - 30, iy + 20, '');
          else if (b != null) badge(d, x + w - 32, iy + 20, b);
        } else if (b != null) badge(d, x + 44, iy + 10, b === '' ? '' : b);
      });
    });
    // bottom: bell, you, settings
    const by = y + h - 148;
    d.line(
      [
        [x + 16, by - 8],
        [x + w - 16, by - 8],
      ],
      { stroke: C.line }
    );
    const bottom = [
      ['bell', L.Notifications ?? 'Notifications', 2],
      ['avatar', 'Alex'],
      ['gear', L.Settings ?? 'Settings'],
    ];
    bottom.forEach(([ic, label, b], i) => {
      const cy = by + 20 + i * 44;
      d.group(() => {
        if (ic === 'avatar') {
          d.circle(x + 32, cy, 26, { fill: C.mid, stroke: C.dim });
          d.textMid(x + 32, cy, 'A', { size: 12, align: 'center' });
        } else icon(d, ic, x + 32, cy, 20);
        if (!o.collapsed) d.textMid(x + 54, cy, label, { size: 15 });
        if (b != null) badge(d, x + 44, cy - 10, b);
      });
    });
  });
  return w;
}

/** The phone's five tabs: icon, name, and a badge. */
export const TABS = [
  ['home', 'Home'],
  ['search', 'Search'],
  ['heart', 'Likes'],
  ['matches', 'Matches', 3],
  ['person', 'Profile'],
];

/**
 * Draws the phone tab bar with its five tabs, the badges and the home indicator.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {object} [o] - `active` (the current tab, 'Home'), `labels` (the five names), `labelSize` (10),
 *   `phone` (round bottom corners, to fit the screen).
 * @returns {number} Its height, 83.
 * @example
 * tabBar(d, 0, 761, 390, { active: 'Home', phone: true });
 * // → 83
 */
export function tabBar(d, x, y, w, o = {}) {
  const active = o.active ?? 'Home';
  const labels = o.labels ?? TABS.map((t) => t[1]);
  const size = o.labelSize ?? 10;
  d.group(() => {
    if (o.phone) {
      panel(d, x, y, w, 83, 0, 48, { fill: C.fill, stroke: C.fill });
      d.line(
        [
          [x, y],
          [x + w, y],
        ],
        { stroke: C.line }
      );
    } else d.rect(x, y, w, 83, { fill: C.fill, stroke: C.line });
    const tw = w / TABS.length;
    TABS.forEach(([ic, name, b], i) => {
      const cx = x + tw * i + tw / 2;
      const isActive = name === active;
      d.group(() => {
        if (isActive)
          d.rect(cx - 26, y + 5, 52, 30, { r: 14, fill: C.mid, stroke: C.mid });
        icon(
          d,
          isActive && ic === 'heart' ? 'heart-filled' : ic,
          cx,
          y + 20,
          20,
          { sw: isActive ? 2 : 1.5 }
        );
        d.textMid(cx, y + 42, labels[i], {
          size,
          align: 'center',
          color: isActive ? C.ink : C.text,
        });
        if (b != null) badge(d, cx + 14, y + 9, b);
      });
    });
    d.rect(x + w / 2 - 67, y + 83 - 13, 134, 5, {
      r: 2,
      fill: C.ink,
      stroke: C.ink,
    });
  });
  return 83;
}

/**
 * Draws the phone's status bar: the time, the camera cut-out, signal and battery.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @returns {number} Its height, 54.
 * @example
 * statusBar(d, 0, 0, 390);
 * // → 54
 */
export function statusBar(d, x, y, w) {
  d.group(() => {
    d.textMid(x + 36, y + 24, '9:41', { size: 15 });
    d.rect(x + w / 2 - 62, y + 11, 124, 34, {
      r: 17,
      fill: C.ink,
      stroke: C.ink,
    });
    d.rect(x + w - 58, y + 18, 26, 12, { r: 3, stroke: C.ink });
    d.rect(x + w - 56, y + 20, 18, 8, { r: 1, fill: C.ink, stroke: C.ink });
    d.circle(x + w - 74, y + 24, 8, { fill: C.ink, stroke: C.ink });
  });
  return 54;
}

/**
 * Draws the phone's home indicator, the bar just above the bottom edge.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The screen's left edge.
 * @param {number} y - The screen's bottom edge.
 * @param {number} w - The screen's width.
 * @returns {void}
 * @example
 * homeIndicator(d, 0, 844, 390);
 * // adds a 134 × 5 bar at (128, 831)
 */
export function homeIndicator(d, x, y, w) {
  d.rect(x + w / 2 - 67, y - 13, 134, 5, { r: 2, fill: C.ink, stroke: C.ink });
}

/**
 * Draws a phone header. Main screens have a large title under the bar; full screens have Back and a
 * centered title.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {object} [o] - `title`, `large`, `titleSize` (30), `back` (true, or the previous screen's name),
 *   `right` (buttons from the right: 'bell', 'gear', 'more', 'close', 'search', 'people', or { text }),
 *   `bellBadge` (2).
 * @returns {number} Its height.
 * @example
 * phoneHeader(d, 0, 0, 390, { title: 'Likes', large: true, right: ['bell'] });
 * // → 89.5
 * phoneHeader(d, 0, 0, 390, { back: 'Home', title: 'Arrival', right: ['more'] });
 * // → 44
 */
export function phoneHeader(d, x, y, w, o = {}) {
  let h = 44;
  d.group(() => {
    if (o.back) {
      icon(d, 'back', x + 18, y + 22, 18);
      if (o.back !== true) d.textMid(x + 30, y + 22, o.back, { size: 16 });
    }
    if (o.title && !o.large)
      d.textMid(x + w / 2, y + 22, o.title, { size: 17, align: 'center' });
    let rx = x + w - 26;
    for (const r of o.right ?? []) {
      if (r === 'bell')
        iconButton(d, rx, y + 22, 'bell', {
          badge: o.bellBadge ?? 2,
          target: 44,
        });
      else if (
        typeof r === 'string' &&
        ['gear', 'more', 'close', 'search', 'people'].includes(r)
      )
        iconButton(d, rx, y + 22, r, { target: 44 });
      else d.textMid(rx + 18, y + 22, r.text, { size: 16, align: 'right' });
      rx -= 44;
    }
    if (o.large) {
      d.text(x + 16, y + 44, o.title, { size: o.titleSize ?? 30 });
      h += (o.titleSize ?? 30) * 1.25 + 8;
    }
  });
  return h;
}

// --- Patterns -------------------------------------------------------------------------------------

/**
 * Draws the offline banner, which sits at the top and pushes the content down.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {object} [o] - `text` (the message) and `size` (14).
 * @returns {number} Its height: 44, or more when the text wraps.
 * @example
 * offlineBanner(d, 0, 0, 1040);
 * // → 44
 * offlineBanner(d, 0, 0, 390);
 * // → 55 (the text takes two lines)
 */
export function offlineBanner(d, x, y, w, o = {}) {
  const size = o.size ?? 14;
  const text =
    o.text ??
    "You're offline. Likes and lists can't be saved until you're back online.";
  const content = wrap(text, size, w - 64);
  const h = Math.max(44, measure(content, size).h + 20);
  d.group(() => {
    d.rect(x, y, w, h, { fill: C.mid, stroke: C.dim });
    icon(d, 'offline', x + 22, y + h / 2, 18);
    d.text(x + 44, y + (h - measure(content, size).h) / 2, content, { size });
  });
  return h;
}

/**
 * Draws a message (a "toast"), with an optional action such as Undo.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} y - The top edge.
 * @param {string} text - The message.
 * @param {object} [o] - `action` (underlined, on the right), `icon` (on the left), `size` (14), `maxW` (420).
 * @returns {{ w: number, h: number }} The size it takes.
 * @example
 * message(d, 210, 0, 'Removed from your Likes.', { action: 'Undo' });
 * // → { w: 255, h: 48 }
 */
export function message(d, cx, y, text, o = {}) {
  const size = o.size ?? 14;
  const maxW = o.maxW ?? 420;
  const actionW = o.action ? measure(o.action, size).w + 24 : 0;
  const content = wrap(text, size, maxW - 32 - actionW - (o.icon ? 26 : 0));
  const m = measure(content, size);
  const w = Math.min(maxW, m.w + 32 + actionW + (o.icon ? 26 : 0));
  const h = Math.max(48, m.h + 24);
  const x = cx - w / 2;
  d.group(() => {
    d.rect(x, y, w, h, { r: 10, rough: 1, fill: C.ink, stroke: C.ink });
    let tx = x + 16;
    if (o.icon) {
      icon(d, o.icon, tx + 9, y + h / 2, 16, { color: C.white });
      tx += 26;
    }
    d.text(tx, y + (h - m.h) / 2, content, { size, color: C.white });
    if (o.action) {
      d.textMid(x + w - 16, y + h / 2, o.action, {
        size,
        color: C.white,
        align: 'right',
      });
      d.line(
        [
          [x + w - actionW + 8, y + h / 2 + 10],
          [x + w - 16, y + h / 2 + 10],
        ],
        { stroke: C.white }
      );
    }
  });
  return { w, h };
}

/**
 * Draws the dimmed layer over a screen, under a dialog or a sheet.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @param {object} [o] - `r`, the screen's corner radius.
 * @returns {void}
 * @example
 * scrim(d, 0, 0, 1280, 800, { r: 10 });
 * // adds a dark gray rectangle at 55% opacity
 */
export function scrim(d, x, y, w, h, o = {}) {
  d.rect(x, y, w, h, { fill: C.dim, stroke: C.dim, opacity: 55, r: o.r });
}

/**
 * Draws a dialog box with its title and close button. The caller draws the content and the buttons.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @param {object} [o] - `title`, `titleSize` (20), `close: false` (no close button, as on a confirmation).
 * @returns {{ x: number, y: number, w: number, h: number, body: number }} The box, and `body`, the y where
 *   the content starts.
 * @example
 * dialog(d, 420, 200, 440, 250, { title: 'New list' });
 * // → { x: 420, y: 200, w: 440, h: 250, body: 266 }
 */
export function dialog(d, x, y, w, h, o = {}) {
  d.rect(x, y, w, h, {
    r: 12,
    rough: 1,
    fill: C.white,
    stroke: C.ink,
    sw: 1.5,
  });
  if (o.title)
    d.text(x + 24, y + 22, o.title, { size: o.titleSize ?? 20, wrap: w - 80 });
  if (o.close !== false)
    iconButton(d, x + w - 28, y + 32, 'close', { size: 16, target: 32 });
  return { x, y, w, h, body: y + 66 };
}

/**
 * Draws a bottom sheet (the phone's dialog): rounded top, grabber, title.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} h - The height, down to the screen's bottom.
 * @param {object} [o] - `title`.
 * @returns {number} The y where the content starts.
 * @example
 * sheet(d, 0, 484, 390, 360, { title: 'Add to list' });
 * // → 550
 */
export function sheet(d, x, y, w, h, o = {}) {
  panel(d, x, y, w, h, 16, 48, { fill: C.white, stroke: C.ink, sw: 1.5 });
  d.rect(x + w / 2 - 18, y + 8, 36, 5, { r: 2, fill: C.line, stroke: C.line });
  if (o.title) d.text(x + 20, y + 26, o.title, { size: 20 });
  return y + 66;
}

/**
 * Draws a menu of actions.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {Array<string | object>} items - Strings, or { text, icon, check (true or false: a checkbox),
 *   sub (text on the right, such as '›'), muted }, or { sep: true } for a separator.
 * @param {object} [o] - `rowH` (36), `size` (14), `focus` (the index with the keyboard focus), `bare` (no
 *   box, inside a bottom sheet).
 * @returns {number} Its height.
 * @example
 * menu(d, 0, 0, 280, [
 *   { text: 'Add to Watch later', icon: 'plus' },
 *   { sep: true },
 *   { text: 'Add to list…', icon: 'list', sub: '›' },
 * ]);
 * // → 89
 */
export function menu(d, x, y, w, items, o = {}) {
  const rowH = o.rowH ?? 36;
  const h = items.reduce((a, it) => a + (it.sep ? 9 : rowH), 0) + 8;
  d.group(() => {
    if (!o.bare)
      d.rect(x, y, w, h, { r: 8, rough: 1, fill: C.white, stroke: C.ink });
    let iy = y + 4;
    items.forEach((raw, i) => {
      const it = typeof raw === 'string' ? { text: raw } : raw;
      if (it.sep) {
        d.line(
          [
            [x + 8, iy + 4],
            [x + w - 8, iy + 4],
          ],
          { stroke: C.line }
        );
        iy += 9;
        return;
      }
      if (o.focus === i)
        d.rect(x + 4, iy, w - 8, rowH, {
          r: 6,
          fill: C.faint,
          stroke: C.faint,
        });
      let tx = x + 14;
      if (it.check != null) {
        d.rect(tx, iy + rowH / 2 - 9, 18, 18, {
          r: 4,
          stroke: C.ink,
          fill: it.check ? C.ink : C.white,
        });
        if (it.check)
          icon(d, 'check', tx + 9, iy + rowH / 2, 12, { color: C.white });
        tx += 28;
      } else if (it.icon) {
        icon(d, it.icon, tx + 8, iy + rowH / 2, 16);
        tx += 28;
      }
      d.textMid(tx, iy + rowH / 2, it.text, {
        size: o.size ?? 14,
        color: it.muted ? C.muted : C.ink,
      });
      if (it.sub)
        d.textMid(x + w - 14, iy + rowH / 2, it.sub, {
          size: 12,
          color: C.muted,
          align: 'right',
        });
      iy += rowH;
    });
  });
  return h;
}

/**
 * Draws gray bars where text is still loading.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number[]} widths - One bar per width, each under the last.
 * @param {object} [o] - `h`, the bar height (12).
 * @returns {number} The height it takes.
 * @example
 * skeletonLines(d, 0, 0, [320, 280, 200]);
 * // → 66
 */
export function skeletonLines(d, x, y, widths, o = {}) {
  const lh = o.h ?? 12;
  widths.forEach((w, i) =>
    d.rect(x, y + i * (lh + 10), w, lh, {
      r: 4,
      fill: C.faint,
      stroke: C.faint,
    })
  );
  return widths.length * (lh + 10);
}

/**
 * Draws a dashed box standing for a short animation (empty states, the welcome, a new match).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @param {string} [label] - What the animation shows.
 * @returns {void}
 * @example
 * animation(d, 0, 0, 260, 200, 'Popcorn falls');
 * // adds the dashed box and the text 'Popcorn falls'
 */
export function animation(d, x, y, w, h, label) {
  d.group(() => {
    d.rect(x, y, w, h, {
      r: 12,
      rough: 1,
      stroke: C.dim,
      dash: true,
      fill: C.white,
    });
    d.text(x + w / 2, y + h - 26, label ?? 'Animation', {
      size: 12,
      color: C.muted,
      align: 'center',
    });
  });
}

/**
 * Draws a round photo placeholder with initials.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @param {number} size - The diameter.
 * @param {string} [initials] - ('S').
 * @returns {void}
 * @example
 * avatar(d, 20, 20, 40, 'S');
 * // adds a circle and 'S' at 17 px
 */
export function avatar(d, cx, cy, size, initials = 'S') {
  d.group(() => {
    d.circle(cx, cy, size, { fill: C.mid, stroke: C.dim });
    d.textMid(cx, cy, initials, {
      size: Math.round(size * 0.42),
      align: 'center',
    });
  });
}

/**
 * Draws the privacy cue: the lock and a line such as "Only you can see your Likes".
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string} text - The line.
 * @param {object} [o] - `size` (13).
 * @returns {object} The text element.
 * @example
 * privateCue(d, 0, 0, 'Only you can see your Likes').x;
 * // → 20 (the text starts after the lock)
 */
export function privateCue(d, x, y, text, o = {}) {
  const size = o.size ?? 13;
  icon(d, 'lock', x + 7, y + 9, 14, { color: C.text });
  return d.text(x + 20, y + 1, text, { size, color: C.text });
}

/**
 * Draws a blue note for the reviewer. Notes sit outside the screen, in the frame's notes column.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {string} text - The note; it wraps to the width.
 * @param {object} [o] - `size` (13).
 * @returns {number} Its height.
 * @example
 * note(d, 0, 0, 280, 'Skeletons, no spinners.');
 * // → 36.25
 */
export function note(d, x, y, w, text, o = {}) {
  const size = o.size ?? 13;
  const content = wrap(text, size, w - 24);
  const m = measure(content, size);
  const h = m.h + 20;
  d.group(() => {
    d.rect(x, y, w, h, { r: 6, fill: C.noteFill, stroke: C.note, rough: 0 });
    d.text(x + 12, y + 10, content, { size, color: C.note });
  });
  return h;
}
