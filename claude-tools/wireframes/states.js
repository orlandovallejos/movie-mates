// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// states.excalidraw: the state patterns every screen uses (loading, empty, errors, offline, signed out,
// messages, not found), drawn once per layout.
import { C, Doc } from './lib';
import * as ui from './ui';
import { Board, desktopApp, phoneApp, pageTitle, hero } from './frames';

// Content area helpers -----------------------------------------------------------------------------

/**
 * Sets up a desktop and web screen with the sidebar, and gives back the content area with its margins.
 *
 * @param {object} s - The screen, from `Board.frame`.
 * @param {string} active - The current sidebar item.
 * @returns {object} The area from `desktopApp`, plus `cx` (the content's left edge) and `cw` (its width).
 * @example
 * // in the first desktop frame
 * dwArea(s, 'Home');
 * // → { x: 256, y: 44, w: 1040, h: 772, bottom: 816, cx: 288, cw: 976 }
 */
function dwArea(s, active) {
  const a = desktopApp(s, { active });
  return { ...a, cx: a.x + 32, cw: a.w - 64 };
}

/**
 * Sets up a phone screen with the tab bar and a header, and gives back the area under the header.
 *
 * @param {object} s - The screen, from `Board.frame`.
 * @param {string} active - The current tab.
 * @param {string} title - The header's title.
 * @param {object} [o] - `tabs: false`, `large` (true), `back`, `right` (['bell']), as for `phoneHeader`.
 * @returns {object} The area from `phoneApp`, with `y` under the header, `cx` and `cw` inside 16 px margins.
 * @example
 * // in the first phone frame
 * mArea(s, 'Home', 'Home');
 * // → { x: 16, y: 159.5, w: 390, h: 707, bottom: 777, cx: 32, cw: 358 }
 */
function mArea(s, active, title, o = {}) {
  const a = phoneApp(s, { active, tabs: o.tabs });
  const y =
    a.y +
    ui.phoneHeader(s.d, a.x, a.y, a.w, {
      title,
      large: o.large ?? true,
      back: o.back,
      right: o.right ?? ['bell'],
    });
  return { ...a, y, cx: a.x + 16, cw: a.w - 32 };
}

/**
 * Draws a centered block, top to bottom: a picture or an icon, a title, a line of text and a button.
 * Empty states, errors and Not found all use it.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} y - The top edge.
 * @param {object} o - `picture` ({ w, h, label, draw }) or `icon`, `title`, `titleSize` (20), `body`,
 *   `wrap` (420), and the button: `action`, `actionIcon`, `actionW`, `size`, `primary: false`.
 * @returns {void}
 * @example
 * centered(d, 776, 300, { icon: 'alert', title: "Couldn't load this page", action: 'Try again' });
 */
function centered(d, cx, y, o) {
  let ny = y;
  if (o.picture) {
    ui.animation(
      d,
      cx - o.picture.w / 2,
      ny,
      o.picture.w,
      o.picture.h,
      o.picture.label
    );
    if (o.picture.draw) o.picture.draw(cx, ny + o.picture.h / 2 - 12);
    ny += o.picture.h + 24;
  } else if (o.icon) {
    ui.icon(d, o.icon, cx, ny + 20, 40, { color: C.dim });
    ny += 64;
  }
  const t = d.text(cx, ny, o.title, {
    size: o.titleSize ?? 20,
    align: 'center',
    wrap: o.wrap ?? 420,
  });
  ny += t.height + 8;
  if (o.body) {
    const b = d.text(cx, ny, o.body, {
      size: 14,
      align: 'center',
      color: C.text,
      wrap: o.wrap ?? 420,
    });
    ny += b.height + 16;
  }
  if (o.action) {
    ui.button(d, cx, ny, o.action, {
      variant: o.primary === false ? 'secondary' : 'primary',
      icon: o.actionIcon,
      w: o.actionW,
      size: o.size,
      center: true,
    });
  }
}

/**
 * Draws a small liked poster with no title, inside the empty Likes animation.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @returns {void}
 * @example
 * heartPoster(d, 776, 300);
 * // a 72 px poster with a filled heart
 */
function heartPoster(d, cx, cy) {
  ui.poster(d, cx - 36, cy - 54, 72, {
    title: false,
    heart: 'filled',
    heartTarget: 28,
  });
}

/**
 * Draws states.excalidraw: 18 frames, each state on desktop and web, and on the phone.
 *
 * @returns {import('./lib').Doc} The drawing.
 * @example
 * const d = buildStates();
 * d.elements.filter((e) => e.type === 'frame').length;
 * // → 18
 */
export default function buildStates() {
  const d = new Doc('states');
  const B = new Board(d);

  B.heading(
    'Loading, empty and error',
    "Every screen uses these patterns. Each feature's wireframes show only what differs."
  );

  // Loading ------------------------------------------------------------------------------------------
  B.frame('Loading · D W', 'desktop', (s) => {
    const a = dwArea(s, 'Home');
    let y = pageTitle(d, a.cx, a.y + 24, 'Home');
    hero(d, a.cx, y, a.cw, 250, { skeleton: true });
    y += 270;
    y +=
      ui.chips(d, a.cx, y, ['Trending', 'Movies', 'TV shows'], { maxW: a.cw }) +
      20;
    ui.grid(d, a.cx, y, a.cw, { n: 12, skeleton: true, maxY: a.bottom - 8 });
    s.note(
      'The layout appears at once, with skeletons where posters, text and grids will be. No spinner over a blank page (principle 4).'
    );
    s.note(
      'Three skeleton shapes: poster, line and circle (an avatar). What the app knows already, such as the page title and the chips, shows straight away.'
    );
    s.note(
      'Skeletons pulse gently; with reduced motion they stay still (A11Y-8). Screen readers hear "Loading" once, not every skeleton.'
    );
  });

  B.frame('Loading · M', 'phone', (s) => {
    const a = mArea(s, 'Home', 'Home');
    let { y } = a;
    hero(d, a.cx, y, a.cw, 190, { skeleton: true });
    y += 206;
    y +=
      ui.chips(d, a.cx, y, ['Trending', 'Movies', 'TV shows'], { maxW: a.cw }) +
      16;
    ui.grid(d, a.cx, y, a.cw, {
      cols: 3,
      gap: 12,
      n: 9,
      skeleton: true,
      maxY: s.bottom - 30,
    });
    s.note(
      'The same pattern on the phone. Pull to refresh works on every grid once it has loaded.'
    );
  });

  // Empty with an action ----------------------------------------------------------------------------
  B.frame('Empty · with an action · D W · LIKE-7', 'desktop', (s) => {
    const a = dwArea(s, 'Likes');
    pageTitle(d, a.cx, a.y + 24, 'Likes', {
      cue: 'Only you can see your Likes',
    });
    centered(d, a.x + a.w / 2, a.y + 170, {
      picture: {
        w: 260,
        h: 200,
        label: 'Animation: a tap fills the heart',
        draw: (cx, cy) => heartPoster(d, cx, cy),
      },
      title: "Tap the heart on anything you'd like to watch.",
      action: 'Browse titles',
    });
    s.note(
      'An empty state says what to do next, in one line, with one action. Here: no Likes yet (LIKE-7).'
    );
    s.note(
      "A short animation shows the idea instead of a paragraph. With reduced motion it's a still picture (A11Y-8). Screen readers hear the line of text, not the animation."
    );
    s.note(
      'The privacy cue stays, so the first thing a new member learns about Likes is that they are private.'
    );
  });

  B.frame('Empty · with an action · M · LIKE-7', 'phone', (s) => {
    const a = mArea(s, 'Likes', 'Likes');
    ui.privateCue(d, a.cx, a.y - 4, 'Only you can see your Likes');
    centered(d, a.x + a.w / 2, a.y + 90, {
      picture: {
        w: 220,
        h: 180,
        label: 'Animation: a tap fills the heart',
        draw: (cx, cy) => heartPoster(d, cx, cy),
      },
      title: "Tap the heart on anything you'd like to watch.",
      titleSize: 18,
      wrap: 300,
      action: 'Browse titles',
      size: 'lg',
      actionW: 300,
    });
    s.note('On the phone the action is full width and at least 48 tall.');
  });

  // Empty without an action -------------------------------------------------------------------------
  B.frame('Empty · without an action · D W · TITLE-4', 'desktop', (s) => {
    const a = dwArea(s, 'Home');
    ui.button(d, a.cx, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    let y = a.y + 72;
    d.text(a.cx, y, 'Where to watch in the United States', { size: 20 });
    d.text(a.cx + 360, y + 4, 'Change', { size: 14, color: C.text });
    d.line(
      [
        [a.cx + 360, y + 24],
        [a.cx + 408, y + 24],
      ],
      { stroke: C.text }
    );
    y += 44;
    d.rect(a.cx, y, a.cw, 80, {
      r: 10,
      rough: 1,
      fill: C.fill,
      stroke: C.line,
    });
    ui.icon(d, 'alert', a.cx + 32, y + 40, 22, { color: C.dim });
    d.textMid(
      a.cx + 60,
      y + 40,
      'Not available to stream or buy in the United States right now.',
      { size: 15 }
    );
    y += 120;
    d.text(a.cx, y, 'About', { size: 20 });
    ui.skeletonLines(
      d,
      a.cx,
      y + 40,
      [a.cw, a.cw - 80, a.cw - 200, a.cw - 400],
      { h: 10 }
    );
    y += 150;
    d.text(a.cx, y, 'Cast', { size: 20 });
    for (let i = 0; i < 6; i += 1) {
      ui.avatar(
        d,
        a.cx + 40 + i * 150,
        y + 90,
        72,
        ['T', 'Z', 'R', 'J', 'A', 'F'][i]
      );
      d.text(
        a.cx + 40 + i * 150,
        y + 136,
        [
          'Timothée C.',
          'Zendaya',
          'Rebecca F.',
          'Javier B.',
          'Austin B.',
          'Florence P.',
        ][i],
        { size: 13, align: 'center' }
      );
    }
    s.note(
      'Some empty states only inform: there is nothing to do about it. They are a calm line in muted style, in the place the content would be, never an error.'
    );
    s.note(
      'Here: a title with no services in your region (TITLE-4). It sits at the top of the section so you know before you like it for tonight. Change belongs to the section, not to the empty state.'
    );
    s.note(
      'A section with nothing at all (no cast, nothing related) is hidden instead.'
    );
  });

  B.frame('Empty · without an action · M · TITLE-4', 'phone', (s) => {
    const a = mArea(s, 'Home', 'Dune: Part Two', {
      large: false,
      back: 'Home',
      right: ['more'],
    });
    let y = a.y + 12;
    d.text(a.cx, y, 'Where to watch in the\nUnited States', { size: 20 });
    d.text(a.cx, y + 56, 'Change', { size: 15, color: C.text });
    d.line(
      [
        [a.cx, y + 76],
        [a.cx + 52, y + 76],
      ],
      { stroke: C.text }
    );
    y += 96;
    d.rect(a.cx, y, a.cw, 96, {
      r: 10,
      rough: 1,
      fill: C.fill,
      stroke: C.line,
    });
    ui.icon(d, 'alert', a.cx + 26, y + 48, 22, { color: C.dim });
    d.text(
      a.cx + 50,
      y + 20,
      'Not available to stream or buy\nin the United States right now.',
      { size: 15 }
    );
    y += 130;
    d.text(a.cx, y, 'About', { size: 20 });
    ui.skeletonLines(
      d,
      a.cx,
      y + 40,
      [a.cw, a.cw - 40, a.cw - 100, a.cw - 160],
      { h: 10 }
    );
    s.note('The same line on the phone, in the same place in the section.');
  });

  B.row();

  // Error with retry ---------------------------------------------------------------------------------
  B.frame('Error · one section · D W · TITLE-3', 'desktop', (s) => {
    const a = dwArea(s, 'Home');
    ui.button(d, a.cx, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    let y = a.y + 72;
    d.text(a.cx, y, 'About', { size: 20 });
    ui.skeletonLines(d, a.cx, y + 40, [a.cw, a.cw - 80, a.cw - 200], { h: 10 });
    y += 130;
    d.text(a.cx, y, 'Cast', { size: 20 });
    y += 44;
    d.rect(a.cx, y, a.cw, 120, { r: 10, rough: 1, stroke: C.line, dash: true });
    ui.icon(d, 'alert', a.cx + 40, y + 46, 24, { color: C.dim });
    d.text(a.cx + 72, y + 30, "Couldn't load the cast.", { size: 16 });
    d.text(a.cx + 72, y + 56, 'The rest of the page still works.', {
      size: 14,
      color: C.text,
    });
    ui.button(d, a.cx + a.cw - 140, y + 42, 'Try again', {
      icon: 'refresh',
      w: 120,
    });
    y += 160;
    d.text(a.cx, y, 'More like this', { size: 20 });
    ui.grid(d, a.cx, y + 40, a.cw, { n: 6, maxY: a.bottom - 8, hover: -1 });
    s.note(
      'When one part of a screen fails, only that part says so, with Try again; the rest of the page works (browse.md, States).'
    );
    s.note(
      'The message says what failed in plain words, never a code or "Something went wrong". The alert icon and the words carry it, not color (A11Y-9).'
    );
    s.note(
      "Try again reloads that section only. After a failed retry the text stays the same; it doesn't turn into a different error."
    );
  });

  B.frame('Error · one section · M · TITLE-3', 'phone', (s) => {
    const a = mArea(s, 'Home', 'Dune: Part Two', {
      large: false,
      back: 'Home',
      right: ['more'],
    });
    let y = a.y + 12;
    d.text(a.cx, y, 'About', { size: 20 });
    ui.skeletonLines(d, a.cx, y + 40, [a.cw, a.cw - 40, a.cw - 100], { h: 10 });
    y += 130;
    d.text(a.cx, y, 'Cast', { size: 20 });
    y += 44;
    d.rect(a.cx, y, a.cw, 150, { r: 10, rough: 1, stroke: C.line, dash: true });
    ui.icon(d, 'alert', a.cx + 30, y + 34, 22, { color: C.dim });
    d.text(a.cx + 56, y + 22, "Couldn't load the cast.", { size: 16 });
    d.text(a.cx + 56, y + 48, 'The rest of the page still\nworks.', {
      size: 14,
      color: C.text,
    });
    ui.button(d, a.cx + 16, y + 92, 'Try again', {
      icon: 'refresh',
      w: a.cw - 32,
      size: 'lg',
    });
    y += 190;
    d.text(a.cx, y, 'More like this', { size: 20 });
    ui.grid(d, a.cx, y + 40, a.cw, {
      cols: 3,
      gap: 12,
      n: 3,
      maxY: s.bottom - 30,
    });
    s.note('On the phone the button goes under the text, full width.');
  });

  // TMDB down ----------------------------------------------------------------------------------------
  B.frame('TMDB down · D W', 'desktop', (s) => {
    const a = dwArea(s, 'Home');
    pageTitle(d, a.cx, a.y + 24, 'Home');
    centered(d, a.x + a.w / 2, a.y + 220, {
      icon: 'alert',
      title: "We can't reach the movie database right now.",
      body: 'Your Likes and lists still open. Posters come back when it does.',
      action: 'Try again',
      actionIcon: 'refresh',
      primary: false,
    });
    s.note(
      "When TMDB (the movie database every title comes from) doesn't answer, screens that need it say so with Try again. Navigation keeps working."
    );
    s.note(
      'Likes and lists still open, from our own server: their grids show the saved title and year on plain tiles instead of posters.'
    );
    s.note(
      'The welcome screen and the first onboarding steps never depend on TMDB (AUTH-1, ONBOARD-9).'
    );
  });

  B.frame('TMDB down · M', 'phone', (s) => {
    const a = mArea(s, 'Likes', 'Likes');
    ui.privateCue(d, a.cx, a.y - 4, 'Only you can see your Likes');
    let y = a.y + 30;
    d.rect(a.cx, y, a.cw, 64, {
      r: 10,
      rough: 1,
      fill: C.fill,
      stroke: C.line,
    });
    ui.icon(d, 'alert', a.cx + 24, y + 32, 20, { color: C.dim });
    d.text(
      a.cx + 46,
      y + 12,
      "We can't reach the movie database.\nPosters are back when it is.",
      { size: 13 }
    );
    y += 84;
    ui.grid(d, a.cx, y, a.cw, {
      cols: 3,
      gap: 12,
      n: 9,
      allLiked: true,
      plain: true,
      maxY: s.bottom - 30,
    });
    s.note(
      'Here: Likes while TMDB is down. Your Likes come from our server, so the grid still shows them, as plain tiles with the saved title and year.'
    );
    s.note(
      'A line at the top says why there are no posters; opening a title says TMDB is down.'
    );
  });

  // Offline ------------------------------------------------------------------------------------------
  B.frame('Offline · D W · LIKE-3', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const bh = ui.offlineBanner(d, a.x, a.y, a.w);
    const cx = a.x + 32;
    const cw = a.w - 64;
    let y = pageTitle(d, cx, a.y + bh + 24, 'Home');
    y +=
      ui.chips(d, cx, y, ['Trending', 'Movies', 'TV shows'], { maxW: cw }) + 20;
    ui.grid(d, cx, y, cw, {
      n: 12,
      heart: 'disabled',
      maxY: a.bottom - 8,
      hover: 3,
    });
    ui.message(
      d,
      a.x + a.w / 2,
      s.bottom - 72,
      "You're offline. Likes can't be saved until you're back online.",
      { icon: 'offline', maxW: 560 }
    );
    s.note(
      'The offline banner sits at the top of the content, under the window bar, and pushes the screen down instead of covering it (OFFLINE-1, decision 20). Screen readers hear it once.'
    );
    s.note(
      "Offline the app calls no server. Hearts and Add to list are disabled (dashed); the heart still shows on hover (Severance here), and clicking it repeats the banner's words in a message. Nothing is kept to send later."
    );
    s.note(
      'Screens already loaded stay readable. When the connection is back the banner goes away and everything works again, without a reload.'
    );
  });

  B.frame('Offline · M · LIKE-3', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    const bh = ui.offlineBanner(d, a.x, a.y, a.w, { size: 13 });
    let y = a.y + bh;
    y += ui.phoneHeader(d, a.x, y, a.w, {
      title: 'Home',
      large: true,
      right: ['bell'],
    });
    y +=
      ui.chips(d, a.x + 16, y, ['Trending', 'Movies', 'TV shows'], {
        maxW: a.w - 32,
      }) + 16;
    ui.grid(d, a.x + 16, y, a.w - 32, {
      cols: 3,
      gap: 12,
      n: 9,
      heart: 'disabled',
      maxY: s.bottom - 30,
    });
    s.flush();
    ui.message(
      d,
      a.x + a.w / 2,
      s.bottom - 83 - 76,
      "You're offline. Likes can't be saved until you're back online.",
      { icon: 'offline', maxW: 358 }
    );
    s.note(
      'On the phone the banner sits under the status bar and above the header.'
    );
    s.note('Messages sit above the tab bar.');
  });

  B.row();

  // Signed out ---------------------------------------------------------------------------------------
  B.frame('Signed out · D W · AUTH-12', 'desktop', (s) => {
    const cx = s.x + s.w / 2;
    let y = s.top + 60;
    ui.logo(d, cx - 70, y, { size: 20 });
    y += 60;
    ui.animation(d, cx - 160, y, 320, 200, 'Animation: two hearts meet');
    y += 230;
    d.rect(cx - 220, y, 440, 48, { r: 8, fill: C.fill, stroke: C.dim });
    ui.icon(d, 'alert', cx - 196, y + 24, 18, { color: C.dim });
    d.textMid(
      cx - 176,
      y + 24,
      "You've been signed out. Sign in again to continue.",
      { size: 14 }
    );
    y += 72;
    d.text(cx, y, 'Find what you both want to watch.', {
      size: 24,
      align: 'center',
    });
    y += 50;
    ui.button(d, cx - 160, y, 'Continue with email', { w: 320, size: 'lg' });
    ui.button(d, cx - 160, y + 60, 'Continue with Google', {
      w: 320,
      size: 'lg',
    });
    d.text(cx, y + 128, 'New here? The same buttons create your account.', {
      size: 13,
      color: C.muted,
      align: 'center',
    });
    s.note(
      'Signed out, every address shows the welcome screen in place, keeping the address, and the screen opens after sign-in (AUTH-11). No sidebar.'
    );
    s.note(
      'When a session ends, a line says why (AUTH-12). The full welcome screen is drawn in auth.excalidraw (#156).'
    );
  });

  B.frame('Signed out · M · AUTH-12', 'phone', (s) => {
    const a = phoneApp(s, { tabs: false });
    const cx = a.x + a.w / 2;
    let y = a.y + 30;
    ui.logo(d, cx - 70, y, { size: 20 });
    y += 50;
    ui.animation(d, cx - 140, y, 280, 190, 'Animation: two hearts meet');
    y += 216;
    d.rect(a.x + 16, y, a.w - 32, 64, { r: 8, fill: C.fill, stroke: C.dim });
    ui.icon(d, 'alert', a.x + 40, y + 32, 18, { color: C.dim });
    d.text(
      a.x + 60,
      y + 12,
      "You've been signed out. Sign in\nagain to continue.",
      { size: 14 }
    );
    y += 88;
    d.text(cx, y, 'Find what you both want\nto watch.', {
      size: 24,
      align: 'center',
    });
    y += 84;
    ui.button(d, a.x + 16, y, 'Continue with email', {
      w: a.w - 32,
      size: 'lg',
    });
    ui.button(d, a.x + 16, y + 60, 'Continue with Google', {
      w: a.w - 32,
      size: 'lg',
    });
    ui.button(d, a.x + 16, y + 120, 'Continue with Apple', {
      w: a.w - 32,
      size: 'lg',
    });
    s.note(
      'No tab bar while signed out. Apple sign-in shows on iOS only (AUTH-9).'
    );
  });

  // Messages -----------------------------------------------------------------------------------------
  B.frame('Message · D W · LIKE-2 LIKE-3', 'desktop', (s) => {
    const a = dwArea(s, 'Likes');
    const y = pageTitle(d, a.cx, a.y + 24, 'Likes', {
      cue: 'Only you can see your Likes',
      sub: '47 Likes',
    });
    ui.grid(d, a.cx, y, a.cw, {
      n: 12,
      allLiked: true,
      maxY: a.bottom - 8,
      hover: -1,
    });
    ui.message(
      d,
      a.x + a.w / 2,
      s.bottom - 72,
      'Removed from your Likes and your matches with Sam.',
      { action: 'Undo', maxW: 560 }
    );
    const at = s.noteSpace(60);
    d.text(at.x, at.y, 'The error variant:', { size: 13, color: C.note });
    ui.message(d, at.x + s.noteW / 2, at.y + 22, "Couldn't save your Like.", {
      action: 'Try again',
      icon: 'alert',
      maxW: s.noteW,
    });
    s.note(
      'A message says something happened, at the bottom of the window. Undo lasts 5 seconds. One message at a time; a new one replaces the old.'
    );
    s.note(
      "It doesn't take focus, and screen readers announce it. Its action can be reached with the keyboard while it shows."
    );
    s.note(
      'Undo, not a confirmation, for anything that can be undone (navigation.md, section 2): unlike, remove from a list, delete an empty list.'
    );
  });

  B.frame('Message · M · LIKE-2 LIKE-3', 'phone', (s) => {
    const a = mArea(s, 'Likes', 'Likes');
    ui.privateCue(d, a.cx, a.y - 4, 'Only you can see your Likes');
    ui.grid(d, a.cx, a.y + 30, a.cw, {
      cols: 3,
      gap: 12,
      n: 9,
      allLiked: true,
      maxY: s.bottom - 30,
    });
    s.flush();
    ui.message(
      d,
      a.x + a.w / 2,
      s.bottom - 83 - 76,
      'Removed from your Likes and your matches with Sam.',
      { action: 'Undo', maxW: 358 }
    );
    s.note('Above the tab bar on the phone, so it never covers the tabs.');
  });

  // Not found ----------------------------------------------------------------------------------------
  B.frame('Not found · D W', 'desktop', (s) => {
    const a = dwArea(s, 'Home');
    ui.button(d, a.cx, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    centered(d, a.x + a.w / 2, a.y + 220, {
      icon: 'alert',
      title: "This title isn't available anymore.",
      body: 'It may have been removed from the movie database.',
      action: 'Go to Home',
    });
    s.note(
      'For a title or person TMDB no longer has, and for a list, a shared list or a connection that no longer exists: "This title isn\'t available anymore", or "This isn\'t available".'
    );
    s.note(
      "Someone else's list and a deleted one show the same screen, so an address can't be used to check whether something exists (P5)."
    );
    s.note(
      'An unknown address says "This page doesn\'t exist" with Go to Home.'
    );
  });

  B.frame('Not found · M', 'phone', (s) => {
    const a = mArea(s, 'Home', '', { large: false, back: 'Home', right: [] });
    centered(d, a.x + a.w / 2, a.y + 160, {
      icon: 'alert',
      title: "This title isn't available anymore.",
      titleSize: 18,
      wrap: 300,
      body: 'It may have been removed from the movie database.',
      action: 'Go to Home',
      size: 'lg',
      actionW: 300,
    });
    s.note(
      'If the title is in your Likes or a list, you can still remove it from there.'
    );
  });

  return d;
}
