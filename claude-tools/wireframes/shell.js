// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// shell.excalidraw: the app frame on each client, the kinds of screen (full screen, dialog, menu, sheet,
// confirmation, panel), and two checks: text length and large text.
import { C, Doc, measure } from './lib';
import * as ui from './ui';
import { Board, desktopApp, phoneApp, pageTitle, hero } from './frames';

/**
 * Draws the lock at 24 px, for the large-text frame, where the privacy cue is drawn by hand.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @returns {void}
 * @example
 * icon2(d, 30, 30);
 * // adds the lock: a rectangle and two lines
 */
function icon2(d, cx, cy) {
  ui.icon(d, 'lock', cx, cy, 24, { color: C.text });
}

/**
 * Dims a whole screen, after drawing what was put off (the tab bar), so it's dimmed too.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {object} s - The screen, from `Board.frame`; a phone (844 tall) gets the rounder corners.
 * @returns {void}
 * @example
 * scrimAll(d, s);
 * // draws the tab bar, then a gray layer over the screen
 */
function scrimAll(d, s) {
  s.flush();
  ui.scrim(d, s.x, s.y, s.w, s.h, { r: s.h === 844 ? 48 : 10 });
}

/**
 * Draws Home on desktop and web: the heading, the hero, the chips and a grid of posters.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, y: number, w: number, bottom: number }} a - The content area, from `desktopApp`.
 * @param {object} [o] - `heroH` (250), `hover` (the poster under the pointer, -1 for none).
 * @returns {void}
 * @example
 * homeContent(d, desktopApp(s), { hover: 2 });
 * // the third poster shows its empty heart and ⋯ button
 */
function homeContent(d, a, o = {}) {
  const x = a.x + 32;
  const w = a.w - 64;
  let y = a.y + 24;
  y = pageTitle(d, x, y, 'Home');
  hero(d, x, y, w, o.heroH ?? 250);
  y += (o.heroH ?? 250) + 20;
  y +=
    ui.chips(
      d,
      x,
      y,
      ['Trending', 'Movies', 'TV shows', 'Comedy', 'Sci-Fi and Fantasy'],
      { maxW: w }
    ) + 20;
  ui.grid(d, x, y, w, { n: 12, maxY: a.bottom - 8, hover: o.hover ?? -1 });
}

/**
 * Draws Home on the phone: the header with the bell, the hero, the chips and three columns of posters.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {object} s - The screen, from `Board.frame`.
 * @param {{ x: number, y: number, w: number }} a - The content area, from `phoneApp`.
 * @returns {void}
 * @example
 * phoneHome(d, s, phoneApp(s, { active: 'Home' }));
 */
function phoneHome(d, s, a) {
  let { y } = a;
  y += ui.phoneHeader(d, a.x, y, a.w, {
    title: 'Home',
    large: true,
    right: ['bell'],
  });
  hero(d, a.x + 16, y, a.w - 32, 190);
  y += 206;
  y +=
    ui.chips(d, a.x + 16, y, ['Trending', 'Movies', 'TV shows'], {
      maxW: a.w - 32,
    }) + 16;
  ui.grid(d, a.x + 16, y, a.w - 32, {
    cols: 3,
    gap: 12,
    n: 9,
    maxY: s.bottom - 30,
  });
}

/**
 * Draws a stand-in for a title page (designed in #157): backdrop, poster, title, buttons and plot lines.
 * Below 500 px wide it's the phone version.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} maxY - Nothing is drawn below this.
 * @returns {void}
 * @example
 * titlePagePlaceholder(d, 288, 108, 976, 808);
 */
function titlePagePlaceholder(d, x, y, w, maxY) {
  const small = w < 500;
  const bh = small ? 200 : 260;
  d.rect(x, y, w, bh, { fill: C.fill, stroke: C.line, rough: 1 });
  d.line(
    [
      [x + 10, y + 10],
      [x + w - 10, y + bh - 10],
    ],
    { stroke: C.faint }
  );
  d.line(
    [
      [x + w - 10, y + 10],
      [x + 10, y + bh - 10],
    ],
    { stroke: C.faint }
  );
  const px = x + (small ? 16 : 32);
  const pw = small ? 110 : 170;
  const py = y + bh - (small ? 90 : 120);
  ui.poster(d, px, py, pw, { title: false, heart: false });
  const tx = px + pw + 20;
  const ty = py + (small ? 100 : 130);
  if (small) {
    d.text(px, py + pw * 1.5 + 16, 'Dune: Part Two', { size: 24 });
    d.text(px, py + pw * 1.5 + 50, 'Movie · 2024 · 2 h 46 min · PG-13', {
      size: 13,
      color: C.text,
    });
    ui.button(d, px, py + pw * 1.5 + 82, 'Like', {
      variant: 'primary',
      icon: 'heart',
      w: w - 32,
      size: 'lg',
    });
    const by = py + pw * 1.5 + 140;
    ui.button(d, px, by, 'Add to Watch later', {
      menu: true,
      w: (w - 40) / 2 + 40,
    });
    ui.button(d, px + (w - 40) / 2 + 48, by, 'Trailer', {
      icon: 'play',
      w: (w - 40) / 2 - 40,
    });
    ui.skeletonLines(
      d,
      px,
      by + 64,
      [w - 32, w - 60, w - 90].map((v) => v),
      { h: 10 }
    );
  } else {
    d.text(tx, ty, 'Dune: Part Two', { size: 30 });
    d.text(
      tx,
      ty + 44,
      'Movie · 2024 · 2 h 46 min · PG-13 · Sci-Fi, Adventure',
      { size: 14, color: C.text }
    );
    let bx = tx;
    bx +=
      ui.button(d, bx, ty + 80, 'Like', { variant: 'primary', icon: 'heart' })
        .w + 10;
    bx +=
      ui.button(d, bx, ty + 80, 'Add to Watch later', { menu: true }).w + 10;
    ui.button(d, bx, ty + 80, 'Trailer', { icon: 'play' });
    if (maxY > ty + 150)
      ui.skeletonLines(
        d,
        tx,
        ty + 140,
        [560, 520, 300].filter((_, i) => ty + 140 + i * 20 < maxY - 10),
        { h: 10 }
      );
  }
}

/**
 * Draws shell.excalidraw: 15 frames.
 *
 * @returns {import('./lib').Doc} The drawing.
 * @example
 * const d = buildShell();
 * d.elements.filter((e) => e.type === 'frame').length;
 * // → 15
 */
export default function buildShell() {
  const d = new Doc('shell');
  const B = new Board(d);

  B.heading(
    'Desktop and web',
    'One frame for both. The web has no window bar; the differences are in the notes.'
  );

  B.frame(
    'App shell · sidebar · D W · SEARCH-1 NOTIF-5 INVITE-6',
    'desktop',
    (s) => {
      const a = desktopApp(s, { active: 'Home' });
      homeContent(d, a, { hover: 2 });
      s.note(
        'Desktop: the window bar follows the theme (SET-7), with the macOS buttons on the left. Windows and Linux put theirs on the right.'
      );
      s.note(
        'Web: the same layout without the window bar. At 1440 px the grid gets more columns; nothing else changes.'
      );
      s.note(
        'Sidebar, top to bottom: logo (opens Home), Search, Home, Likes, Your lists, Matches, Connections; at the bottom the bell, your photo and name (Profile) and Settings.'
      );
      s.note(
        'The current item is filled and has a bar on its left, so it never relies on color alone (A11Y-9). It stays highlighted on screens opened from it.'
      );
      s.note(
        '⌘K / Ctrl+K or / focuses Search from any screen (SEARCH-1). Typing opens the Search screen.'
      );
      s.note(
        'Badges: new matches on Matches, a dot on Connections while an invite waits (INVITE-6), unread notifications on the bell (NOTIF-5).'
      );
      s.note(
        'Grids start with 20 titles and Show more adds 30 (decision 18). Everything scrolls down; nothing scrolls sideways (17).'
      );
      s.note(
        'Posters show an empty heart and the ⋯ button only on hover or keyboard focus (the pointer is on Past Lives). A filled heart always shows (HOME-4).'
      );
    }
  );

  B.frame('App shell · icons only · D W', 'narrow', (s) => {
    const a = desktopApp(s, { active: 'Likes', collapsed: true });
    // tooltip next to Likes
    d.group(() => {
      d.rect(a.x + 4, s.top + 112 + 44 + 6, 64, 28, {
        r: 6,
        fill: C.ink,
        stroke: C.ink,
      });
      d.textMid(a.x + 36, s.top + 112 + 44 + 20, 'Likes', {
        size: 13,
        color: C.white,
        align: 'center',
      });
    });
    const x = a.x + 96;
    const w = a.w - 128;
    let y = a.y + 24;
    y = pageTitle(d, x, y, 'Likes', {
      cue: 'Only you can see your Likes',
      sub: '48 Likes',
    });
    ui.grid(d, x, y, w, {
      n: 10,
      allLiked: true,
      maxY: a.bottom - 8,
      hover: -1,
    });
    s.note(
      'Below 1024 px wide the sidebar shrinks to its icons. The names become tooltips (on hover and on keyboard focus) and stay as screen reader labels.'
    );
    s.note(
      '960 × 600 is the smallest the desktop window can be. On the web this frame covers 768 to 1023 px; below 768 px the web uses the phone layout.'
    );
  });

  B.frame('App shell · full screen · D W · TITLE-1', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    ui.button(d, x, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    titlePagePlaceholder(d, x, a.y + 64, a.w - 64, a.bottom - 8);
    s.note(
      "A full screen has an address and a Back at the top. Back also works with the browser, Alt+← (⌘[ on macOS) and the mouse's back button."
    );
    s.note(
      'Back returns to the same scroll position, with the same number of titles shown after Show more, the same chips and the same search.'
    );
    s.note(
      'The sidebar item it was opened from stays highlighted (Home here).'
    );
  });

  B.row();

  B.frame('Dialog · D W · LIST-1', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Your lists' });
    const x = a.x + 32;
    let y = pageTitle(d, x, a.y + 24, 'Your lists', {
      cue: 'Only you can see your lists',
    });
    ui.button(d, a.x + a.w - 32 - 110, a.y + 28, 'New list', {
      variant: 'primary',
      icon: 'plus',
      w: 110,
    });
    for (let i = 0; i < 4; i += 1)
      d.rect(x + i * 236, y, 220, 200, {
        r: 10,
        rough: 1,
        fill: C.fill,
        stroke: C.line,
      });
    scrimAll(d, s);
    const dw = 440;
    const dh = 250;
    const dx = s.x + (s.w - dw) / 2;
    const dy = s.y + (s.h - dh) / 2;
    const box = ui.dialog(d, dx, dy, dw, dh, { title: 'New list' });
    ui.field(d, dx + 24, box.body, dw - 48, {
      label: 'Name',
      value: 'Horror to watch alone',
      counter: '21/50',
    });
    y = dy + dh - 60;
    ui.button(d, dx + dw - 24 - 90, y, 'Create', { variant: 'primary', w: 90 });
    ui.button(d, dx + dw - 24 - 90 - 10 - 90, y, 'Cancel', { w: 90 });
    s.note(
      'A dialog is a short task that returns you to the same screen. The page is dimmed behind it.'
    );
    s.note(
      'Esc, Close and a click outside close it. Focus moves into it when it opens and back to the button that opened it when it closes. No web address.'
    );
    s.note(
      'Buttons leave room for 40% longer text (LANG-7): they size to their label, and the row can wrap.'
    );
  });

  B.frame('Menu and message · D W · LIST-2 LIKE-2', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Home');
    y +=
      ui.chips(d, x, y, ['Trending', 'Movies', 'TV shows'], { maxW: w }) + 20;
    const g = ui.grid(d, x, y, w, {
      n: 12,
      maxY: a.bottom - 8,
      menuOn: 1,
      hover: -1,
    });
    const mx = x + g.pw + 16 + 6;
    ui.menu(
      d,
      mx,
      y + 40,
      280,
      [
        { text: 'Add to Watch later', icon: 'plus' },
        { text: 'Add to Horror to watch alone', icon: 'plus' },
        { text: 'Add to list…', icon: 'list', sub: '›' },
      ],
      { focus: 0 }
    );
    ui.message(d, a.x + a.w / 2, s.bottom - 72, 'Removed from your Likes.', {
      action: 'Undo',
    });
    s.note(
      "A menu holds actions on one thing. It opens from the ⋯ button, next to it; on desktop a right-click opens it too. On the web, right-click keeps the browser's own menu (open in a new tab, copy the link). ↑ and ↓ move through it, Esc closes it."
    );
    s.note(
      "The poster menu (LIST-2): Add to Watch later; Add to your last used list, by name, when it isn't Watch later; Add to list… for every list and New list. Opening the title is a click on the poster, so it isn't in the menu."
    );
    s.note(
      "A message says what happened, at the bottom of the window, with Undo for 5 seconds. It doesn't take focus, and screen readers announce it."
    );
    s.note(
      'Here: the menu is open on The Bear, and the message follows unliking a title.'
    );
    s.note(
      'Hearts (HOME-4): an empty heart and the ⋯ button show on hover and keyboard focus; a filled heart always shows. On touch screens, and on the phone, both always show.'
    );
  });

  B.frame('Confirmation · D W · LIST-7', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Your lists' });
    const x = a.x + 32;
    let y = pageTitle(d, x, a.y + 64, 'Horror to watch alone', {
      cue: 'Only you can see this list',
      sub: '12 titles',
    });
    ui.button(d, x, a.y + 16, 'Your lists', { variant: 'ghost', icon: 'back' });
    ui.grid(d, x, y, a.w - 64, { n: 6, maxY: a.bottom - 8, hover: -1 });
    scrimAll(d, s);
    const dw = 420;
    const dh = 200;
    const dx = s.x + (s.w - dw) / 2;
    const dy = s.y + (s.h - dh) / 2;
    ui.dialog(d, dx, dy, dw, dh, {
      title: 'Delete "Horror to watch alone"?',
      close: false,
    });
    d.text(
      dx + 24,
      dy + 64,
      'The list and its 12 titles will be deleted. Your Likes and your other lists stay as they are.',
      { size: 14, wrap: dw - 48, color: C.text }
    );
    y = dy + dh - 60;
    ui.button(d, dx + dw - 24 - 96, y, 'Delete', {
      variant: 'destructive',
      icon: 'trash',
      w: 96,
    });
    ui.button(d, dx + dw - 24 - 96 - 10 - 90, y, 'Cancel', {
      w: 90,
      focused: true,
    });
    s.note(
      "A confirmation is only for what can't be undone: deleting a list with titles (LIST-7) and ending a connection (CONN-3). Everything else gets a message with Undo."
    );
    s.note(
      "It names what will be lost, and only that. It doesn't promise the titles stay in your Likes: a title can be in a list without being liked."
    );
    s.note(
      "Cancel has focus first (the dashed ring), so Enter doesn't delete by accident."
    );
    s.note(
      'The destructive button is marked by its word and icon, and later by the danger color, never by color alone (A11Y-9).'
    );
  });

  B.frame('Panel · notifications · D W · NOTIF-5', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    homeContent(d, a);
    const px = a.x;
    const pw = 380;
    d.rect(px, a.y, pw, a.h, { fill: C.white, stroke: C.ink, sw: 1.5 });
    d.text(px + 20, a.y + 20, 'Notifications', { size: 20 });
    ui.iconButton(d, px + pw - 28, a.y + 32, 'close', { size: 16, target: 32 });
    const items = [
      ['S', 'New match with Sam: Dune: Part Two', '2 h', true],
      ['S', '3 new matches with Sam', 'Yesterday', true],
      ['J', 'Jo accepted your invite', 'Mon', false],
    ];
    items.forEach(([init, text, when, unread], i) => {
      const iy = a.y + 70 + i * 72;
      d.group(() => {
        if (unread)
          d.rect(px + 8, iy, pw - 16, 64, {
            r: 8,
            fill: C.faint,
            stroke: C.faint,
          });
        ui.avatar(d, px + 40, iy + 32, 40, init);
        d.text(px + 72, iy + 12, text, { size: 14, wrap: pw - 130 });
        d.text(px + 72, iy + 36, unread ? `New · ${when}` : when, {
          size: 12,
          color: C.muted,
        });
        if (unread)
          d.circle(px + pw - 28, iy + 32, 10, { fill: C.ink, stroke: C.ink });
      });
    });
    s.note(
      "The notification list opens from the bell as a panel beside the sidebar, over the page, without leaving it. Esc closes it. On the phone it's a full screen."
    );
    s.note(
      'Unread entries say New and have a dot, besides the shading. Opening one goes where its notification goes (navigation.md, deep links).'
    );
  });

  B.heading(
    'Phone',
    'iPhone 390 × 844 pt. Android uses the same layout with its own back button.'
  );

  B.frame('App shell · tabs · M · NOTIF-5 MATCH-2', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    phoneHome(d, s, a);
    s.note(
      'Five tabs, always the same, each with an icon and a name: Home · Search · Likes · Matches · Profile.'
    );
    s.note(
      "Each tab keeps its own history. Tapping the tab you're on goes back to its first screen, and tapping again scrolls to the top."
    );
    s.note(
      'The bell is in the header of Home, Likes, Matches and Profile. Search leaves the header to its field.'
    );
    s.note(
      'Your lists opens from Likes and Profile, Connections from Matches, Settings from the gear on Profile.'
    );
    s.note(
      'Targets are at least 44 pt on iOS and 48 dp on Android (A11Y-7): the tabs, the bell and the hearts.'
    );
  });

  B.frame('App shell · full screen · M · TITLE-1', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    const hh = ui.phoneHeader(d, a.x, a.y, a.w, {
      back: 'Home',
      right: ['more'],
    });
    titlePagePlaceholder(d, a.x, a.y + hh, a.w, a.bottom);
    s.note(
      "A full screen slides over the tab's screen. The tab bar stays, except in sign-in, onboarding, Delete account and the camera."
    );
    s.note(
      "Back: the header's Back (named after the previous screen), the edge swipe on iOS, the system Back on Android."
    );
  });

  B.frame('App shell · no tabs · M · ONBOARD-7', 'phone', (s) => {
    const a = phoneApp(s, { tabs: false });
    ui.phoneHeader(d, a.x, a.y, a.w, { back: true });
    [0, 1, 2, 3].forEach((i) =>
      d.circle(a.x + a.w / 2 - 30 + i * 20, a.y + 22, 8, {
        fill: i <= 1 ? C.ink : C.white,
        stroke: C.ink,
      })
    );
    d.text(a.x + a.w - 16, a.y + 13, 'Step 2 of 4', {
      size: 13,
      color: C.muted,
      align: 'right',
    });
    let y = a.y + 70;
    d.text(a.x + 16, y, 'Pick the genres you like', {
      size: 26,
      wrap: a.w - 32,
    });
    y += 76;
    d.text(
      a.x + 16,
      y,
      'Home shows more of these. You can change them later in Settings.',
      { size: 15, color: C.text, wrap: a.w - 32 }
    );
    y += 56;
    ui.chips(
      d,
      a.x + 16,
      y,
      [
        'Action and Adventure',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Family and Kids',
        'Horror',
        'Mystery and Thriller',
        'Romance',
        'Sci-Fi and Fantasy',
      ],
      { maxW: a.w - 32, on: 1, h: 44 }
    );
    ui.button(d, a.x + 16, a.bottom - 120, 'Continue', {
      variant: 'primary',
      size: 'lg',
      w: a.w - 32,
    });
    ui.button(d, a.x + 16, a.bottom - 64, 'Skip', {
      variant: 'ghost',
      size: 'lg',
      w: a.w - 32,
    });
    s.note(
      'No tab bar during sign-in, onboarding, accepting an invite from a link, Delete account and the camera.'
    );
    s.note(
      'Onboarding has Back and a row of dots for the steps, also said in words ("Step 2 of 4") for screen readers and so the dots aren\'t the only cue.'
    );
    s.note(
      'Picked chips are filled and have a check (one is picked here). The main button sits at the bottom, within reach of the thumb.'
    );
  });

  B.row();

  B.frame('Bottom sheet · M · LIST-2', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    const hh = ui.phoneHeader(d, a.x, a.y, a.w, {
      back: 'Home',
      right: ['more'],
    });
    titlePagePlaceholder(d, a.x, a.y + hh, a.w, a.bottom);
    scrimAll(d, s);
    const sh = 66 + 5 * 48 + 8 + 34;
    const sy = s.bottom - sh;
    const y = ui.sheet(d, s.x, sy, s.w, sh, { title: 'Add to list' });
    const rows = [
      { text: 'New list', icon: 'plus' },
      { text: 'Watch later', check: true },
      { text: 'Binge-watch', check: false },
      { text: 'Horror to watch alone', check: false },
      { text: 'Sunday films', check: true },
    ];
    ui.menu(d, s.x + 8, y - 8, s.w - 16, rows, {
      rowH: 48,
      size: 16,
      bare: true,
    });
    s.note(
      "A bottom sheet is the phone's version of a dialog or a menu. It rises from the bottom; swipe down or tap outside to close."
    );
    s.note(
      'One sheet at a time, never a sheet on a sheet. Rows are at least 48 tall.'
    );
    s.note(
      "Here: the list menu from Add to list (LIST-2). Ticking adds and unticking removes at once; there's no Save."
    );
  });

  B.frame('Confirmation · M · LIST-7', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Likes' });
    const hh = ui.phoneHeader(d, a.x, a.y, a.w, {
      back: 'Your lists',
      right: ['more'],
    });
    let y = a.y + hh + 4;
    d.text(a.x + 16, y, 'Horror to watch alone', { size: 24 });
    ui.privateCue(d, a.x + 16, y + 38, 'Only you can see this list');
    y += 76;
    ui.grid(d, a.x + 16, y, a.w - 32, {
      cols: 3,
      gap: 12,
      n: 9,
      maxY: s.bottom - 30,
    });
    scrimAll(d, s);
    const dw = 280;
    const dh = 190;
    const dx = s.x + (s.w - dw) / 2;
    const dy = s.y + (s.h - dh) / 2;
    d.rect(dx, dy, dw, dh, {
      r: 14,
      rough: 1,
      fill: C.white,
      stroke: C.ink,
      sw: 1.5,
    });
    d.text(dx + dw / 2, dy + 20, 'Delete "Horror to\nwatch alone"?', {
      size: 17,
      align: 'center',
    });
    d.text(
      dx + dw / 2,
      dy + 68,
      'The list and its 12 titles will\nbe deleted. Your Likes and your\nother lists stay as they are.',
      { size: 13, align: 'center', color: C.text }
    );
    d.line(
      [
        [dx, dy + dh - 48],
        [dx + dw, dy + dh - 48],
      ],
      { stroke: C.line }
    );
    d.line(
      [
        [dx + dw / 2, dy + dh - 48],
        [dx + dw / 2, dy + dh],
      ],
      { stroke: C.line }
    );
    d.textMid(dx + dw / 4, dy + dh - 24, 'Cancel', {
      size: 17,
      align: 'center',
    });
    d.textMid(dx + (dw * 3) / 4, dy + dh - 24, 'Delete', {
      size: 17,
      align: 'center',
    });
    s.note(
      "On the phone a confirmation is the system's own alert (iOS alert, Android dialog), with the same words as on desktop and web."
    );
    s.note(
      "Cancel comes first. Delete is marked as destructive the platform's way."
    );
  });

  B.frame('Notifications · full screen · M · NOTIF-5', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    const hh = ui.phoneHeader(d, a.x, a.y, a.w, {
      back: 'Home',
      title: 'Notifications',
    });
    const items = [
      ['S', 'New match with Sam: Dune: Part Two', '2 h', true],
      ['S', '3 new matches with Sam', 'Yesterday', true],
      ['J', 'Jo accepted your invite', 'Mon', false],
    ];
    items.forEach(([init, text, when, unread], i) => {
      const iy = a.y + hh + 8 + i * 76;
      if (unread)
        d.rect(a.x + 8, iy, a.w - 16, 68, {
          r: 8,
          fill: C.faint,
          stroke: C.faint,
        });
      ui.avatar(d, a.x + 40, iy + 34, 44, init);
      d.text(a.x + 74, iy + 12, text, { size: 15, wrap: a.w - 130 });
      d.text(a.x + 74, iy + 40, unread ? `New · ${when}` : when, {
        size: 13,
        color: C.muted,
      });
      if (unread)
        d.circle(a.x + a.w - 28, iy + 34, 10, { fill: C.ink, stroke: C.ink });
    });
    s.note(
      'The bell opens the notification list as a full screen on the phone (a panel on desktop and web). The web below 768 px does the same, at /notifications.'
    );
  });

  B.heading(
    'Checks',
    'Frames that test the shell against the non-functional requirements.'
  );

  B.frame(
    'Text length · Spanish and Portuguese · D W M · LANG-7',
    { w: 1180, h: 640 },
    (s) => {
      const langs = [
        [
          'English',
          null,
          ['Home', 'Search', 'Likes', 'Matches', 'Profile'],
          'Continue with email',
        ],
        [
          'Español',
          {
            search: 'Buscar',
            Home: 'Inicio',
            Likes: 'Me gusta',
            'Your lists': 'Tus listas',
            Matches: 'Coincidencias',
            Connections: 'Conexiones',
            Notifications: 'Notificaciones',
            Settings: 'Ajustes',
          },
          ['Inicio', 'Buscar', 'Me gusta', 'Coincidencias', 'Perfil'],
          'Continuar con correo electrónico',
        ],
        [
          'Português',
          {
            search: 'Buscar',
            Home: 'Início',
            Likes: 'Curtidas',
            'Your lists': 'Suas listas',
            Matches: 'Combinações',
            Connections: 'Conexões',
            Notifications: 'Notificações',
            Settings: 'Configurações',
          },
          ['Início', 'Buscar', 'Curtidas', 'Combinações', 'Perfil'],
          'Continuar com e-mail',
        ],
      ];
      langs.forEach(([name, labels], i) => {
        const x = s.x + 24 + i * 260;
        d.text(x, s.y + 20, name, { size: 18 });
        ui.sidebar(d, x, s.y + 56, 540, {
          labels: labels ?? {},
          active: 'Matches',
        });
      });
      const tx = s.x + 24 + 3 * 260;
      langs.forEach(([name, , tabs, cta], i) => {
        const y = s.y + 56 + i * 190;
        d.text(tx, y - 28 + (i === 0 ? -8 : 0), name, {
          size: 14,
          color: C.muted,
        });
        ui.tabBar(d, tx, y, 360, { labels: tabs, active: 'Matches' });
        ui.button(d, tx, y + 96, cta, {
          variant: 'secondary',
          size: 'lg',
          w: 360,
        });
      });
      const per = 360 / 5;
      const longest = measure('Coincidencias', 10).w;
      s.note(
        `The longest tab name, "Coincidencias", is ${longest} px at 10 pt in a tab ${Math.round(per)} pt wide (a fifth of 360). It fits, with little room.`
      );
      s.note(
        'Rule for translators: tab names at most 13 characters; sidebar names may wrap to two lines; buttons size to their text and are never a fixed width.'
      );
      s.note(
        '"Continuar con correo electrónico" is 70% longer than the English. Full-width buttons on the phone take it; on desktop and web the welcome buttons stack instead of sitting side by side.'
      );
      s.note(
        'The translations are placeholders to test the length, not final words (LANG-7).'
      );
    }
  );

  B.frame('Large text · 200% · M · A11Y-6', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Likes', labelSize: 10 });
    let { y } = a;
    ui.iconButton(d, a.x + a.w - 26, y + 22, 'bell', { badge: 2, target: 44 });
    y += 44;
    d.text(a.x + 16, y, 'Likes', { size: 56 });
    y += 76;
    icon2(d, a.x + 30, y + 18);
    d.text(a.x + 52, y, 'Only you can see\nyour Likes', {
      size: 26,
      color: C.text,
    });
    y += 80;
    ui.grid(d, a.x + 16, y, a.w - 32, {
      cols: 2,
      gap: 16,
      n: 4,
      allLiked: true,
      textSize: 26,
      wrapTitle: true,
      rowExtra: 110,
      maxY: s.bottom - 30,
    });
    s.note(
      'Text at 200% (A11Y-6): the grid drops from 3 columns to 2, titles wrap to two lines instead of being cut, and the header and the privacy line wrap too.'
    );
    s.note(
      'The tab bar keeps its size, as the system does: on iOS a long press shows the name large (the Large Content Viewer).'
    );
    s.note(
      'Desktop and web: 200% zoom on a 1280 px window leaves 640 px, so the web uses the phone layout. The desktop app either does the same or stops zoom at 150%: to decide before M5 builds the layout.'
    );
  });

  return d;
}
