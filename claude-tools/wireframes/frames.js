// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// Frames on the canvas, one per screen and state: the screen at its real size, with a column of notes for
// the reviewer on its right. Also the app layouts every screen starts from.
import { C, hash, measure } from './lib';
import * as ui from './ui';

/** The screen sizes, from docs/design/wireframes/README.md: desktop and web, the narrow window, the phone. */
export const SIZE = {
  desktop: { w: 1280, h: 800 },
  narrow: { w: 960, h: 600 },
  phone: { w: 390, h: 844 },
};
const PAD = 16;
const NOTE_W = 280;
const GAP = 120;

/**
 * Lays frames out on the canvas from left to right, in rows.
 *
 * @example
 * const B = new Board(new Doc('states'));
 * B.frame('Loading · D W', 'desktop', (s) => { … });
 */
export class Board {
  /**
   * Starts at the top left of the canvas.
   *
   * @param {import('./lib').Doc} d - The drawing the frames go into.
   * @example
   * new Board(new Doc('shell')).x;
   * // → 0
   */
  constructor(d) {
    this.d = d;
    this.x = 0;
    this.y = 0;
    this.rowH = 0;
  }

  /**
   * Starts a new row with a big heading, and an optional line under it.
   *
   * @param {string} text - The heading.
   * @param {string} [sub] - A smaller line under it.
   * @returns {void}
   * @example
   * B.heading('Desktop and web', 'The sidebar on every main screen');
   * B.y;
   * // → 120 (the next frame starts under the heading)
   */
  heading(text, sub) {
    this.row();
    this.d.text(this.x, this.y, text, { size: 36 });
    if (sub)
      this.d.text(this.x, this.y + 52, sub, { size: 18, color: C.muted });
    this.y += sub ? 120 : 80;
  }

  /**
   * Moves down to a new row, under the tallest frame of the current one.
   *
   * @returns {void}
   * @example
   * B.row();
   * B.x;
   * // → 0
   */
  row() {
    if (this.rowH) {
      this.y += this.rowH + GAP;
      this.rowH = 0;
    }
    this.x = 0;
  }

  /**
   * Draws one frame: the screen, what fn draws on it, and the notes column.
   *
   * Each frame takes its sketchy lines from a seed made from its name, so changing one frame leaves the
   * other frames' PNGs unchanged.
   *
   * @param {string} name - 'Screen · state · clients · IDs', the rule in docs/design/wireframes/README.md.
   * @param {'desktop' | 'narrow' | 'phone' | { w: number, h: number }} kind - A device from SIZE, or a
   *   size with no device around it.
   * @param {(s: object) => void} fn - Draws the screen. It gets the screen `s`: its `x`, `y`, `w`, `h`,
   *   `top` (under the window or status bar), `bottom`, `d` (the drawing), `note(text)`,
   *   `noteSpace(h)`, `later` and `flush()`. It may set `s.usedH` to shorten the frame.
   * @param {object} [o] - `web: true` leaves out the desktop window bar; `bare: true` draws no screen box.
   * @returns {object} The screen `s`.
   * @example
   * B.frame('Loading · M', 'phone', (s) => {
   *   s.note('Skeletons, no spinners.');
   * });
   * // adds the phone screen, the note, and a frame named 'Loading · M', 726 × 876
   */
  frame(name, kind, fn, o = {}) {
    const { d } = this;
    const size = typeof kind === 'string' ? SIZE[kind] : kind;
    const id = d.nextId();
    d.frameId = id;
    d.seedState = hash(name);
    const sx = this.x + PAD;
    const sy = this.y + PAD;
    let noteY = sy;
    const noteX = sx + size.w + 24;
    const s = {
      d,
      x: sx,
      y: sy,
      w: size.w,
      h: size.h,
      top: sy,
      bottom: sy + size.h,
      noteW: NOTE_W,
      later: [],
      /**
       * Adds a note for the reviewer in the column on the right.
       *
       * @param {string} text - The note.
       * @returns {void}
       * @example
       * s.note('Skeletons, no spinners.');
       */
      note(text) {
        noteY += ui.note(d, noteX, noteY, NOTE_W, text) + 12;
      },
      /**
       * Makes room in the notes column for a drawing, such as a second state.
       *
       * @param {number} h - The room needed, in pixels.
       * @returns {{ x: number, y: number }} Where to draw it.
       * @example
       * s.noteSpace(200);
       * // → { x: 1320, y: 16 } in the first desktop frame
       */
      noteSpace(h) {
        const at = { x: noteX, y: noteY };
        noteY += h + 12;
        return at;
      },
      /**
       * Draws what was put off with `s.later.push(fn)`, such as the tab bar, which must sit on top of the
       * content and under a dimmed page. The frame also calls it at the end.
       *
       * @returns {void}
       * @example
       * s.flush();
       */
      flush() {
        while (s.later.length) s.later.shift()();
      },
    };
    if (kind === 'desktop' || kind === 'narrow') {
      d.rect(sx, sy, size.w, size.h, {
        r: 10,
        fill: C.white,
        stroke: C.ink,
        sw: 1.5,
      });
      if (!o.web) s.top += ui.windowBar(d, sx, sy, size.w);
    } else if (kind === 'phone') {
      d.rect(sx, sy, size.w, size.h, {
        r: 48,
        fill: C.white,
        stroke: C.ink,
        sw: 2,
      });
      s.top += ui.statusBar(d, sx, sy, size.w);
    } else if (!o.bare) {
      d.rect(sx, sy, size.w, size.h, { r: 6, fill: C.white, stroke: C.line });
    }
    fn(s);
    s.flush();
    d.frameId = null;
    const fw = PAD + size.w + (noteY > sy ? 24 + NOTE_W : 0) + PAD;
    const fh = PAD + Math.max(s.usedH ?? size.h, noteY - sy - 12) + PAD;
    const frame = d.base('frame', this.x, this.y, fw, fh, {
      stroke: '#bbb',
      rough: 0,
    });
    frame.id = id;
    frame.name = name;
    frame.groupIds = [];
    this.x += fw + GAP;
    this.rowH = Math.max(this.rowH, fh);
    return s;
  }
}

// --- App layouts -----------------------------------------------------------------------------------

/**
 * Draws the desktop or web sidebar on a screen and gives back the area to its right.
 *
 * @param {object} s - The screen, from `Board.frame`.
 * @param {object} [o] - `active` (the current item, 'Home'), `collapsed` (icons only; by default below
 *   1024 px), `labels` (translated words, by English word).
 * @returns {{ x: number, y: number, w: number, h: number, bottom: number }} The content area.
 * @example
 * // in a 1280 × 800 desktop frame at (16, 16)
 * desktopApp(s, { active: 'Likes' });
 * // → { x: 256, y: 44, w: 1040, h: 772, bottom: 816 }
 */
export function desktopApp(s, o = {}) {
  const sw = ui.sidebar(s.d, s.x, s.top, s.bottom - s.top, {
    active: o.active,
    collapsed: o.collapsed ?? s.w < 1024,
    labels: o.labels,
  });
  return {
    x: s.x + sw,
    y: s.top,
    w: s.w - sw,
    h: s.bottom - s.top,
    bottom: s.bottom,
  };
}

/**
 * Sets up a phone screen: the tab bar (drawn last, on top) or, without tabs, the home indicator.
 *
 * @param {object} s - The screen, from `Board.frame`.
 * @param {object} [o] - `active` (the current tab), `tabs: false` (no tab bar, as in onboarding),
 *   `labels` and `labelSize` for the tab names.
 * @returns {{ x: number, y: number, w: number, h: number, bottom: number }} The area above the tab bar.
 * @example
 * // in a phone frame at (16, 16)
 * phoneApp(s, { active: 'Likes' });
 * // → { x: 16, y: 70, w: 390, h: 707, bottom: 777 }
 */
export function phoneApp(s, o = {}) {
  const tb = o.tabs === false ? 0 : 83;
  if (o.tabs !== false)
    s.later.push(() =>
      ui.tabBar(s.d, s.x, s.bottom - 83, s.w, {
        active: o.active,
        labels: o.labels,
        labelSize: o.labelSize,
        phone: true,
      })
    );
  else ui.homeIndicator(s.d, s.x, s.bottom, s.w);
  return {
    x: s.x,
    y: s.top,
    w: s.w,
    h: s.bottom - tb - s.top,
    bottom: s.bottom - tb - (o.tabs === false ? 34 : 0),
  };
}

/**
 * Draws a page's heading on desktop and web, with the privacy cue or a line under it.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string} title - The heading.
 * @param {object} [o] - `size` (28), `cue` (the lock and its text), `sub` (a gray line).
 * @returns {number} The y under it, where the page's content starts.
 * @example
 * pageTitle(d, 288, 68, 'Likes', { cue: 'Only you can see your Likes' });
 * // → 147
 */
export function pageTitle(d, x, y, title, o = {}) {
  d.text(x, y, title, { size: o.size ?? 28 });
  let ny = y + (o.size ?? 28) * 1.25 + 6;
  if (o.cue) {
    ui.privateCue(d, x, ny, o.cue);
    ny += 26;
  }
  if (o.sub) {
    d.text(x, ny, o.sub, { size: 14, color: C.muted });
    ny += 24;
  }
  return ny + 12;
}

/**
 * Draws the Home hero: a crossed-out image, the title, a line of plot, and the Like, Trailer and More info
 * buttons. Below 500 px wide it's the phone version, without the plot.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @param {object} [o] - `skeleton: true` draws the loading version.
 * @returns {number} The height, h.
 * @example
 * hero(d, 288, 120, 976, 250);
 * // → 250
 */
export function hero(d, x, y, w, h, o = {}) {
  d.group(() => {
    if (o.skeleton) {
      d.rect(x, y, w, h, { r: 12, fill: C.faint, stroke: C.faint });
      ui.skeletonLines(d, x + 24, y + h - 110, [w * 0.35, w * 0.5, w * 0.25], {
        h: 14,
      });
      return;
    }
    d.rect(x, y, w, h, { r: 12, rough: 1, fill: C.fill, stroke: C.line });
    d.line(
      [
        [x + 12, y + 12],
        [x + w - 12, y + h - 12],
      ],
      { stroke: C.faint }
    );
    d.line(
      [
        [x + w - 12, y + 12],
        [x + 12, y + h - 12],
      ],
      { stroke: C.faint }
    );
    const small = w < 500;
    const tx = x + (small ? 16 : 28);
    let ty = y + h - (small ? 118 : 150);
    d.text(tx, ty, 'Dune: Part Two', { size: small ? 20 : 28 });
    ty += small ? 28 : 40;
    d.text(tx, ty, 'Movie · 2024', { size: small ? 13 : 14, color: C.text });
    ty += 24;
    if (!small) {
      d.text(
        tx,
        ty,
        'Paul Atreides unites with Chani and the Fremen while on a\nwarpath of revenge against the conspirators who…',
        { size: 14, color: C.text }
      );
      ty += 48;
    }
    let bx = tx;
    bx +=
      ui.button(d, bx, ty, 'Like', {
        variant: 'primary',
        icon: 'heart',
        size: small ? 'sm' : 'md',
      }).w + 8;
    bx +=
      ui.button(d, bx, ty, 'Trailer', {
        icon: 'play',
        size: small ? 'sm' : 'md',
      }).w + 8;
    ui.button(d, bx, ty, 'More info', {
      variant: 'ghost',
      size: small ? 'sm' : 'md',
    });
  });
  return h;
}

/**
 * Draws the "Show more" button centered under a grid.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} y - The top edge.
 * @param {object} [o] - `size`: 'sm', 'md' (the default) or 'lg'.
 * @returns {void}
 * @example
 * showMore(d, 776, 700);
 * // adds a 105 px wide button from x 723.5 to 828.5
 */
export function showMore(d, cx, y, o = {}) {
  const w = measure('Show more', 14).w + 32;
  ui.button(d, cx - w / 2, y, 'Show more', { size: o.size ?? 'md' });
}
