// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// auth.excalidraw: signing in (#156). The welcome screen, email sign-in with the link and the code, the
// pages the link opens, and Google and Apple, each with its loading and error states. Then onboarding, and
// arriving from an invite: accept or decline, and the invites that can't be used.
import { C, Doc, measure, pick } from './lib';
import * as ui from './ui';
import { Board, phoneApp } from './frames';
import { flowArrow, flowBox } from './flow';

const EMAIL = 'alex@gmail.com';
const COL = 400;
const TERMS =
  "By continuing, you agree to the Terms and the Privacy Policy, and confirm you're 13 or older.";

/**
 * Draws text with a line under it, the way links look in the wireframes.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - As for `Doc.text`: the left edge, or the center with `align: 'center'`.
 * @param {number} y - The top edge.
 * @param {string} text - The link's words.
 * @param {object} [o] - As for `Doc.text`; `size` is 14.
 * @returns {object} The text element.
 * @example
 * link(d, 640, 500, 'Use a different email', { align: 'center' }).text;
 * // → 'Use a different email'
 */
function link(d, x, y, text, o = {}) {
  const size = o.size ?? 14;
  const t = d.text(x, y, text, { size, ...o });
  d.line(
    [
      [t.x, y + size * 1.15],
      [t.x + t.width, y + size * 1.15],
    ],
    { stroke: o.color ?? C.ink }
  );
  return t;
}

/**
 * Draws a box with an icon and a short message, for errors and notices that sit in the page.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; the text wraps inside it.
 * @param {string} text - The message.
 * @param {object} [o] - `icon` ('alert'), `size` (14).
 * @returns {number} Its height.
 * @example
 * notice(d, 440, 300, 400, 'Google sign-in was cancelled.');
 * // → 48
 */
function notice(d, x, y, w, text, o = {}) {
  const size = o.size ?? 14;
  const t = d.text(x + 40, y, text, { size, wrap: w - 56 });
  const h = Math.max(48, t.height + 24);
  t.y = y + (h - t.height) / 2;
  d.rect(x, y, w, h, { r: 8, fill: C.fill, stroke: C.dim });
  ui.icon(d, o.icon ?? 'alert', x + 20, y + h / 2, 18, { color: C.dim });
  // the text goes on top of the box
  d.elements.push(d.elements.splice(d.elements.indexOf(t), 1)[0]);
  return h;
}

/**
 * Draws the 6-digit code field: one field that takes a paste of the whole code (AUTH-5).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge (of the label).
 * @param {number} w - The width.
 * @param {object} [o] - `value` (the digits typed), `selected` (the value is selected, after a wrong
 *   code), `checking` ("Checking…"), `disabled`, `error` (the message under it).
 * @returns {number} The height it takes.
 * @example
 * codeField(d, 440, 300, 400, { value: '482931', selected: true, error: "That code doesn't match." });
 * // → 90
 */
function codeField(d, x, y, w, o = {}) {
  d.text(x, y, '6-digit code', { size: 13, color: C.text });
  const top = y + 22;
  const h = 52;
  d.rect(x, top, w, h, {
    r: 8,
    rough: 1,
    fill: o.disabled ? C.fill : C.white,
    stroke: o.error ? C.ink : C.line,
    sw: o.error ? 2 : 1,
    dash: o.disabled,
  });
  const spaced = (o.value ?? '').split('').join(' ');
  if (o.checking) {
    d.textMid(x + 16, top + h / 2, `${spaced}   Checking…`, {
      size: 20,
      color: C.muted,
    });
  } else if (o.value) {
    if (o.selected) {
      const m = measure(spaced, 22);
      d.rect(x + 12, top + 10, m.w + 8, h - 20, {
        r: 3,
        fill: C.mid,
        stroke: C.mid,
      });
    }
    d.textMid(x + 16, top + h / 2, spaced, { size: 22 });
  } else {
    d.textMid(x + 16, top + h / 2, '_ _ _ _ _ _', {
      size: 22,
      color: C.line,
    });
  }
  if (!o.error) return top + h - y;
  ui.icon(d, 'alert', x + 8, top + h + 14, 14);
  d.text(x + 22, top + h + 5, o.error, { size: 13, wrap: w - 22 });
  return top + h - y + 38;
}

/**
 * Draws a browser's tab and address bar at the top of a web frame.
 *
 * @param {object} s - The screen, from `Board.frame` with `web: true`.
 * @param {string} address - The page's address.
 * @returns {number} The bar's height, 72.
 * @example
 * browserBar(s, '…/auth/link');
 * // → 72
 */
function browserBar(s, address) {
  const { d } = s;
  d.rect(s.x, s.y, s.w, 72, { fill: C.fill, stroke: C.line });
  [0, 1, 2].forEach((i) =>
    d.circle(s.x + 16 + i * 20, s.y + 18, 12, { fill: C.mid, stroke: C.dim })
  );
  d.rect(s.x + 84, s.y + 6, 220, 26, {
    r: 6,
    fill: C.white,
    stroke: C.line,
  });
  d.textMid(s.x + 98, s.y + 19, 'Movie Mates', { size: 12 });
  d.rect(s.x + 16, s.y + 38, s.w - 32, 26, {
    r: 13,
    fill: C.white,
    stroke: C.line,
  });
  ui.icon(d, 'lock', s.x + 34, s.y + 51, 12, { color: C.muted });
  d.textMid(s.x + 48, s.y + 51, address, { size: 13, color: C.text });
  return 72;
}

/**
 * Draws the welcome screen on desktop and web, centered in the window, with no sidebar (AUTH-1).
 *
 * @param {object} s - The desktop screen, from `Board.frame`.
 * @param {object} [o] - `notice` (a message above the heading) and `noticeIcon`, `offline` (the banner, and the buttons
 *   disabled), `invitedBy` (the inviter's name, ONBOARD-8).
 * @returns {void}
 * @example
 * welcomeDW(s, { notice: 'Google sign-in was cancelled.' });
 */
function welcomeDW(s, o = {}) {
  const { d } = s;
  const cx = s.x + s.w / 2;
  let y = s.top;
  if (o.offline) {
    y += ui.offlineBanner(d, s.x, y, s.w, {
      text: "You're offline. Connect to sign in.",
    });
  }
  y += 40;
  ui.logo(d, cx - 70, y, { size: 20 });
  y += 52;
  const animH = o.notice || o.invitedBy ? 150 : 180;
  ui.animation(d, cx - 160, y, 320, animH, 'Animation: two hearts meet');
  y += animH + 24;
  if (o.notice) {
    y += notice(d, cx - COL / 2, y, COL, o.notice, { icon: o.noticeIcon }) + 20;
  }
  if (o.invitedBy) {
    ui.avatar(d, cx - 110, y + 20, 40, o.invitedBy[0]);
    d.textMid(cx - 82, y + 20, `${o.invitedBy} invited you to Movie Mates`, {
      size: 17,
    });
    y += 56;
  }
  d.text(cx, y, 'Find what you both want to watch.', {
    size: 28,
    align: 'center',
  });
  y += 46;
  d.text(
    cx,
    y,
    "Like titles in private. When you both like one, it's a match.",
    { size: 15, color: C.text, align: 'center' }
  );
  y += 40;
  ['Continue with email', 'Continue with Google'].forEach((label, i) =>
    ui.button(d, cx - 160, y + i * 60, label, {
      w: 320,
      size: 'lg',
      disabled: o.offline,
    })
  );
  y += 124;
  d.text(cx, y, 'New here? The same buttons create your account.', {
    size: 13,
    color: C.text,
    align: 'center',
  });
  y += 24;
  d.text(cx, y, TERMS, {
    size: 12,
    color: C.muted,
    align: 'center',
    wrap: 360,
  });
  const fy = s.bottom - 52;
  link(d, cx - 8, fy, 'Privacy policy', {
    size: 12,
    color: C.muted,
    align: 'right',
  });
  link(d, cx + 8, fy, 'Terms', { size: 12, color: C.muted });
  d.text(
    cx,
    fy + 22,
    'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    { size: 11, color: C.muted, align: 'center' }
  );
}

/**
 * Draws the welcome screen on the phone, with Apple's button as on iOS (AUTH-1, AUTH-9).
 *
 * @param {object} s - The phone screen, from `Board.frame`.
 * @param {object} [o] - As for `welcomeDW`.
 * @returns {void}
 * @example
 * welcomeM(s, { offline: true });
 */
function welcomeM(s, o = {}) {
  const { d } = s;
  const a = phoneApp(s, { tabs: false });
  const cx = a.x + a.w / 2;
  let { y } = a;
  if (o.offline) {
    y += ui.offlineBanner(d, a.x, y, a.w, {
      text: "You're offline. Connect to sign in.",
    });
  }
  y += 20;
  ui.logo(d, cx - 70, y, { size: 20 });
  y += 44;
  const animH = o.notice || o.invitedBy || o.offline ? 110 : 160;
  ui.animation(d, cx - 140, y, 280, animH, 'Animation: two hearts meet');
  y += animH + 20;
  if (o.notice) {
    y +=
      notice(d, a.x + 16, y, a.w - 32, o.notice, { icon: o.noticeIcon }) + 16;
  }
  if (o.invitedBy) {
    const line = `${o.invitedBy} invited you to Movie Mates`;
    const left = cx - (40 + 10 + measure(line, 16).w) / 2;
    ui.avatar(d, left + 20, y + 20, 40, o.invitedBy[0]);
    d.textMid(left + 50, y + 20, line, { size: 16 });
    y += 60;
  }
  d.text(cx, y, 'Find what you both\nwant to watch.', {
    size: 26,
    align: 'center',
  });
  y += 74;
  d.text(
    cx,
    y,
    "Like titles in private. When you both\nlike one, it's a match.",
    { size: 14, color: C.text, align: 'center' }
  );
  y += 50;
  [
    'Continue with email',
    'Continue with Google',
    'Continue with Apple',
  ].forEach((label, i) =>
    ui.button(d, a.x + 16, y + i * 58, label, {
      w: a.w - 32,
      size: 'lg',
      disabled: o.offline,
    })
  );
  y += 172;
  d.text(cx, y, 'New here? The same buttons create your account.', {
    size: 12,
    color: C.text,
    align: 'center',
  });
  y += 22;
  d.text(cx, y, TERMS, {
    size: 11,
    color: C.muted,
    align: 'center',
    wrap: 330,
  });
  const fy = a.bottom - 40;
  link(d, cx - 8, fy, 'Privacy policy', {
    size: 12,
    color: C.muted,
    align: 'right',
  });
  link(d, cx + 8, fy, 'Terms', { size: 12, color: C.muted });
  d.text(cx, fy + 20, 'Uses the TMDB API; not endorsed or certified by TMDB.', {
    size: 11,
    color: C.muted,
    align: 'center',
  });
}

/**
 * Starts a desktop and web full screen with Back at the top left, and gives back the centered column.
 *
 * @param {object} s - The desktop screen, from `Board.frame`.
 * @param {object} [o] - `offline` (the banner first), `back: false` (no Back).
 * @returns {{ x: number, y: number, w: number, cx: number }} The column's left edge, the y to start at,
 *   its width (400) and its center.
 * @example
 * // in the first desktop frame
 * screenDW(s);
 * // → { x: 456, y: 148, w: 400, cx: 656 }
 */
function screenDW(s, o = {}) {
  const { d } = s;
  let y = s.top;
  if (o.offline) {
    y += ui.offlineBanner(d, s.x, y, s.w, {
      text: "You're offline. Connect to sign in.",
    });
  }
  if (o.back !== false) {
    ui.button(d, s.x + 24, y + 20, 'Back', { variant: 'ghost', icon: 'back' });
  }
  const cx = s.x + s.w / 2;
  return { x: cx - COL / 2, y: y + 104, w: COL, cx };
}

/**
 * Starts a phone full screen with Back in the header and no tab bar, and gives back the content area.
 *
 * @param {object} s - The phone screen, from `Board.frame`.
 * @param {object} [o] - `offline` (the banner under the header), `back` ('Back', or false).
 * @returns {{ x: number, y: number, w: number, cx: number }} The content's left edge (16 px margin),
 *   the y to start at, its width and its center.
 * @example
 * // in the first phone frame
 * screenM(s);
 * // → { x: 32, y: 130, w: 358, cx: 211 }
 */
function screenM(s, o = {}) {
  const { d } = s;
  const a = phoneApp(s, { tabs: false });
  let { y } = a;
  y += ui.phoneHeader(d, a.x, y, a.w, {
    back: o.back === undefined ? 'Back' : o.back,
  });
  if (o.offline) {
    y += ui.offlineBanner(d, a.x, y, a.w, {
      text: "You're offline. Connect to sign in.",
    });
  }
  return { x: a.x + 16, y: y + 16, w: a.w - 32, cx: a.x + a.w / 2 };
}

/**
 * Draws a screen's title and the line under it, left-aligned.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number }} c - The column, from `screenDW` or `screenM`.
 * @param {string} title - The title.
 * @param {string} [body] - The line under it; it wraps to the column.
 * @param {object} [o] - `size`, the title's size (28).
 * @returns {number} The y under them.
 * @example
 * heading(d, { x: 456, y: 148, w: 400 }, 'Check your email', 'We sent a link and a code.');
 * // → 242
 */
function heading(d, c, title, body, o = {}) {
  const t = d.text(c.x, c.y, title, { size: o.size ?? 28, wrap: c.w });
  let y = c.y + t.height + 12;
  if (body) {
    const b = d.text(c.x, y, body, { size: 15, color: C.text, wrap: c.w });
    y += b.height;
  }
  return y + 24;
}

/**
 * Draws the "Continue with email" form: the email field, the typo suggestion and Send link (AUTH-2).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number }} c - The column.
 * @param {object} [o] - `value` (what was typed), `suggest` (the "Did you mean" address), `sending`,
 *   `down` (the sign-in service didn't answer), `size` ('lg' on the phone).
 * @returns {number} The y under it.
 * @example
 * emailForm(d, c, { value: 'alex@gmial.com', suggest: 'alex@gmail.com' });
 */
function emailForm(d, c, o = {}) {
  let y = heading(
    d,
    c,
    'Continue with email',
    "We'll email you a link and a 6-digit code. No password needed."
  );
  y += ui.field(d, c.x, y, c.w, {
    label: 'Email',
    value: o.value,
    placeholder: o.value ? undefined : 'name@example.com',
  });
  if (o.suggest) {
    d.text(c.x, y + 8, 'Did you mean', { size: 13, color: C.text });
    link(d, c.x + measure('Did you mean ', 13).w, y + 8, `${o.suggest}?`, {
      size: 13,
    });
    y += 30;
  }
  y += 16;
  if (o.down) {
    y +=
      notice(
        d,
        c.x,
        y,
        c.w,
        "Sign-in isn't working right now. Try again in a few minutes."
      ) + 16;
  }
  ui.button(d, c.x, y, o.down ? 'Try again' : 'Send link', {
    variant: 'primary',
    w: c.w,
    size: 'lg',
  });
  return y + 48;
}

/**
 * Draws "Check your email": where the email went, the code field and Resend (AUTH-3, AUTH-5).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number }} c - The column.
 * @param {object} [o] - `code` (options for `codeField`), `resend` ('wait' with the countdown, 'ready',
 *   or 'off'), `spamHint` (after the first resend), `openMail` (the phone's button), `tooMany` (the code
 *   stopped working), `offlineError`.
 * @returns {number} The y under it.
 * @example
 * checkEmail(d, c, { resend: 'wait' });
 */
function checkEmail(d, c, o = {}) {
  let y = heading(
    d,
    c,
    'Check your email',
    `We sent a link and a 6-digit code to ${EMAIL}. Either one signs you in.`
  );
  link(d, c.x, y - 12, 'Use a different email');
  y += 24;
  if (o.openMail) {
    ui.button(d, c.x, y, 'Open email app', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
    });
    y += 64;
  }
  if (o.tooMany) {
    y +=
      notice(
        d,
        c.x,
        y,
        c.w,
        "That's 3 wrong codes, so this code stopped working. Send a new email to get a new one."
      ) + 16;
    ui.button(d, c.x, y, 'Send a new email', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
    });
    return y + 48;
  }
  y += codeField(d, c.x, y, c.w, o.code) + 20;
  if (o.offlineError) {
    y += notice(d, c.x, y, c.w, o.offlineError, { icon: 'offline' }) + 16;
  }
  const label = o.resend === 'wait' ? 'Resend email in 0:24' : 'Resend email';
  ui.button(d, c.x, y, label, {
    disabled: o.resend !== 'ready',
    size: o.openMail ? 'lg' : 'md',
    w: o.openMail ? c.w : undefined,
  });
  y += o.openMail ? 60 : 48;
  if (o.spamHint) {
    d.text(
      c.x,
      y,
      'Check your spam folder. The email comes from Movie Mates.',
      { size: 13, color: C.text, wrap: c.w }
    );
    y += 40;
  }
  return y;
}

/**
 * Draws the page the email's link opens in a browser: a title, a line, an optional code, and a button
 * (AUTH-4, AUTH-6).
 *
 * @param {object} s - The web screen, from `Board.frame` with `web: true`.
 * @param {object} o - `title`, `body`, `code` (shown large), `button` and `primary`.
 * @returns {void}
 * @example
 * linkPage(s, { title: 'This link no longer works', button: 'Send a new link', primary: true });
 */
function linkPage(s, o) {
  const { d } = s;
  const top = s.y + browserBar(s, 'movie-mates…/auth/link');
  const cx = s.x + s.w / 2;
  let y = top + 80;
  ui.logo(d, cx - 70, y, { size: 20 });
  y += 72;
  const c = { x: cx - COL / 2, y, w: COL };
  y = heading(d, c, o.title, o.body);
  if (o.code) {
    d.rect(c.x, y, c.w, 72, { r: 10, fill: C.fill, stroke: C.line });
    d.textMid(cx, y + 36, o.code, { size: 32, align: 'center' });
    d.text(cx, y + 84, 'The code works for 15 minutes.', {
      size: 13,
      color: C.muted,
      align: 'center',
    });
    y += 128;
  }
  if (o.button) {
    ui.button(d, c.x, y, o.button, {
      variant: o.primary ? 'primary' : 'secondary',
      w: c.w,
      size: 'lg',
    });
  }
}

// --- Onboarding and invites ------------------------------------------------------------------------

/** The titles step 3 shows, movies and TV shows mixed, each with its type (ONBOARD-3). */
const TITLES = [
  ['Dune: Part Two', 'Movie · 2024'],
  ['The Bear', 'TV show · 2022'],
  ['Past Lives', 'Movie · 2023'],
  ['Severance', 'TV show · 2022'],
  ['Arrival', 'Movie · 2016'],
  ['Shōgun', 'TV show · 2024'],
  ['Lady Bird', 'Movie · 2017'],
  ['Fleabag', 'TV show · 2016'],
  ['Perfect Days', 'Movie · 2023'],
  ['Andor', 'TV show · 2022'],
  ['Aftersun', 'Movie · 2022'],
  ['Slow Horses', 'TV show · 2022'],
  ['Spirited Away', 'Movie · 2001'],
  ['Arcane', 'TV show · 2021'],
];

/** What a search for "sev" finds in step 3 (ONBOARD-4). */
const RESULTS = [
  ['Severance', 'TV show · 2022'],
  ['Se7en', 'Movie · 1995'],
  ['Seven Samurai', 'Movie · 1954'],
  ['The Seventh Seal', 'Movie · 1957'],
  ['Seven Seconds', 'TV show · 2018'],
  ['Seven Psychopaths', 'Movie · 2012'],
  ['Seven Pounds', 'Movie · 2008'],
];

/** The genre chips of step 2, part of the app rather than loaded from TMDB (ONBOARD-2). */
const GENRES = [
  'Action and Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family and Kids',
  'Horror',
  'Music',
  'Mystery and Thriller',
  'Reality',
  'Romance',
  'Sci-Fi and Fantasy',
  'War and History',
  'Western',
];
const PICKED = ['Comedy', 'Drama', 'Sci-Fi and Fantasy'];
const INVITE_LINK = 'movie-mates…/invite/7Kp2xQ9m';
const OFFLINE = "You're offline. The Likes you've made are saved.";

/**
 * Draws the row of step dots and "Step 2 of 4" under it: done steps filled, the current one long.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} y - The top edge.
 * @param {number} n - How many steps (4, or 3 after accepting an invite).
 * @param {number} at - The current step, from 0.
 * @returns {number} The height it takes, 34.
 * @example
 * stepDots(d, 656, 60, 4, 1);
 * // → 34 (one dark dot, a long one, then two empty ones)
 */
function stepDots(d, cx, y, n, at) {
  const dot = 10;
  const long = 26;
  const gap = 10;
  let x = cx - (long + (n - 1) * dot + (n - 1) * gap) / 2;
  for (let i = 0; i < n; i += 1) {
    if (i === at) {
      d.rect(x, y, long, dot, { r: 5, fill: C.ink, stroke: C.ink, rough: 0 });
      x += long + gap;
    } else {
      d.circle(x + dot / 2, y + dot / 2, dot, {
        fill: i < at ? C.dim : C.white,
        stroke: i < at ? C.dim : C.line,
        rough: 0,
      });
      x += dot + gap;
    }
  }
  d.text(cx, y + 16, `Step ${at + 1} of ${n}`, {
    size: 12,
    color: C.muted,
    align: 'center',
  });
  return 34;
}

/**
 * Starts an onboarding step on desktop and web: full screen, the step dots at the top, Back from step 2.
 *
 * @param {object} s - The desktop screen, from `Board.frame`.
 * @param {object} [o] - `step` (from 0; none for the invite screens), `steps` (4), `w` (the column's width,
 *   400), `offline` (the banner first), `back` (true from step 2).
 * @returns {{ x: number, y: number, w: number, cx: number }} The centered column, and the y to start at.
 * @example
 * // in the first desktop frame
 * onboardDW(s, { step: 2, w: 976 });
 * // → { x: 168, y: 132, w: 976, cx: 656 }
 */
function onboardDW(s, o = {}) {
  const { d } = s;
  let y = s.top;
  if (o.offline) y += ui.offlineBanner(d, s.x, y, s.w, { text: OFFLINE });
  if (o.back ?? o.step > 0) {
    ui.button(d, s.x + 24, y + 20, 'Back', { variant: 'ghost', icon: 'back' });
  }
  const cx = s.x + s.w / 2;
  if (o.step !== undefined) stepDots(d, cx, y + 28, o.steps ?? 4, o.step);
  const w = o.w ?? COL;
  return { x: cx - w / 2, y: y + 92, w, cx };
}

/**
 * Starts an onboarding step on the phone: Back in the header and the step dots in its middle.
 *
 * @param {object} s - The phone screen, from `Board.frame`.
 * @param {object} [o] - As for `onboardDW`, without `w`.
 * @returns {{ x: number, y: number, w: number, cx: number }} The content area, with 16 px margins.
 * @example
 * // in the first phone frame
 * onboardM(s, { step: 0 });
 * // → { x: 32, y: 130, w: 358, cx: 211 }
 */
function onboardM(s, o = {}) {
  const { d } = s;
  const a = phoneApp(s, { tabs: false });
  let { y } = a;
  const h = ui.phoneHeader(d, a.x, y, a.w, {
    back: (o.back ?? o.step > 0) ? 'Back' : false,
  });
  if (o.step !== undefined)
    stepDots(d, a.x + a.w / 2, y + 6, o.steps ?? 4, o.step);
  y += h;
  if (o.offline) y += ui.offlineBanner(d, a.x, y, a.w, { text: OFFLINE });
  return { x: a.x + 16, y: y + 16, w: a.w - 32, cx: a.x + a.w / 2 };
}

/**
 * Draws step 3's progress line, "1 movie ✓ · 1 TV show", with the part still missing highlighted.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} cy - The center, down.
 * @param {{ movies: number, tv: number }} o - How many of each are liked.
 * @returns {void}
 * @example
 * progressLine(d, 168, 776, { movies: 2, tv: 0 });
 * // draws "2 movies ✓ · [1 TV show]"
 */
function progressLine(d, x, cy, o) {
  let px = x;
  [
    [o.movies, 'movie', 'movies'],
    [o.tv, 'TV show', 'TV shows'],
  ].forEach(([n, one, many], i) => {
    if (i) {
      px += d.textMid(px, cy, '·', { size: 15, color: C.muted }).width + 10;
    }
    if (n) {
      px += d.textMid(px, cy, `${n} ${n === 1 ? one : many}`, {
        size: 15,
      }).width;
      ui.icon(d, 'check', px + 12, cy, 14);
      px += 32;
    } else {
      const label = `1 ${one}`;
      const w = measure(label, 15).w + 24;
      d.rect(px, cy - 15, w, 30, { r: 15, fill: C.mid, stroke: C.ink });
      d.textMid(px + 12, cy, label, { size: 15 });
      px += w + 10;
    }
  });
}

/**
 * Draws the phone's bottom bar of an onboarding step: a line on top, an optional progress line, and full
 * width buttons within thumb reach.
 *
 * @param {object} s - The phone screen, from `Board.frame`.
 * @param {object} [o] - `buttons` ([label, button options] pairs, top to bottom), `progress` (as for
 *   `progressLine`), `bottom` (where it ends: above the home indicator, or the keyboard's top edge).
 * @returns {number} The y of its top edge: the content scrolls under it. It's drawn when the frame
 *   ends (`s.later`), on top of the content.
 * @example
 * footerM(s, { buttons: [['Continue', { variant: 'primary' }]] });
 * // → 756 in the first phone frame
 */
function footerM(s, o = {}) {
  const { d } = s;
  const buttons = o.buttons ?? [];
  const bottom = o.bottom ?? s.bottom - 34;
  const top = bottom - (16 + (o.progress ? 36 : 0) + buttons.length * 56);
  // drawn last, over the content that scrolls under it
  s.later.push(() => {
    d.rect(s.x, top, s.w, bottom - top, {
      fill: C.white,
      stroke: C.white,
      rough: 0,
    });
    d.line(
      [
        [s.x, top],
        [s.x + s.w, top],
      ],
      { stroke: C.line }
    );
    let y = top + 12;
    if (o.progress) {
      progressLine(d, s.x + 16, y + 14, o.progress);
      y += 36;
    }
    buttons.forEach(([label, bo]) => {
      ui.button(d, s.x + 16, y, label, { w: s.w - 32, size: 'lg', ...bo });
      y += 56;
    });
  });
  return top;
}

/**
 * Draws the bar at the bottom of step 3 on desktop and web: the progress line on the left, Continue on
 * the right, both lined up with the grid.
 *
 * @param {object} s - The desktop screen, from `Board.frame`.
 * @param {{ x: number, w: number }} c - The column, from `onboardDW`.
 * @param {object} o - `progress` (as for `progressLine`), `button` (its label) and `disabled`.
 * @returns {number} The y of its top edge: the grid scrolls under it. It's drawn when the frame ends
 *   (`s.later`), on top of the grid.
 * @example
 * footerDW(s, c, { progress: { movies: 1, tv: 0 }, button: 'Continue', disabled: true });
 * // → 736 in the first desktop frame
 */
function footerDW(s, c, o) {
  const { d } = s;
  const top = s.bottom - 80;
  // drawn last, over the grid that scrolls under it
  s.later.push(() => {
    d.rect(s.x + 1, top, s.w - 2, 79, {
      fill: C.white,
      stroke: C.white,
      rough: 0,
    });
    d.line(
      [
        [s.x, top],
        [s.x + s.w, top],
      ],
      { stroke: C.line }
    );
    if (o.progress) progressLine(d, c.x, top + 40, o.progress);
    const w = Math.max(160, measure(o.button, 16).w + 48);
    ui.button(d, c.x + c.w - w, top + 16, o.button, {
      variant: 'primary',
      size: 'lg',
      w,
      disabled: o.disabled,
    });
  });
  return top;
}

/**
 * Draws a grid of title posters with their type (Movie or TV show) and the heart always showing, as in
 * step 3 of onboarding.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width to fill.
 * @param {object} o - `cols`, `gap` (16), `items` (TITLES), `liked` (indexes with a filled heart),
 *   `disabled` (the other hearts dashed), `maxY` (rows that start less than 40 px above it are left out;
 *   the others may run under a bar drawn later), `textSize`.
 * @returns {number} The height it takes.
 * @example
 * likesGrid(d, 168, 300, 976, { cols: 7, liked: [0, 2], maxY: 720 });
 * // → 489.5 (two rows of 7; the second runs under the bar)
 */
function likesGrid(d, x, y, w, o) {
  const gap = o.gap ?? 16;
  const pw = Math.floor((w - gap * (o.cols - 1)) / o.cols);
  const ph = Math.round(pw * 1.5);
  let h = 0;
  (o.items ?? TITLES).forEach(([title, year], i) => {
    const py = y + Math.floor(i / o.cols) * (ph + 48 + gap);
    if (o.maxY && py + 40 > o.maxY) return;
    const heart = pick(
      [
        [(o.liked ?? []).includes(i), 'filled'],
        [o.disabled, 'disabled'],
      ],
      'empty'
    );
    h =
      py -
      y +
      ui.poster(d, x + (i % o.cols) * (pw + gap), py, pw, {
        title,
        year,
        heart,
        textSize: o.textSize,
      });
  });
  return h;
}

/**
 * Draws the genre chips of step 2, wrapping to new rows, with the picked ones pressed.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} maxW - Where rows wrap.
 * @param {object} [o] - `size` (15), `h` (40, a touch target).
 * @returns {number} The height it takes.
 * @example
 * genreChips(d, 376, 260, 560);
 * // → 248 (5 rows)
 */
function genreChips(d, x, y, maxW, o = {}) {
  const h = o.h ?? 40;
  let cx = x;
  let cy = y;
  GENRES.forEach((label) => {
    const w =
      measure(label, o.size ?? 15).w + 28 + (PICKED.includes(label) ? 18 : 0);
    if (cx > x && cx + w > x + maxW) {
      cx = x;
      cy += h + 12;
    }
    cx +=
      ui.chip(d, cx, cy, label, {
        on: PICKED.includes(label),
        size: o.size ?? 15,
        h,
      }).w + 10;
  });
  return cy + h - y;
}

/**
 * Draws a QR code placeholder: the three corner squares and a fixed pattern of dots.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} size - The width and height.
 * @returns {void}
 * @example
 * qrCode(d, 101, 400, 220);
 * // adds a 21 × 21 module code; the dots are the same on every run
 */
function qrCode(d, x, y, size) {
  const n = 21;
  const m = size / n;
  d.rect(x - 12, y - 12, size + 24, size + 24, {
    r: 8,
    fill: C.white,
    stroke: C.line,
  });
  [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ].forEach(([i, j]) => {
    d.rect(x + i * m, y + j * m, 7 * m, 7 * m, {
      fill: C.white,
      stroke: C.ink,
      sw: m,
      rough: 0,
    });
    d.rect(x + (i + 2) * m, y + (j + 2) * m, 3 * m, 3 * m, {
      fill: C.ink,
      stroke: C.ink,
      rough: 0,
    });
  });
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const finder = (i < 8 || i > n - 9) && (j < 8 || (i < 8 && j > n - 9));
      // a fixed scatter of dots: the same on every run, with no stripes
      const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
      if (!finder && v - Math.floor(v) < 0.45) {
        d.rect(x + i * m, y + j * m, m, m, {
          fill: C.ink,
          stroke: C.ink,
          rough: 0,
        });
      }
    }
  }
}

/**
 * Draws the invite link once it's made: the link in a box with Copy link, and when it stops working
 * (INVITE-1).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number }} c - The column; the box starts at `c.y`.
 * @returns {number} The y under it.
 * @example
 * inviteLink(d, { x: 456, y: 300, w: 400 });
 * // → 388
 */
function inviteLink(d, c) {
  d.rect(c.x, c.y, c.w, 52, { r: 8, fill: C.fill, stroke: C.line });
  d.textMid(c.x + 14, c.y + 26, INVITE_LINK, { size: 15 });
  ui.button(d, c.x + c.w - 112, c.y + 8, 'Copy link', {
    variant: 'primary',
    w: 104,
  });
  d.text(
    c.x,
    c.y + 62,
    'Works once, until Nov 17. Only your name and photo show.',
    {
      size: 13,
      color: C.muted,
      wrap: c.w,
    }
  );
  return c.y + 88;
}

/**
 * Draws the accept or decline screen's middle: Sam's photo and name, what accepting means, and the two
 * buttons, equal in size and weight (INVITE-4).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number, cx: number }} c - The column.
 * @param {object} [o] - `phone` (smaller text).
 * @returns {number} The y under it.
 * @example
 * acceptInvite(d, { x: 456, y: 180, w: 400, cx: 656 });
 */
function acceptInvite(d, c, o = {}) {
  let { y } = c;
  ui.avatar(d, c.cx, y + 44, 88, 'S');
  y += 112;
  const t = d.text(c.cx, y, 'Sam wants to find things to watch with you', {
    size: o.phone ? 24 : 28,
    align: 'center',
    wrap: c.w,
  });
  y += t.height + 16;
  const b = d.text(
    c.cx,
    y,
    "You'll both see the titles you both like. Neither of you sees the rest of the other's Likes.",
    { size: 15, color: C.text, align: 'center', wrap: c.w }
  );
  y += b.height + 16;
  const cue = 'Your Likes stay private';
  ui.privateCue(d, c.cx - (measure(cue, 13).w + 20) / 2, y, cue);
  y += 44;
  const bw = (c.w - 12) / 2;
  ['Accept', 'Decline'].forEach((label, i) =>
    ui.button(d, c.x + i * (bw + 12), y, label, { w: bw, size: 'lg' })
  );
  y += 64;
  d.text(c.cx, y, 'Works once, until Nov 17.', {
    size: 13,
    color: C.muted,
    align: 'center',
  });
  return y + 24;
}

/**
 * Draws a screen for an invite that can't be used: what happened, and a way forward (INVITE-5).
 *
 * @param {object} s - The screen, from `Board.frame`.
 * @param {object} o - `title`, `body`, `buttons` ([label, button options] pairs), `phone`.
 * @returns {void}
 * @example
 * inviteProblem(s, { title: 'This invite has expired', body: 'Ask for a new one.', buttons: [['Continue', { variant: 'primary' }]] });
 */
function inviteProblem(s, o) {
  const { d } = s;
  const c = o.phone
    ? screenM(s, { back: false })
    : screenDW(s, { back: false });
  let y = heading(d, c, o.title, o.body, { size: o.phone ? 26 : 28 });
  o.buttons.forEach(([label, bo]) => {
    ui.button(d, c.x, y, label, { w: c.w, size: 'lg', ...bo });
    y += 60;
  });
}

/**
 * Draws step 1 of onboarding in a column: what Likes are, and the name field (ONBOARD-1).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number, cx: number }} c - The column.
 * @param {object} [o] - `name` (filled in from Google or Apple), `phone` (a shorter animation).
 * @returns {number} The y under the field.
 * @example
 * nameStep(d, { x: 456, y: 132, w: 400, cx: 656 });
 */
function nameStep(d, c, o = {}) {
  const ah = o.phone ? 120 : 150;
  ui.animation(d, c.cx - 140, c.y, 280, ah, 'Animation: a heart fills');
  const y = heading(
    d,
    { ...c, y: c.y + ah + 24 },
    "Like anything you'd want to watch",
    "Nobody sees your Likes, not even the people you connect with. When you both like the same title, it's a match.",
    { size: o.phone ? 24 : 28 }
  );
  return (
    y +
    ui.field(d, c.x, y, c.w, {
      label: 'What should your connections call you?',
      value: o.name,
      placeholder: o.name ? undefined : 'Your name',
      hint: o.name
        ? 'From your Google account. Invites show this name.'
        : 'Invites show this name.',
      h: 48,
      size: 16,
    })
  );
}

/**
 * Draws the whole sign-in flow as one flowchart: every way from signed out to signed in, every way back,
 * and where each one lands afterwards (AUTH-1 to AUTH-12).
 *
 * @param {object} s - The frame's area, from `Board.frame` with a size of 1760 × 1800.
 * @returns {void}
 * @example
 * B.frame('Sign-in flow · D W M · AUTH-1', { w: 1760, h: 1800 }, (s) => signInFlow(s));
 */
function signInFlow(s) {
  const { d } = s;
  // six columns and the rows, from the frame's top left corner
  const X = [150, 430, 710, 990, 1270, 1550].map((v) => s.x + v);
  const Y = (v) => s.y + v;
  const box = (x, y, text, o) => flowBox(d, x, Y(y), text, o);

  // signed out, and the welcome screen
  const start = box(
    X[3],
    60,
    'Signed out: any address, an invite link, or a session that ended',
    { kind: 'end', w: 340, ids: 'AUTH-11, AUTH-12' }
  );
  const welcome = box(
    X[3],
    190,
    'Welcome: Continue with email or Google (and Apple on iOS)',
    { w: 260, ids: 'AUTH-1' }
  );
  flowArrow(d, [
    [start.cx, start.b],
    [welcome.cx, welcome.t],
  ]);

  // email
  const email = box(X[2], 330, 'Enter your email', { ids: 'AUTH-2' });
  flowArrow(
    d,
    [
      [welcome.l, welcome.cy],
      [email.cx, welcome.cy],
      [email.cx, email.t],
    ],
    { label: 'Continue with email' }
  );
  const sent = box(X[2], 480, 'Did the email go out?', { kind: 'question' });
  flowArrow(
    d,
    [
      [email.cx, email.b],
      [sent.cx, sent.t],
    ],
    { label: 'Send link' }
  );
  const notSent = box(
    X[0],
    480,
    'Not sent: "Sign-in isn\'t working right now", or "You can send another email in 40 minutes" (5 an hour)',
    { kind: 'state', h: 110, size: 13 }
  );
  flowArrow(
    d,
    [
      [sent.l, sent.cy],
      [notSent.r, notSent.cy],
    ],
    { label: 'No' }
  );
  flowArrow(
    d,
    [
      [notSent.cx, notSent.t],
      [notSent.cx, email.cy + 15],
      [email.l, email.cy + 15],
    ],
    { label: 'Try again', dash: true }
  );
  const check = box(
    X[2],
    630,
    'Check your email: one email with a link and a 6-digit code',
    { h: 84, ids: 'AUTH-3' }
  );
  flowArrow(
    d,
    [
      [sent.cx, sent.b],
      [check.cx, check.t],
    ],
    { label: 'Yes' }
  );
  const resend = box(
    X[0],
    630,
    'Resend after 30 seconds, with a spam hint. Only the newest email works.',
    { kind: 'state', h: 84, size: 13 }
  );
  flowArrow(
    d,
    [
      [check.l, check.cy - 16],
      [resend.r, check.cy - 16],
    ],
    { label: "Didn't arrive" }
  );
  flowArrow(
    d,
    [
      [resend.r, check.cy + 16],
      [check.l, check.cy + 16],
    ],
    { label: 'Resend', dash: true }
  );
  flowArrow(
    d,
    [
      [check.r, check.cy - 12],
      [s.x + 900, check.cy - 12],
      [s.x + 900, email.cy],
      [email.r, email.cy],
    ],
    { label: 'Use a different email', at: [s.x + 900, Y(480)], dash: true }
  );

  // the link
  const openLink = box(X[1], 780, 'Open the link', { ids: 'AUTH-4' });
  const code = box(X[3], 780, 'Type the 6-digit code', { ids: 'AUTH-5' });
  flowArrow(
    d,
    [
      [check.cx, check.b],
      [check.cx, Y(715)],
      [openLink.cx, Y(715)],
      [openLink.cx, openLink.t],
    ],
    { label: 'Tap the link', at: [(check.cx + openLink.cx) / 2, Y(715)] }
  );
  flowArrow(
    d,
    [
      [check.cx, Y(715)],
      [code.cx, Y(715)],
      [code.cx, code.t],
    ],
    { label: 'Type the code' }
  );
  const linkOk = box(
    X[1],
    930,
    'Still good? (15 minutes, once, newest email)',
    {
      kind: 'question',
      w: 240,
      h: 130,
    }
  );
  flowArrow(d, [
    [openLink.cx, openLink.b],
    [linkOk.cx, linkOk.t],
  ]);
  const linkDead = box(
    X[0],
    930,
    'This link no longer works: Send a new link',
    {
      kind: 'state',
      h: 84,
      ids: 'AUTH-6',
    }
  );
  flowArrow(
    d,
    [
      [linkOk.l, linkOk.cy],
      [linkDead.r, linkDead.cy],
    ],
    { label: 'No' }
  );
  flowArrow(
    d,
    [
      [linkDead.l, linkDead.cy],
      [s.x + 15, linkDead.cy],
      [s.x + 15, email.cy - 18],
      [email.l, email.cy - 18],
    ],
    {
      label: 'Send a new link (the address filled in)',
      at: [s.x + 330, email.cy - 18],
      dash: true,
    }
  );
  const where = box(X[1], 1080, 'Where was it opened?', {
    kind: 'question',
    w: 180,
  });
  flowArrow(
    d,
    [
      [linkOk.cx, linkOk.b],
      [where.cx, where.t],
    ],
    { label: 'Yes' }
  );
  const desk = box(
    X[0],
    1080,
    "Desktop app asked: the browser page opens it, and shows the code in case it doesn't",
    { h: 100, size: 13, ids: 'AUTH-4 (W)' }
  );
  flowArrow(
    d,
    [
      [where.l, where.cy],
      [desk.r, desk.cy],
    ],
    { label: 'Desktop' }
  );
  const other = box(
    X[2],
    1080,
    'Another device: "You\'re signed in on this browser"',
    { h: 84, ids: 'AUTH-4 (W)' }
  );
  flowArrow(
    d,
    [
      [where.r, where.cy],
      [other.l, other.cy],
    ],
    { label: 'Elsewhere' }
  );

  // the code
  const codeOk = box(X[3], 930, 'Is the code right?', { kind: 'question' });
  flowArrow(d, [
    [code.cx, code.b],
    [codeOk.cx, codeOk.t],
  ]);
  const third = box(X[4], 930, 'Was it the 3rd wrong code?', {
    kind: 'question',
  });
  flowArrow(
    d,
    [
      [codeOk.r, codeOk.cy],
      [third.l, third.cy],
    ],
    { label: 'No' }
  );
  const wrong = box(
    X[4],
    780,
    '"That code doesn\'t match." It stays, selected, to fix',
    { kind: 'state', h: 84, size: 13 }
  );
  flowArrow(
    d,
    [
      [third.cx, third.t],
      [wrong.cx, wrong.b],
    ],
    { label: 'No' }
  );
  flowArrow(
    d,
    [
      [wrong.l, wrong.cy],
      [code.r, code.cy],
    ],
    { label: 'Try again', dash: true }
  );
  const stopped = box(
    X[4],
    1080,
    'The code stopped working: Send a new email',
    { kind: 'state', h: 84, size: 13 }
  );
  flowArrow(
    d,
    [
      [third.cx, third.b],
      [stopped.cx, stopped.t],
    ],
    { label: 'Yes' }
  );
  flowArrow(
    d,
    [
      [stopped.r, stopped.cy],
      [s.x + 1420, stopped.cy],
      [s.x + 1420, check.cy + 12],
      [check.r, check.cy + 12],
    ],
    {
      label: 'Send a new email',
      at: [s.x + 1160, check.cy + 12],
      dash: true,
    }
  );

  // Google and Apple
  const google = box(
    X[5],
    330,
    "Google in the system browser (D W) or sheet (M); Apple's sheet on iOS",
    { w: 260, h: 84, size: 13, ids: 'AUTH-7, AUTH-8, AUTH-9' }
  );
  flowArrow(
    d,
    [
      [welcome.r, welcome.cy - 15],
      [google.cx, welcome.cy - 15],
      [google.cx, google.t],
    ],
    {
      label: 'Continue with Google or Apple',
      at: [(welcome.r + google.cx) / 2, welcome.cy - 15],
    }
  );
  const done = box(X[5], 480, 'Finished?', { kind: 'question' });
  flowArrow(d, [
    [google.cx, google.b],
    [done.cx, done.t],
  ]);
  flowArrow(
    d,
    [
      [done.r, done.cy],
      [s.x + 1710, done.cy],
      [s.x + 1710, welcome.cy + 15],
      [welcome.r, welcome.cy + 15],
    ],
    {
      label: 'Cancelled: "Google sign-in was cancelled."',
      at: [(welcome.r + s.x + 1710) / 2, welcome.cy + 15],
      dash: true,
    }
  );

  // signed in, and where to next
  const bar = box(
    s.x + 850,
    1220,
    'Signed in. It lasts until you sign out, or 90 days without using the app (SEC-2).',
    { kind: 'end', w: 1630, h: 50 }
  );
  [
    [desk, ''],
    [where, 'Where it was asked for'],
    [other, ''],
    [codeOk, 'Yes'],
    [done, 'Yes'],
  ].forEach(([from, label]) =>
    flowArrow(
      d,
      [
        [from.cx, from.b],
        [from.cx, bar.t],
      ],
      { label, at: [from.cx, (from.b + bar.t) / 2] }
    )
  );
  const next = box(X[3], 1350, 'Where to next?', {
    kind: 'question',
    ids: 'AUTH-10, AUTH-11',
  });
  flowArrow(d, [
    [next.cx, bar.b],
    [next.cx, next.t],
  ]);
  const invite = box(X[1], 1500, 'Accept or decline the invite', {
    kind: 'end',
    ids: 'INVITE-4',
  });
  const onboard = box(X[3], 1500, 'Onboarding, at the first unfinished step', {
    kind: 'end',
    ids: 'ONBOARD-1, ONBOARD-7',
  });
  const back = box(X[5], 1500, 'The screen you tried to open, or Home', {
    kind: 'end',
    ids: 'AUTH-11',
  });
  flowArrow(
    d,
    [
      [next.l, next.cy],
      [invite.cx, next.cy],
      [invite.cx, invite.t],
    ],
    { label: 'Came from an invite' }
  );
  flowArrow(
    d,
    [
      [next.cx, next.b],
      [onboard.cx, onboard.t],
    ],
    { label: 'New, or onboarding not finished' }
  );
  flowArrow(
    d,
    [
      [next.r, next.cy],
      [back.cx, next.cy],
      [back.cx, back.t],
    ],
    { label: 'Returning' }
  );

  // what doesn't change the path
  const panelY = Y(1610);
  [
    [
      s.x + 35,
      'No passwords',
      'There is nothing to forget or reset. Every sign-in is the email link or code, Google, or Apple.\n\nForgot which one you used? Any of them with the same verified email opens the same account, with its Likes (AUTH-10).',
    ],
    [
      s.x + 885,
      'States on the same screen',
      '• Offline on Welcome: the buttons are disabled, with the reason\n• A likely typo: "Did you mean …?" fills it in; it never blocks\n• While it works: "Sending…" and "Checking…", so nothing is sent twice\n• Offline after sending: the code can be typed, and is kept\n• Every screen after Send link reads the same whether or not the address has an account',
    ],
  ].forEach(([x, title, body]) => {
    d.rect(x, panelY, 780, 170, { r: 10, fill: C.fill, stroke: C.line });
    d.text(x + 20, panelY + 16, title, { size: 18 });
    d.text(x + 20, panelY + 50, body, {
      size: 14,
      color: C.text,
      wrap: 740,
    });
  });
  s.note(
    'Built from the stories: each box shows its IDs. Every arrow out of a question is labeled; dashed arrows go back to an earlier step.'
  );
  s.note(
    'The same flow in text, as a Mermaid chart: navigation.md, "Signing in". Change both together.'
  );
}

/**
 * Draws auth.excalidraw: signing in, onboarding and arriving from an invite, on desktop and web, and on
 * the phone.
 *
 * @returns {import('./lib').Doc} The drawing.
 * @example
 * const d = buildAuth();
 * d.elements.filter((e) => e.type === 'frame').length;
 * // → 54
 */
export default function buildAuth() {
  const d = new Doc('auth');
  const B = new Board(d);

  // The flow ---------------------------------------------------------------------------------------------
  B.heading(
    'The sign-in flow',
    'Every path from signed out to signed in. Dashed arrows go back; gray boxes are states on a screen.'
  );
  B.frame(
    'Sign-in flow · D W M · AUTH-1 AUTH-2 AUTH-3 AUTH-4 AUTH-5 AUTH-6 AUTH-7 AUTH-8 AUTH-9 AUTH-10 AUTH-11 AUTH-12',
    { w: 1760, h: 1800 },
    (s) => signInFlow(s)
  );

  // Welcome --------------------------------------------------------------------------------------------
  B.heading(
    'Welcome',
    'The only screen signed out. Signing up and signing in are the same buttons.'
  );
  B.frame('Welcome · D W · AUTH-1', 'desktop', (s) => {
    welcomeDW(s);
    s.note(
      'The only signed-out screen, with no sidebar. Any other address opens it first, then goes on to that screen after sign-in (AUTH-11).'
    );
    s.note(
      'The animation is part of the app, never loaded from the network, and stands still with reduced motion. No TMDB posters here, so it works when TMDB is down.'
    );
    s.note(
      'The two buttons are the same size and weight: neither way is "the right one". The terms line covers the age rule (13 or older, decision 22) without asking for a birth date.'
    );
  });
  B.frame('Welcome · M · AUTH-1 AUTH-9', 'phone', (s) => {
    welcomeM(s);
    s.note(
      'iOS shows Continue with Apple next to Google (AUTH-9, an App Store rule). Android shows two buttons.'
    );
    s.note(
      'The TMDB line is shorter on the phone, with the same meaning (TMDB asks for it on every client).'
    );
  });
  B.frame('Welcome · offline · D W · AUTH-1', 'desktop', (s) => {
    welcomeDW(s, { offline: true });
    s.note(
      'Offline: the banner says why, and the buttons stay in place but disabled, so nothing jumps when the connection is back (States table).'
    );
  });
  B.frame('Welcome · offline · M · AUTH-1', 'phone', (s) => {
    welcomeM(s, { offline: true });
    s.note('Same as desktop: the banner pushes the screen down.');
  });
  B.frame('Welcome · Google cancelled · D W · AUTH-7', 'desktop', (s) => {
    welcomeDW(s, {
      notice: 'Google sign-in was cancelled.',
      noticeIcon: 'close',
    });
    s.note(
      'Closing the browser or denying access is a choice, not a failure: a short neutral line, not an error (AUTH-7).'
    );
    s.note(
      'The same place shows "You\'ve been signed out. Sign in again to continue." (AUTH-12) and "Your account was deleted." (AUTH-14).'
    );
  });
  B.frame('Welcome · Google cancelled · M · AUTH-8', 'phone', (s) => {
    welcomeM(s, {
      notice: 'Google sign-in was cancelled.',
      noticeIcon: 'close',
    });
    s.note('Same for Apple on iOS (AUTH-9).');
  });

  // Email ----------------------------------------------------------------------------------------------
  B.heading(
    'Email sign-in',
    'A link and a 6-digit code in the same email. No passwords.'
  );
  B.frame('Enter your email · D W · AUTH-2', 'desktop', (s) => {
    const c = screenDW(s);
    emailForm(d, c, { value: 'alex@gmial.com', suggest: EMAIL });
    s.note(
      'Send link is enabled once the text looks like an email. A likely typo shows a suggestion that fills in the field when clicked; it never blocks sending.'
    );
    s.note(
      'Back returns to the welcome screen and keeps what was typed. The next screen is the same whether or not an account exists (privacy).'
    );
    const at = s.noteSpace(70);
    ui.button(d, at.x, at.y, 'Sending…', { disabled: true, w: s.noteW });
    d.text(at.x, at.y + 44, 'While it sends: disabled, no spinner.', {
      size: 12,
      color: C.muted,
    });
  });
  B.frame('Enter your email · M · AUTH-2', 'phone', (s) => {
    const c = screenM(s);
    emailForm(d, c, { value: 'alex@gmial.com', suggest: EMAIL });
    ui.keyboard(s, { kind: 'email' });
    s.note(
      "The email keyboard, and the system's autofill. The field and Send link stay above the keyboard."
    );
  });
  B.frame('Enter your email · sign-in down · D W · AUTH-2', 'desktop', (s) => {
    const c = screenDW(s);
    emailForm(d, c, { value: EMAIL, down: true });
    s.note(
      "The sign-in service didn't answer. The email stays in the field and Try again sends it again; nothing is lost (States table)."
    );
  });
  B.frame('Enter your email · sign-in down · M · AUTH-2', 'phone', (s) => {
    const c = screenM(s);
    emailForm(d, c, { value: EMAIL, down: true });
    s.note('The keyboard closes, so the message and Try again are in view.');
  });
  B.frame('Check your email · D W · AUTH-3 AUTH-5', 'desktop', (s) => {
    const c = screenDW(s);
    checkEmail(d, c, { resend: 'wait' });
    s.note(
      'The code field is on the same screen, for someone who reads the email on another device. Pasting the whole code works; the sixth digit submits.'
    );
    s.note(
      'Resend is enabled after 30 seconds, with the countdown until then. Use a different email goes back with the address filled in.'
    );
    const at = s.noteSpace(100);
    codeField(d, at.x, at.y, s.noteW, { value: '482913', checking: true });
    d.text(at.x, at.y + 82, 'While it checks: "Checking…", no typing.', {
      size: 12,
      color: C.muted,
    });
  });
  B.frame('Check your email · M · AUTH-3 AUTH-5', 'phone', (s) => {
    const c = screenM(s);
    checkEmail(d, c, { resend: 'wait', openMail: true });
    s.note(
      'Open email app first: on the phone the link is one tap away. The code field takes the system\'s "From Mail" suggestion.'
    );
  });
  B.frame('Check your email · wrong code · D W · AUTH-5', 'desktop', (s) => {
    const c = screenDW(s);
    checkEmail(d, c, {
      resend: 'ready',
      spamHint: true,
      code: {
        value: '482931',
        selected: true,
        error: "That code doesn't match. Check the latest email.",
      },
    });
    s.note(
      'A wrong code stays in the field, selected: easy to compare with the email (a swapped digit is the usual mistake) and to type over. Screen readers announce the message.'
    );
    s.note(
      "Shown after one resend: the spam hint appears, and only the newest email's code works."
    );
  });
  B.frame('Check your email · wrong code · M · AUTH-5', 'phone', (s) => {
    const c = screenM(s);
    ui.keyboard(s, { kind: 'code', suggestion: 'From Mail: 482913' });
    const y = heading(d, c, 'Check your email', `Sent to ${EMAIL}.`);
    const fy =
      y -
      12 +
      codeField(d, c.x, y - 12, c.w, {
        value: '482931',
        selected: true,
        error: "That code doesn't match. Check the latest email.",
      });
    link(d, c.x, fy + 12, 'Use a different email');
    ui.button(d, c.x, fy + 48, 'Resend email', {});
    s.note(
      'With the keyboard open, the long line and Open email app scroll away, so the field, the message and Resend stay above the keys. The suggestion bar offers the code from the email.'
    );
  });
  B.frame(
    'Check your email · too many tries · D W · AUTH-5',
    'desktop',
    (s) => {
      const c = screenDW(s);
      checkEmail(d, c, { tooMany: true });
      s.note(
        'After 3 wrong codes the code stops working. Send a new email starts again; the old link and code no longer work.'
      );
      const at = s.noteSpace(80);
      notice(
        d,
        at.x,
        at.y,
        s.noteW,
        'You can send another email in 40 minutes.',
        { size: 13 }
      );
      d.text(
        at.x,
        at.y + 60,
        'After 5 emails in an hour. It never says\nwhether the address has an account.',
        { size: 12, color: C.muted }
      );
    }
  );
  B.frame('Check your email · too many tries · M · AUTH-5', 'phone', (s) => {
    const c = screenM(s);
    checkEmail(d, c, { tooMany: true, openMail: true });
    s.note('Same as desktop and web.');
  });
  B.frame('Check your email · offline · D W · AUTH-5', 'desktop', (s) => {
    const c = screenDW(s, { offline: true });
    checkEmail(d, c, {
      resend: 'off',
      code: { value: '482913' },
      offlineError:
        "You're offline. Your code is kept: try again once you're back online.",
    });
    s.note(
      'Offline after sending: the code can still be typed. Submitting says "You\'re offline" and keeps the code (States table).'
    );
  });
  B.frame('Check your email · offline · M · AUTH-5', 'phone', (s) => {
    const c = screenM(s, { offline: true });
    checkEmail(d, c, {
      openMail: true,
      resend: 'off',
      code: { value: '482913' },
      offlineError:
        "You're offline. Your code is kept: try again once you're back online.",
    });
    s.note('Same as desktop and web.');
  });

  // The link -------------------------------------------------------------------------------------------
  B.heading(
    'The link in the email',
    'It opens the app that asked for it. These are the pages it opens in a browser.'
  );
  B.frame(
    'Link page · opening the app · W · AUTH-4',
    'desktop',
    (s) => {
      linkPage(s, {
        title: 'Opening Movie Mates…',
        body: "If the app didn't open, type this code in the app:",
        code: '482 913',
        button: 'Open Movie Mates',
      });
      s.note(
        "The desktop app asked for the link. Email links open in the browser first, so this page opens the app to finish signing in, and shows the code in case it doesn't open (AUTH-4)."
      );
    },
    { web: true }
  );
  B.frame(
    'Link page · signed in here · W · AUTH-4',
    'desktop',
    (s) => {
      linkPage(s, {
        title: "You're signed in on this browser",
        body: 'To sign in on another device, type the code from the email.',
        button: 'Go to Movie Mates',
        primary: true,
      });
      s.note(
        "The link was opened on a device that didn't ask for it: it signs in this browser and says so (AUTH-4)."
      );
    },
    { web: true }
  );
  B.frame(
    'Link page · no longer works · W · AUTH-6',
    'desktop',
    (s) => {
      linkPage(s, {
        title: 'This link no longer works',
        body: 'It expired or was already used. A link works once, for 15 minutes.',
        button: 'Send a new link',
        primary: true,
      });
      s.note(
        'Never says which account it was for. Send a new link goes to "Continue with email", with the address filled in when the app knows it (AUTH-6).'
      );
      s.note(
        'Already signed in on this device: "You\'re already signed in." with Go to Movie Mates instead.'
      );
    },
    { web: true }
  );
  B.frame('Link no longer works · M · AUTH-6', 'phone', (s) => {
    const c = screenM(s, { back: false });
    const y = heading(
      d,
      c,
      'This link no longer works',
      'It expired or was already used. A link works once, for 15 minutes.'
    );
    ui.button(d, c.x, y, 'Send a new link', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
    });
    s.note(
      'On the phone the link opens the app itself, which shows this screen in place of the web page.'
    );
  });

  // Google and Apple -----------------------------------------------------------------------------------
  B.heading(
    'Google and Apple',
    'In the system browser or the system sheet: the app never sees a Google password.'
  );
  B.frame('Finish in your browser · D · AUTH-7', 'desktop', (s) => {
    const cx = s.x + s.w / 2;
    let y = s.top + 110;
    ui.logo(d, cx - 70, y, { size: 20 });
    y += 60;
    ui.animation(d, cx - 120, y, 240, 140, 'Animation: waiting, gently');
    y += 170;
    d.text(cx, y, 'Finish signing in in your browser', {
      size: 28,
      align: 'center',
    });
    y += 48;
    d.text(
      cx,
      y,
      "We opened Google in your browser. Come back here when you're done.",
      { size: 15, color: C.text, align: 'center' }
    );
    y += 48;
    ui.button(d, cx - 60, y, 'Cancel', { w: 120 });
    s.note(
      'Google opens in the system browser, not inside the app, so the saved Google session and password manager work (AUTH-7).'
    );
    s.note(
      'After Google, the browser tab says "You can close this tab" and the app comes to the front, signed in. Cancel goes back to the welcome screen.'
    );
  });
  B.frame('Google sign-in · M · AUTH-8', 'phone', (s) => {
    welcomeM(s);
    s.flush();
    ui.scrim(d, s.x, s.y, s.w, s.h, { r: 48 });
    const top = s.bottom - 380;
    const c = ui.sheet(d, s.x, top, s.w, 380, {
      title: 'Choose an account',
    });
    d.text(s.x + 20, c - 10, 'to continue to Movie Mates', {
      size: 14,
      color: C.text,
    });
    [
      ['Alex Rivera', EMAIL],
      ['Alex R.', 'alex.work@gmail.com'],
    ].forEach(([name, mail], i) => {
      const y = c + 24 + i * 64;
      ui.avatar(d, s.x + 44, y + 22, 40, 'A');
      d.text(s.x + 76, y + 4, name, { size: 16 });
      d.text(s.x + 76, y + 26, mail, { size: 13, color: C.text });
    });
    ui.icon(d, 'plus', s.x + 44, c + 174, 18);
    d.textMid(s.x + 76, c + 174, 'Use another account', { size: 16 });
    ui.homeIndicator(d, s.x, s.bottom, s.w);
    s.note(
      "The system's own sheet with the Google accounts already on the phone, drawn lo-fi: it isn't ours to design (AUTH-8). On iOS, Apple's sheet works the same way (AUTH-9)."
    );
    s.note(
      "On the web, Google's page opens and returns to the page you were trying to reach."
    );
  });

  // Onboarding -----------------------------------------------------------------------------------------
  B.heading(
    'Onboarding',
    'Full screen, on the first sign-in only. Four steps; the aim is to leave with Likes.'
  );
  B.frame('Onboarding · name · D W · ONBOARD-1', 'desktop', (s) => {
    const c = onboardDW(s, { step: 0 });
    const y = nameStep(d, c);
    ui.button(d, c.x, y + 28, 'Get started', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
      disabled: true,
    });
    s.note(
      'Email sign-up: the name is empty, and Get started is enabled once there is one (PROFILE-2). No Skip: it is one step.'
    );
    s.note(
      "No Back on step 1: there's nowhere to go back to once signed in. Closing the app keeps your place; the next sign-in opens the first unfinished step (ONBOARD-7)."
    );
    s.note(
      'Every step shows the dots and "Step 1 of 4" as text, so the count is read out too.'
    );
  });
  B.frame('Onboarding · name · M · ONBOARD-1', 'phone', (s) => {
    const c = onboardM(s, { step: 0 });
    nameStep(d, c, { name: 'Alex', phone: true });
    footerM(s, { buttons: [['Get started', { variant: 'primary' }]] });
    s.note(
      'Signed in with Google: the name is filled in from the account and can be changed. Apple works the same when it gives a name.'
    );
    s.note(
      "On the phone the step's button sits at the bottom, within thumb reach, on every step."
    );
  });
  B.frame('Onboarding · genres · D W · ONBOARD-2', 'desktop', (s) => {
    const c = onboardDW(s, { step: 1, w: 560 });
    let y = heading(
      d,
      c,
      'What do you like to watch?',
      'Pick a few. The titles in the next step, and the rows on Home, come from them.'
    );
    y += genreChips(d, c.x, y, c.w) + 32;
    ui.button(d, c.x, y, 'Continue', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
    });
    ui.button(d, c.cx, y + 60, 'Skip', { variant: 'ghost', center: true });
    s.note(
      'Each genre covers movies and TV together. Picked chips are filled with a check, and screen readers hear "selected" (ONBOARD-2).'
    );
    s.note(
      'Continue once one is picked. Skip goes on with trending titles. The list is part of the app, so this step works when TMDB is down (ONBOARD-9).'
    );
    s.note('Settings can change the picks later (PROFILE).');
  });
  B.frame('Onboarding · genres · M · ONBOARD-2', 'phone', (s) => {
    const c = onboardM(s, { step: 1 });
    const y = heading(
      d,
      c,
      'What do you like to watch?',
      'Pick a few. The next titles come from them.',
      { size: 24 }
    );
    genreChips(d, c.x, y, c.w, { size: 14 });
    footerM(s, {
      buttons: [
        ['Continue', { variant: 'primary' }],
        ['Skip', { variant: 'ghost' }],
      ],
    });
    s.note('The chips wrap; the list scrolls under the bar if it needs to.');
  });
  B.frame(
    'Onboarding · first Likes · D W · ONBOARD-3 ONBOARD-4',
    'desktop',
    (s) => {
      const c = onboardDW(s, { step: 2, w: 976 });
      let y = heading(
        d,
        c,
        'Like a few titles you know',
        'At least one movie and one TV show, so you can start matching.'
      );
      y -= 8;
      ui.field(d, c.x, y, 400, {
        placeholder: 'Search for a title',
        icon: 'search',
      });
      y += 56;
      const top = footerDW(s, c, {
        progress: { movies: 2, tv: 0 },
        button: 'Continue',
        disabled: true,
      });
      likesGrid(d, c.x, y, c.w, { cols: 7, liked: [0, 2], maxY: top });
      s.note(
        'Popular titles from the picked genres, movies and TV mixed, each with its type. The heart always shows here, not only on hover, and the poster opens nothing: this step is about the heart (ONBOARD-3).'
      );
      s.note(
        'The bar stays at the bottom while the grid scrolls. The missing part is highlighted, and Continue waits for it. Show more is under the grid; liked titles stay at the top.'
      );
      s.note(
        'Every Like is saved as it is made. If saving fails, the heart empties again with a message, and it does not count (States table).'
      );
    }
  );
  B.frame('Onboarding · first Likes · M · ONBOARD-3', 'phone', (s) => {
    const c = onboardM(s, { step: 2 });
    let y = heading(
      d,
      c,
      'Like a few titles you know',
      'At least one movie and one TV show.',
      { size: 24 }
    );
    y -= 8;
    ui.field(d, c.x, y, c.w, {
      placeholder: 'Search for a title',
      icon: 'search',
    });
    y += 56;
    const top = footerM(s, {
      progress: { movies: 1, tv: 0 },
      buttons: [['Continue', { variant: 'primary', disabled: true }]],
    });
    likesGrid(d, c.x, y, c.w, {
      cols: 3,
      gap: 12,
      liked: [0],
      maxY: top,
      textSize: 12,
    });
    s.note('Three columns, scrolling down; no rows that scroll sideways.');
    const at = s.noteSpace(60);
    ui.message(d, at.x + s.noteW / 2, at.y, "Couldn't save that Like.", {
      action: 'Try again',
      maxW: s.noteW,
    });
    s.note(
      'If a Like fails to save, the heart empties again and this message shows; it does not count toward the progress line.'
    );
  });
  B.frame('Onboarding · search · D W · ONBOARD-4', 'desktop', (s) => {
    const c = onboardDW(s, { step: 2, w: 976 });
    let y = heading(
      d,
      c,
      'Like a few titles you know',
      'At least one movie and one TV show, so you can start matching.'
    );
    y -= 8;
    ui.field(d, c.x, y, 400, {
      value: 'sev',
      icon: 'search',
      shortcut: 'Clear',
    });
    y += 56;
    const top = footerDW(s, c, {
      progress: { movies: 2, tv: 1 },
      button: 'Continue',
    });
    likesGrid(d, c.x, y, c.w, {
      cols: 7,
      items: RESULTS,
      liked: [0],
      maxY: top,
    });
    s.note(
      'The same search as SEARCH, titles only (no people). Liking a result counts toward the line: Severance was the missing TV show, so Continue is on (ONBOARD-4).'
    );
    s.note('Clear goes back to the grid, with the new Likes at the top.');
  });
  B.frame('Onboarding · search · M · ONBOARD-4', 'phone', (s) => {
    const c = onboardM(s, { step: 2 });
    // the keyboard goes on top of the results that scroll under it, after the bar
    const kb = s.bottom - ui.KEYBOARD_H;
    ui.field(d, c.x, c.y, c.w, {
      value: 'sev',
      icon: 'search',
      shortcut: 'Clear',
    });
    const top = footerM(s, {
      progress: { movies: 1, tv: 1 },
      buttons: [['Continue', { variant: 'primary' }]],
      bottom: kb,
    });
    s.later.push(() => ui.keyboard(s, { kind: 'search' }));
    likesGrid(d, c.x, c.y + 56, c.w, {
      cols: 3,
      gap: 12,
      items: RESULTS,
      liked: [0],
      maxY: top,
      textSize: 12,
    });
    s.note(
      'Typing scrolls the heading away, so the field, a row of results and the bar fit above the keyboard. Pressing Search closes the keyboard and shows more.'
    );
  });
  B.frame('Onboarding · titles down · D W · ONBOARD-9', 'desktop', (s) => {
    const c = onboardDW(s, { step: 2 });
    const y = heading(
      d,
      c,
      'Like a few titles you know',
      'At least one movie and one TV show, so you can start matching.'
    );
    const h = notice(d, c.x, y, c.w, "We can't load titles right now.");
    ui.button(d, c.x, y + h + 20, 'Try again', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
      icon: 'refresh',
    });
    ui.button(d, c.cx, y + h + 80, 'Skip for now', {
      variant: 'ghost',
      center: true,
    });
    s.note(
      "TMDB doesn't answer, so there are no titles and no search. Try again asks again (ONBOARD-9)."
    );
    s.note(
      'Skip for now goes to the invite step, which works without TMDB, and onboarding counts as finished. Home then shows a "Like your first titles" card until there is a movie and a TV show in the Likes (HOME-5).'
    );
  });
  B.frame('Onboarding · titles down · M · ONBOARD-9', 'phone', (s) => {
    const c = onboardM(s, { step: 2 });
    const y = heading(
      d,
      c,
      'Like a few titles you know',
      'At least one movie and one TV show.',
      { size: 24 }
    );
    notice(d, c.x, y, c.w, "We can't load titles right now.");
    footerM(s, {
      buttons: [
        ['Try again', { variant: 'primary', icon: 'refresh' }],
        ['Skip for now', { variant: 'ghost' }],
      ],
    });
    s.note('Same as desktop and web.');
  });
  B.frame('Onboarding · offline · D W · ONBOARD-3', 'desktop', (s) => {
    const c = onboardDW(s, { step: 2, w: 976, offline: true });
    let y = heading(
      d,
      c,
      'Like a few titles you know',
      'At least one movie and one TV show, so you can start matching.'
    );
    y -= 8;
    ui.field(d, c.x, y, 400, {
      placeholder: "Search works when you're online",
      icon: 'search',
    });
    y += 56;
    const top = footerDW(s, c, {
      progress: { movies: 2, tv: 0 },
      button: 'Continue',
      disabled: true,
    });
    likesGrid(d, c.x, y, c.w, {
      cols: 7,
      liked: [0, 2],
      disabled: true,
      maxY: top,
    });
    s.note(
      'Offline, as everywhere else in the app: the titles already loaded stay, the empty hearts are disabled with the reason in the banner, and the Likes made so far are kept (non-functional requirements).'
    );
    s.note(
      'Search is disabled too. Once back online, the hearts come back and nothing has to be done again.'
    );
  });
  B.frame('Onboarding · offline · M · ONBOARD-3', 'phone', (s) => {
    const c = onboardM(s, { step: 2, offline: true });
    let y = heading(d, c, 'Like a few titles you know', undefined, {
      size: 24,
    });
    y -= 8;
    ui.field(d, c.x, y, c.w, {
      placeholder: "Search works when you're online",
      icon: 'search',
    });
    y += 56;
    const top = footerM(s, {
      progress: { movies: 1, tv: 0 },
      buttons: [['Continue', { variant: 'primary', disabled: true }]],
    });
    likesGrid(d, c.x, y, c.w, {
      cols: 3,
      gap: 12,
      liked: [0],
      disabled: true,
      maxY: top,
      textSize: 12,
    });
    s.note('Same as desktop and web.');
  });
  B.frame('Onboarding · invite · D W · ONBOARD-5', 'desktop', (s) => {
    const c = onboardDW(s, { step: 3 });
    ui.animation(d, c.cx - 140, c.y, 280, 150, 'Animation: two hearts meet');
    const y = heading(
      d,
      { ...c, y: c.y + 174 },
      'Invite your person',
      'Movie Mates finds what you both want to watch. Invite the person you watch with.'
    );
    ui.button(d, c.x, y, 'Create invite link', {
      variant: 'primary',
      w: c.w,
      size: 'lg',
    });
    ui.button(d, c.cx, y + 60, 'Skip for now', {
      variant: 'ghost',
      center: true,
    });
    s.note(
      'Onboarding already counts as finished here: the Likes are in. Skip for now goes to Home, which shows an "Invite your person" card until there is a connection (ONBOARD-5, HOME-5).'
    );
    s.note(
      'Not shown after accepting an invite: that person is already connected (ONBOARD-8).'
    );
  });
  B.frame('Onboarding · invite · M · ONBOARD-5', 'phone', (s) => {
    const c = onboardM(s, { step: 3 });
    ui.animation(d, c.cx - 140, c.y, 280, 140, 'Animation: two hearts meet');
    heading(
      d,
      { ...c, y: c.y + 164 },
      'Invite your person',
      'Movie Mates finds what you both want to watch. Invite the person you watch with.',
      { size: 24 }
    );
    footerM(s, {
      buttons: [
        ['Create invite link', { variant: 'primary' }],
        ['Skip for now', { variant: 'ghost' }],
      ],
    });
    s.note('Same as desktop and web.');
  });
  B.frame(
    'Onboarding · invite link ready · D W · ONBOARD-5 INVITE-1',
    'desktop',
    (s) => {
      const c = onboardDW(s, { step: 3 });
      let y = heading(
        d,
        c,
        'Send this link to your person',
        "When they accept, you'll see the titles you both like."
      );
      y = inviteLink(d, { ...c, y });
      ui.button(d, c.x, y + 8, 'Share…', { w: c.w, size: 'lg' });
      ui.button(d, c.x, y + 68, 'Done', {
        variant: 'primary',
        w: c.w,
        size: 'lg',
      });
      s.note(
        'The link works once and shows only your name and photo to whoever opens it (INVITE-1, P4). Copy link says "Copied" in its place for 2 seconds.'
      );
      s.note(
        'Share opens the system share sheet with "Let\'s find something to watch together on Movie Mates: …", on the web only where the browser has one.'
      );
      s.note(
        'Done goes to Home. The invite waits in Connections, under Pending invites, where it can be copied again or revoked (INVITE-3).'
      );
    }
  );
  B.frame(
    'Onboarding · invite link ready · M · ONBOARD-5 INVITE-1 INVITE-2',
    'phone',
    (s) => {
      const c = onboardM(s, { step: 3 });
      let y = heading(
        d,
        c,
        'Send this link to your person',
        "When they accept, you'll see the titles you both like.",
        { size: 24 }
      );
      y = inviteLink(d, { ...c, y });
      const bw = (c.w - 12) / 2;
      ui.button(d, c.x, y + 8, 'Share…', { w: bw, size: 'lg' });
      ui.button(d, c.x + bw + 12, y + 8, 'Show QR code', {
        w: bw,
        size: 'lg',
      });
      footerM(s, { buttons: [['Done', { variant: 'primary' }]] });
      s.note(
        "Show QR code is for the person sitting next to you (INVITE-2). Share opens the phone's share sheet."
      );
    }
  );
  B.frame('Onboarding · QR code · M · INVITE-2', 'phone', (s) => {
    const c = onboardM(s, { step: 3 });
    const y = heading(
      d,
      c,
      'Send this link to your person',
      "When they accept, you'll see the titles you both like.",
      { size: 24 }
    );
    inviteLink(d, { ...c, y });
    s.flush();
    ui.scrim(d, s.x, s.y, s.w, s.h, { r: 48 });
    const top = s.bottom - 560;
    const sy = ui.sheet(d, s.x, top, s.w, 560, { title: 'Scan to connect' });
    qrCode(d, s.x + s.w / 2 - 120, sy + 24, 240);
    d.text(
      s.x + s.w / 2,
      sy + 290,
      'Open the camera on their phone\nand point it here.',
      { size: 15, color: C.text, align: 'center' }
    );
    d.text(s.x + s.w / 2, sy + 340, 'Works once, until Nov 17.', {
      size: 13,
      color: C.muted,
      align: 'center',
    });
    ui.button(d, s.x + 16, s.bottom - 34 - 56, 'Close', {
      w: s.w - 32,
      size: 'lg',
    });
    ui.homeIndicator(d, s.x, s.bottom, s.w);
    s.note(
      'The screen stays at full brightness while the code shows. Scanning it opens the same link: the app if it is installed, or the web app (INVITE-2).'
    );
  });

  // Arriving from an invite ----------------------------------------------------------------------------
  B.heading(
    'Arriving from an invite',
    "Jo opens Sam's link. Sign in first, then accept or decline, then onboarding."
  );
  B.frame('Welcome · invited · D W · ONBOARD-8', 'desktop', (s) => {
    welcomeDW(s, { invitedBy: 'Sam' });
    s.note(
      "Opening an invite link signed out: the welcome screen, with who invited you. Only Sam's name and photo, nothing else about Sam (ONBOARD-8)."
    );
    s.note(
      'The buttons are the same. After sign-in, the accept or decline screen comes before onboarding, or before Home for an account that has finished it.'
    );
  });
  B.frame('Welcome · invited · M · ONBOARD-8', 'phone', (s) => {
    welcomeM(s, { invitedBy: 'Sam' });
    s.note('Same as desktop and web.');
  });
  B.frame('Accept or decline · D W · INVITE-4', 'desktop', (s) => {
    const c = screenDW(s, { back: false });
    acceptInvite(d, { ...c, y: c.y - 24 });
    s.note(
      'Accept and Decline are the same size and weight, and neither is preselected: you are never connected without choosing (INVITE-4).'
    );
    s.note(
      "Accept builds the shared list from both people's current Likes. A signed-in member goes straight to it; a new one does onboarding first, with 3 steps (ONBOARD-8)."
    );
    s.note(
      'Closing the app without choosing keeps the invite under "Invites for you" in Connections until it expires (INVITE-6).'
    );
  });
  B.frame('Accept or decline · M · INVITE-4', 'phone', (s) => {
    const c = screenM(s, { back: false });
    acceptInvite(d, { ...c, y: c.y + 40 }, { phone: true });
    s.note('Same as desktop and web.');
  });
  B.frame(
    'Onboarding · name · after declining · D W · INVITE-4 ONBOARD-8',
    'desktop',
    (s) => {
      const c = onboardDW(s, { step: 0 });
      const y = nameStep(d, c);
      ui.button(d, c.x, y + 28, 'Get started', {
        variant: 'primary',
        w: c.w,
        size: 'lg',
        disabled: true,
      });
      ui.message(d, c.cx, s.bottom - 76, "Declined. Sam won't be told.", {
        icon: 'check',
      });
      s.note(
        "After Decline, the link stops working and the next screen says so: onboarding as usual for a new member, with the invite step; Home for anyone else. Sam isn't told (INVITE-4, P3)."
      );
    }
  );
  B.frame(
    'Onboarding · first Likes · after accepting · M · ONBOARD-8',
    'phone',
    (s) => {
      const c = onboardM(s, { step: 2, steps: 3 });
      let y = heading(
        d,
        c,
        'Like a few titles you know',
        'Every title you and Sam both like becomes a match.',
        { size: 24 }
      );
      y -= 8;
      ui.field(d, c.x, y, c.w, {
        placeholder: 'Search for a title',
        icon: 'search',
      });
      y += 56;
      const top = footerM(s, {
        progress: { movies: 1, tv: 1 },
        buttons: [['See your matches with Sam', { variant: 'primary' }]],
      });
      likesGrid(d, c.x, y, c.w, {
        cols: 3,
        gap: 12,
        liked: [0, 1],
        maxY: top,
        textSize: 12,
      });
      s.note(
        'After accepting, there are 3 steps: the invite step is skipped because Sam is already connected. The last button says where it goes (ONBOARD-8).'
      );
      s.note(
        'It opens the shared list with Sam, which fills in as either of you likes titles; it may still be empty (MATCH-8).'
      );
    }
  );
  B.frame("Invite can't be used · expired · D W · INVITE-5", 'desktop', (s) => {
    inviteProblem(s, {
      title: 'This invite has expired',
      body: 'Ask for a new one.',
      buttons: [['Continue', { variant: 'primary' }]],
    });
    s.note(
      'Shown after sign-in. A new member goes on to onboarding as usual, with the invite step; anyone else sees Go to Home instead (INVITE-5, ONBOARD-8).'
    );
    s.note('Every case has a way forward, never a dead end.');
  });
  B.frame("Invite can't be used · expired · M · INVITE-5", 'phone', (s) => {
    inviteProblem(s, {
      title: 'This invite has expired',
      body: 'Ask for a new one.',
      buttons: [['Continue', { variant: 'primary' }]],
      phone: true,
    });
    s.note('Same as desktop and web.');
  });
  B.frame(
    "Invite can't be used · doesn't work · D W · INVITE-5",
    'desktop',
    (s) => {
      inviteProblem(s, {
        title: "This invite doesn't work anymore",
        body: 'Ask for a new one.',
        buttons: [['Go to Home', { variant: 'primary' }]],
      });
      s.note(
        'Used, revoked, a wrong code, or from an account that was deleted: the same words for all, so the screen reveals nothing (INVITE-5, P5).'
      );
    }
  );
  B.frame(
    "Invite can't be used · your own · D W · INVITE-5",
    'desktop',
    (s) => {
      inviteProblem(s, {
        title: 'This is your invite',
        body: 'Send it to the person you want to connect with.',
        buttons: [
          ['Copy link', { variant: 'primary' }],
          ['Go to Home', { variant: 'ghost' }],
        ],
      });
      s.note('Opened by the person who made it, often to check it works.');
    }
  );
  B.frame(
    "Invite can't be used · already connected · D W · INVITE-5",
    'desktop',
    (s) => {
      inviteProblem(s, {
        title: "You're already connected with Sam",
        body: 'Your matches with Sam are in your shared list.',
        buttons: [
          ['Open your matches', { variant: 'primary' }],
          ['Go to Home', { variant: 'ghost' }],
        ],
      });
      s.note('The invite stays unused, and Sam can revoke it (INVITE-3).');
    }
  );
  B.frame(
    "Invite can't be used · connection limit · D W · INVITE-5",
    'desktop',
    (s) => {
      inviteProblem(s, {
        title: 'One of you has reached the limit of 20 connections',
        body: 'The invite keeps working until Nov 17, so it can be used once there is room.',
        buttons: [['Go to Home', { variant: 'primary' }]],
      });
      s.note(
        'It says "one of you", not who, so it doesn\'t reveal how many connections Sam has (INVITE-5).'
      );
    }
  );

  return d;
}
