// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// The drawing basics: the gray palette, text measuring, and Doc, which collects plain Excalidraw elements.
// It runs in the browser, so text is measured with the same fonts Excalidraw uses.

/** The wireframe palette: grays, plus blue for the reviewer's notes. */
export const C = {
  ink: '#1e1e1e',
  text: '#343a40',
  muted: '#868e96',
  line: '#adb5bd',
  faint: '#e9ecef',
  fill: '#f1f3f5',
  mid: '#ced4da',
  dim: '#495057',
  white: '#ffffff',
  note: '#1971c2',
  noteFill: '#e7f5ff',
};

// Excalidraw's font numbers: 6 is Nunito (the interface text), 5 is Excalifont (hand-written)
const NUNITO = 6;
const EXCALIFONT = 5;
let ctx;

/**
 * Measures text as Excalidraw will draw it: the widest line, and 1.25 × the size per line.
 *
 * @param {string} text - The text; `\n` starts a new line.
 * @param {number} size - The font size in pixels.
 * @param {number} [family] - Excalidraw's font number: 6 for Nunito (the default), 5 for Excalifont.
 * @returns {{ w: number, h: number }} The width (rounded up) and the height, in pixels.
 * @example
 * measure('Show more', 14);
 * // → { w: 73, h: 17.5 }
 * measure('Home\nLikes', 15);
 * // → { w: 41, h: 37.5 }
 */
export function measure(text, size, family = NUNITO) {
  ctx ??= document.createElement('canvas').getContext('2d');
  ctx.font = `${size}px ${family === EXCALIFONT ? 'Excalifont' : 'Nunito'}`;
  const lines = String(text).split('\n');
  return {
    w: Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))),
    h: lines.length * size * 1.25,
  };
}

/**
 * Breaks text into lines no wider than maxW, at spaces. Existing line breaks stay.
 *
 * @param {string} text - The text to break.
 * @param {number} size - The font size in pixels.
 * @param {number} maxW - The widest a line may be, in pixels.
 * @returns {string} The text with `\n` where the lines break.
 * @example
 * wrap("Likes and lists can't be saved until you're back online.", 14, 200);
 * // → "Likes and lists can't be saved\nuntil you're back online."
 */
export function wrap(text, size, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next, size).w > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out.join('\n');
}

/**
 * Turns text into a number that is always the same for the same text, used to seed the sketchy lines.
 *
 * @param {string} s - Any text, such as a frame's name.
 * @returns {number} A whole number from 1 to 2147483646.
 * @example
 * hash('Loading · D W');
 * // → 2074783359
 */
export function hash(s) {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  return h || 1;
}

/**
 * Picks the value for a choice, in place of chained `a ? b : c ? d : e`.
 *
 * @template T
 * @param {Array<[boolean, T]>} cases - Pairs of a condition and its value; the first true one wins.
 * @param {T} otherwise - The value when no condition is true.
 * @returns {T} The chosen value.
 * @example
 * pick([[false, 'dashed'], [true, 'dotted']], 'solid');
 * // → 'dotted'
 */
export function pick(cases, otherwise) {
  const found = cases.find(([when]) => when);
  return found ? found[1] : otherwise;
}

/**
 * A drawing: the list of Excalidraw elements, with helpers that add shapes and text at absolute positions.
 *
 * Element ids start with the prefix, so two drawings never share an id. The sketchy lines are drawn from
 * a seed; the same drawing always gives the same file.
 */
export class Doc {
  /**
   * Starts an empty drawing.
   *
   * @param {string} prefix - The start of every element id, such as 'shell'.
   * @example
   * const d = new Doc('shell');
   * d.elements.length;
   * // → 0
   */
  constructor(prefix) {
    this.prefix = prefix;
    this.n = 0;
    this.elements = [];
    // The frame new elements belong to, set while a frame is drawn (frames.js)
    this.frameId = null;
    // The open groups; new elements join all of them, so they move together in Excalidraw
    this.groups = [];
    this.seedState = hash(prefix);
  }

  /**
   * Makes the next element id.
   *
   * @returns {string} The prefix and a counter in base 36.
   * @example
   * const d = new Doc('shell');
   * d.nextId();
   * // → 'shell-1'
   */
  nextId() {
    this.n += 1;
    return `${this.prefix}-${this.n.toString(36)}`;
  }

  /**
   * Gives the next seed for an element's sketchy lines (a simple random number generator).
   *
   * @returns {number} A whole number from 1 to 2147483646.
   * @example
   * const d = new Doc('shell');
   * d.seedState = 1;
   * d.seed();
   * // → 16807
   */
  seed() {
    this.seedState = (this.seedState * 16807) % 2147483647;
    return this.seedState;
  }

  /**
   * Adds an element with every field Excalidraw expects. The shape helpers below all use it.
   *
   * @param {string} type - 'rectangle', 'ellipse', 'line', 'text' or 'frame'.
   * @param {number} x - The left edge.
   * @param {number} y - The top edge.
   * @param {number} w - The width.
   * @param {number} h - The height.
   * @param {object} [o] - Style: `stroke` and `fill` colors, `sw` (stroke width), `dash` or `dotted`,
   *   `rough` (0 straight, 1 sketchy), `opacity` (0–100), `r` (corner radius), `fillStyle`, `link`.
   * @returns {object} The element, already added to `elements`.
   * @example
   * const d = new Doc('shell');
   * d.base('rectangle', 0, 0, 100, 40, { r: 8 }).roundness;
   * // → { type: 3, value: 8 }
   */
  base(type, x, y, w, h, o = {}) {
    const s = this.seed();
    const el = {
      id: this.nextId(),
      type,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: w,
      height: h,
      angle: 0,
      strokeColor: o.stroke ?? C.ink,
      backgroundColor: o.fill ?? 'transparent',
      fillStyle: o.fillStyle ?? 'solid',
      strokeWidth: o.sw ?? 1,
      strokeStyle: pick(
        [
          [o.dash, 'dashed'],
          [o.dotted, 'dotted'],
        ],
        'solid'
      ),
      roughness: o.rough ?? 0,
      opacity: o.opacity ?? 100,
      groupIds: [...this.groups],
      frameId: this.frameId,
      roundness: o.r != null ? { type: 3, value: o.r } : null,
      seed: s,
      version: 1,
      versionNonce: s,
      isDeleted: false,
      boundElements: null,
      updated: 1,
      link: o.link ?? null,
      locked: false,
    };
    this.elements.push(el);
    return el;
  }

  /**
   * Groups everything drawn inside fn, so it moves as one piece in Excalidraw. Groups can nest.
   *
   * @template T
   * @param {() => T} fn - Draws the group's elements.
   * @returns {T} What fn returns.
   * @example
   * const d = new Doc('shell');
   * d.group(() => d.rect(0, 0, 10, 10)).groupIds;
   * // → ['shell-1']
   */
  group(fn) {
    const g = this.nextId();
    this.groups.push(g);
    try {
      return fn();
    } finally {
      this.groups.pop();
    }
  }

  /**
   * Adds a rectangle.
   *
   * @param {number} x - The left edge.
   * @param {number} y - The top edge.
   * @param {number} w - The width.
   * @param {number} h - The height.
   * @param {object} [o] - Style, as for `base`.
   * @returns {object} The element.
   * @example
   * const d = new Doc('shell');
   * d.rect(0, 0, 120, 36, { r: 8 }).type;
   * // → 'rectangle'
   */
  rect(x, y, w, h, o = {}) {
    return this.base('rectangle', x, y, w, h, o);
  }

  /**
   * Adds an ellipse inside the box at (x, y).
   *
   * @param {number} x - The left edge of the box.
   * @param {number} y - The top edge of the box.
   * @param {number} w - The width.
   * @param {number} h - The height.
   * @param {object} [o] - Style, as for `base`.
   * @returns {object} The element.
   * @example
   * const d = new Doc('shell');
   * d.ellipse(0, 0, 40, 20).type;
   * // → 'ellipse'
   */
  ellipse(x, y, w, h, o = {}) {
    return this.base('ellipse', x, y, w, h, o);
  }

  /**
   * Adds a circle by its center and diameter.
   *
   * @param {number} cx - The center, across.
   * @param {number} cy - The center, down.
   * @param {number} d - The diameter.
   * @param {object} [o] - Style, as for `base`.
   * @returns {object} The ellipse element.
   * @example
   * const doc = new Doc('shell');
   * const c = doc.circle(20, 20, 10);
   * [c.x, c.y, c.width];
   * // → [15, 15, 10]
   */
  circle(cx, cy, d, o = {}) {
    return this.ellipse(cx - d / 2, cy - d / 2, d, d, o);
  }

  /**
   * Adds a line through points given as absolute [x, y] pairs.
   *
   * @param {Array<[number, number]>} pts - The points, at least two.
   * @param {object} [o] - Style, as for `base`, plus `curve` (smooth corners) and `closed` (a filled shape).
   * @returns {object} The line element; its points are stored relative to the first one.
   * @example
   * const d = new Doc('shell');
   * d.line([[10, 10], [30, 10], [30, 40]]).points;
   * // → [[0, 0], [20, 0], [20, 30]]
   */
  line(pts, o = {}) {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const el = this.base(
      'line',
      pts[0][0],
      pts[0][1],
      Math.max(...xs) - x0,
      Math.max(...ys) - y0,
      o
    );
    el.points = pts.map((p) => [
      Math.round((p[0] - pts[0][0]) * 100) / 100,
      Math.round((p[1] - pts[0][1]) * 100) / 100,
    ]);
    el.lastCommittedPoint = null;
    el.startBinding = null;
    el.endBinding = null;
    el.startArrowhead = null;
    el.endArrowhead = null;
    if (o.curve) el.roundness = { type: 2 };
    if (o.closed) el.polygon = true;
    return el;
  }

  /**
   * Adds an arrow through points given as absolute [x, y] pairs, with its head at the last point.
   *
   * @param {Array<[number, number]>} pts - The points, at least two.
   * @param {object} [o] - Style, as for `base`.
   * @returns {object} The arrow element.
   * @example
   * const d = new Doc('auth');
   * d.arrow([[0, 0], [0, 40], [60, 40]]).endArrowhead;
   * // → 'arrow'
   */
  arrow(pts, o = {}) {
    const el = this.line(pts, o);
    el.type = 'arrow';
    el.endArrowhead = 'arrow';
    el.elbowed = false;
    return el;
  }

  /**
   * Adds a diamond inside the box at (x, y), the shape flowcharts use for a question.
   *
   * @param {number} x - The left edge of the box.
   * @param {number} y - The top edge of the box.
   * @param {number} w - The width.
   * @param {number} h - The height.
   * @param {object} [o] - Style, as for `base`.
   * @returns {object} The element.
   * @example
   * const d = new Doc('auth');
   * d.diamond(0, 0, 200, 100).type;
   * // → 'diamond'
   */
  diamond(x, y, w, h, o = {}) {
    return this.base('diamond', x, y, w, h, o);
  }

  /**
   * Adds text, sized to fit it.
   *
   * @param {number} x - With `align` 'left' the left edge, 'center' the center, 'right' the right edge.
   * @param {number} y - The top edge.
   * @param {string} str - The text.
   * @param {object} [o] - `size` (14), `family` (6, Nunito), `color`, `align`, and `wrap` (a width to
   *   break lines at).
   * @returns {object} The text element.
   * @example
   * const d = new Doc('shell');
   * const t = d.text(100, 0, 'Show more', { align: 'center' });
   * [t.x, t.width, t.height];
   * // → [63.5, 73, 17.5]
   */
  text(x, y, str, o = {}) {
    const size = o.size ?? 14;
    const family = o.family ?? NUNITO;
    const content = o.wrap ? wrap(str, size, o.wrap) : String(str);
    const m = measure(content, size, family);
    const align = o.align ?? 'left';
    const left = pick(
      [
        [align === 'center', x - m.w / 2],
        [align === 'right', x - m.w],
      ],
      x
    );
    const el = this.base('text', left, y, m.w, m.h, {
      stroke: o.color ?? C.ink,
      rough: 0,
    });
    Object.assign(el, {
      text: content,
      originalText: content,
      fontSize: size,
      fontFamily: family,
      textAlign: align,
      verticalAlign: 'top',
      containerId: null,
      autoResize: true,
      lineHeight: 1.25,
    });
    return el;
  }

  /**
   * Adds one line of text, centered up and down on cy (for labels inside buttons and rows).
   *
   * @param {number} x - As for `text`.
   * @param {number} cy - The vertical center.
   * @param {string} str - The text.
   * @param {object} [o] - As for `text`.
   * @returns {object} The text element.
   * @example
   * const d = new Doc('shell');
   * d.textMid(0, 20, 'Home', { size: 16 }).y;
   * // → 10
   */
  textMid(x, cy, str, o = {}) {
    const size = o.size ?? 14;
    return this.text(x, cy - (size * 1.25) / 2, str, o);
  }
}
