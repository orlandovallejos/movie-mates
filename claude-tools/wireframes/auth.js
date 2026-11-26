// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// auth.excalidraw: signing in (#156). The welcome screen, email sign-in with the link and the code, the
// pages the link opens, and Google and Apple, each with its loading and error states. Onboarding and the
// invite path follow in the same file.
import { C, Doc, measure } from './lib';
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
 * Draws the phone's keyboard at the bottom of the screen, so the frames show what stays above it.
 *
 * @param {object} s - The phone screen, from `Board.frame`.
 * @param {object} [o] - `kind`: 'email' (letters with @ and .) or 'code' (the number pad);
 *   `suggestion`: the line above the keys, such as the code from Mail.
 * @returns {number} The y of the keyboard's top edge, where content must end.
 * @example
 * keyboard(s, { kind: 'code', suggestion: 'From Mail: 482913' });
 * // → 585 in the first phone frame (the keyboard is 291 px tall)
 */
function keyboard(s, o = {}) {
  const { d } = s;
  const h = 291;
  const top = s.bottom - h;
  ui.panel(d, s.x, top, s.w, h, 0, 48, { fill: C.mid, stroke: C.mid });
  let y = top + 8;
  if (o.suggestion) {
    d.textMid(s.x + s.w / 2, y + 16, o.suggestion, {
      size: 15,
      align: 'center',
    });
    y += 40;
  }
  // keys per row: the number pad, or the letters with @ and . in the bottom row
  const rows = o.kind === 'code' ? [3, 3, 3, 3] : [10, 9, 9, 5];
  const rowH = o.kind === 'code' ? 46 : 42;
  rows.forEach((n, r) => {
    const gap = 6;
    const kw = (s.w - 12 - gap * (n - 1)) / n;
    for (let i = 0; i < n; i += 1) {
      d.rect(s.x + 6 + i * (kw + gap), y + r * (rowH + 8), kw, rowH, {
        r: 5,
        fill: C.white,
        stroke: C.white,
      });
    }
  });
  d.text(
    s.x + 10,
    top + h - 30,
    o.kind === 'code' ? 'Keyboard: numbers' : 'Keyboard: email (@ .)',
    { size: 11, color: C.dim }
  );
  ui.homeIndicator(d, s.x, s.bottom, s.w);
  return top;
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
    ui.avatar(d, a.x + 36, y + 20, 40, o.invitedBy[0]);
    d.text(a.x + 64, y + 8, `${o.invitedBy} invited you\nto Movie Mates`, {
      size: 16,
    });
    y += 56;
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
 * // → 252
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
 * Draws auth.excalidraw: the sign-in frames on desktop and web, and on the phone.
 *
 * @returns {import('./lib').Doc} The drawing.
 * @example
 * const d = buildAuth();
 * d.elements.filter((e) => e.type === 'frame').length;
 * // → 24
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
    keyboard(s, { kind: 'email' });
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
    keyboard(s, { kind: 'code', suggestion: 'From Mail: 482913' });
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

  return d;
}
