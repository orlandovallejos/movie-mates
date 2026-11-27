// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// browse.excalidraw (#157): Home and Search. Loading, TMDB down and offline are drawn once for every
// screen in states.excalidraw, so these frames show only what is particular to Home and Search.
import { C, Doc, measure, wrap } from './lib';
import * as ui from './ui';
import { Board, desktopApp, hero, pageTitle, phoneApp } from './frames';

/** The Home chips: the three from HOME-2, then the genres picked in onboarding (HOME-3). */
const CHIPS = [
  'Trending',
  'Movies',
  'TV shows',
  'Comedy',
  'Drama',
  'Sci-Fi and Fantasy',
];
const FILTERS = ['All', 'Movies', 'TV shows', 'People'];

/** What a search for "dune" finds. */
const DUNE = [
  ['Dune: Part Two', 'Movie · 2024'],
  ['Dune', 'Movie · 2021'],
  ['Dune: Prophecy', 'TV show · 2024'],
  ['Dune', 'Movie · 1984'],
  ["Frank Herbert's Dune", 'TV show · 2000'],
  ["Jodorowsky's Dune", 'Movie · 2013'],
];

/** The titles a search for "emma" finds. */
const EMMA = [
  ['Emma.', 'Movie · 2020'],
  ['Emma', 'Movie · 1996'],
  ['Emma', 'TV show · 2009'],
  ['Emma Approved', 'TV show · 2013'],
  ["Emma's Chance", 'Movie · 2016'],
  ['Emma', 'Movie · 1932'],
];

/** The people a search for "emma" finds: initials, name, and what they're known for. */
const PEOPLE = [
  ['ES', 'Emma Stone', 'Acting · Poor Things, La La Land'],
  ['ET', 'Emma Thompson', 'Acting · Sense and Sensibility, Love Actually'],
  ['EW', 'Emma Watson', 'Acting · Little Women, The Bling Ring'],
  ['EC', 'Emma Corrin', 'Acting · The Crown, Deadpool & Wolverine'],
  ['EM', 'Emma Mackey', 'Acting · Sex Education, Barbie'],
];

/** The titles of the "From Marvel Studios" group (SEARCH-5). */
const MARVEL = [
  ['Deadpool & Wolverine', 'Movie · 2024'],
  ['Avengers: Endgame', 'Movie · 2019'],
  ['Loki', 'TV show · 2021'],
  ['Black Panther', 'Movie · 2018'],
  ['Iron Man', 'Movie · 2008'],
  ['WandaVision', 'TV show · 2021'],
];

/**
 * Draws a grid of posters for the given titles, with the type and year under each, as search shows them.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width to fill.
 * @param {object} o - `items` ([title, 'Movie · 2024'] pairs), `cols`, `gap` (16), `liked` (indexes with a
 *   filled heart), `hover` (desktop and web: the index under the pointer; hearts show on hover only),
 *   `focus` (the index with the keyboard focus ring), `maxY` (rows that don't fit above it are left out),
 *   `textSize` (13).
 * @returns {number} The height it takes.
 * @example
 * posterGrid(d, 288, 300, 976, { items: DUNE, cols: 6, hover: -1 });
 * // → 274.75 (one row, titles on up to two lines)
 */
function posterGrid(d, x, y, w, o) {
  const gap = o.gap ?? 16;
  const pw = Math.floor((w - gap * (o.cols - 1)) / o.cols);
  const ph = Math.round(pw * 1.5);
  const ts = o.textSize ?? 13;
  const rowH = ph + ts * 1.25 * 3 + 12;
  let h = 0;
  o.items.forEach(([title, year], i) => {
    const px = x + (i % o.cols) * (pw + gap);
    const py = y + Math.floor(i / o.cols) * (rowH + gap);
    if (o.maxY && py + rowH > o.maxY) return;
    const liked = (o.liked ?? []).includes(i);
    ui.poster(d, px, py, pw, {
      title,
      year,
      heart: liked ? 'filled' : 'empty',
      hoverable: o.hover !== undefined,
      hovered: o.hover === i,
      textSize: ts,
      wrapTitle: true,
    });
    if (o.focus === i) {
      d.rect(px - 5, py - 5, pw + 10, rowH + 4, {
        r: 10,
        stroke: C.ink,
        sw: 2,
      });
    }
    h = py - y + rowH;
  });
  return h;
}

/**
 * Draws one person result: the photo, the name and what they're known for.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; the text wraps inside it.
 * @param {string[]} person - [initials, name, known for], from PEOPLE.
 * @returns {number} The height it takes, 72.
 * @example
 * personRow(d, 32, 300, 358, PEOPLE[0]);
 * // → 72
 */
function personRow(d, x, y, w, person) {
  const [initials, name, known] = person;
  ui.avatar(d, x + 28, y + 36, 56, initials);
  d.text(x + 70, y + 14, name, { size: 16 });
  d.text(x + 70, y + 38, known, { size: 13, color: C.muted, wrap: w - 76 });
  return 72;
}

/**
 * Draws a card from HOME-5 at the top of Home: what to do next, its button, and ✕ when it can be
 * dismissed for good.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; under 500 px the button goes under the text, and the card grows to fit.
 * @param {'likes' | 'invite' | 'matches'} kind - Which card.
 * @returns {number} The height it takes.
 * @example
 * nextCard(d, 288, 140, 976, 'invite');
 * // → 84
 */
function nextCard(d, x, y, w, kind) {
  const card = {
    likes: {
      icon: 'heart',
      title: 'Like your first titles',
      body: 'A movie and a TV show, so you can start matching.',
      button: 'Pick titles',
    },
    invite: {
      icon: 'people',
      title: 'Invite your person',
      body: 'Movie Mates finds what you both want to watch.',
      button: 'Invite someone',
    },
    matches: {
      avatar: 'S',
      title: 'You have 3 new matches with Sam',
      body: 'Titles you both want to watch.',
      button: 'See matches',
      keep: true,
    },
  }[kind];
  const narrow = w < 500;
  const bw = measure(card.button, 14).w + 32;
  // the text column: on a narrow card it leaves room for ✕, on a wide one for the button too
  const textW = narrow ? w - 76 - 44 : w - 76 - bw - 96;
  const title = wrap(card.title, 16, textW);
  const body = wrap(card.body, 13, textW);
  const titleH = measure(title, 16).h;
  const bodyY = y + 18 + titleH + 6;
  const bodyH = measure(body, 13).h;
  const h = narrow
    ? bodyY + bodyH + 12 + 36 + 16 - y
    : Math.max(84, bodyY + bodyH + 18 - y);
  d.rect(x, y, w, h, { r: 12, fill: C.fill, stroke: C.line });
  if (card.avatar) ui.avatar(d, x + 40, y + 42, 48, card.avatar);
  else {
    d.circle(x + 40, y + 42, 48, { fill: C.white, stroke: C.line });
    ui.icon(d, card.icon, x + 40, y + 42, 22);
  }
  const tx = x + 76;
  d.text(tx, y + 18, title, { size: 16 });
  d.text(tx, bodyY, body, { size: 13, color: C.text });
  if (narrow) {
    ui.button(d, tx, bodyY + bodyH + 12, card.button, { variant: 'primary' });
  } else {
    ui.button(
      d,
      x + w - bw - (card.keep ? 20 : 64),
      y + h / 2 - 18,
      card.button,
      {
        variant: 'primary',
      }
    );
  }
  if (!card.keep) ui.iconButton(d, x + w - 26, y + 26, 'close');
  return h;
}

/**
 * Draws the phone's Search screen top: the large title and the search field, focused or holding what
 * was typed.
 *
 * @param {object} s - The phone screen, from `Board.frame`.
 * @param {object} [o] - `value` (what was typed), `chip` (the filter that's on, from FILTERS; no chips
 *   when the field is empty).
 * @returns {{ x: number, y: number, w: number, bottom: number }} The area under them, with 16 px margins.
 * @example
 * phoneSearch(s, { value: 'dune', chip: 0 });
 */
function phoneSearch(s, o = {}) {
  const { d } = s;
  const a = phoneApp(s, { active: 'Search' });
  let y =
    a.y + ui.phoneHeader(d, a.x, a.y, a.w, { title: 'Search', large: true });
  const x = a.x + 16;
  const w = a.w - 32;
  ui.field(d, x, y, w, {
    value: o.value,
    placeholder: 'Titles, people, studios',
    icon: 'search',
    shortcut: o.value ? '✕' : undefined,
  });
  if (!o.value)
    d.rect(x - 4, y - 4, w + 8, 48, { r: 10, stroke: C.ink, sw: 2 });
  y += 52;
  if (o.chip !== undefined) {
    y += ui.chips(d, x, y, FILTERS, { maxW: w, on: o.chip }) + 16;
  }
  return { x, y, w, bottom: a.bottom };
}

/**
 * Draws a row of posters that the window's bottom edge cuts off, to show the page goes on below.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width to fill.
 * @param {number} cols - How many posters.
 * @param {number} bottom - Where the window ends.
 * @param {object} [o] - `hearts` (draw the heart, with the second one filled), `size` (the heart, 32),
 *   `gap` (16).
 * @returns {void}
 * @example
 * cutRow(d, 288, 760, 976, 6, 816);
 */
function cutRow(d, x, y, w, cols, bottom, o = {}) {
  const gap = o.gap ?? 16;
  const pw = (w - gap * (cols - 1)) / cols;
  const hs = o.size ?? 32;
  for (let i = 0; i < cols; i += 1) {
    const px = x + i * (pw + gap);
    d.rect(px, y, pw, bottom - y - 2, {
      r: 6,
      rough: 1,
      fill: C.fill,
      stroke: C.line,
    });
    if (o.hearts) {
      d.circle(px + pw - hs / 2 - 12, y + hs / 2 + 12, hs, {
        fill: C.white,
        stroke: C.ink,
      });
      ui.icon(
        d,
        i === 1 ? 'heart-filled' : 'heart',
        px + pw - hs / 2 - 12,
        y + hs / 2 + 12,
        hs / 2
      );
    }
  }
}

/**
 * Draws the phone's poster grid: the rows that fit above the tab bar, then one row cut off under it, to
 * show the grid goes on.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {{ x: number, w: number, bottom: number }} a - The area above the tab bar, from `phoneApp`.
 * @param {number} y - The top edge.
 * @param {object} [o] - As for `ui.grid`: `n`, `offset`, `liked`.
 * @returns {void}
 * @example
 * phoneGrid(d, phoneApp(s, { active: 'Home' }), 500, { n: 9 });
 */
function phoneGrid(d, a, y, o = {}) {
  const x = a.x + 16;
  const w = a.w - 32;
  const g = ui.grid(d, x, y, w, {
    ...o,
    cols: 3,
    gap: 12,
    maxY: a.bottom - 8,
  });
  const next = y + (g.h ? g.h + 12 : 0);
  if (next < a.bottom - 24) {
    cutRow(d, x, next, w, 3, a.bottom + 12, { hearts: true, gap: 12 });
  }
}

/**
 * Draws a button with text at 200%, for the large text frame, where the kit's buttons are too small.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string} label - The text.
 * @param {object} [o] - `primary`.
 * @returns {number} Its width.
 * @example
 * bigButton(d, 160, 500, 'Trailer');
 * // → 151
 */
function bigButton(d, x, y, label, o = {}) {
  const w = measure(label, 28).w + 56;
  d.rect(x, y, w, 68, {
    r: 12,
    rough: 1,
    fill: o.primary ? C.ink : C.white,
    stroke: C.ink,
  });
  d.textMid(x + 28, y + 34, label, {
    size: 28,
    color: o.primary ? C.white : C.ink,
  });
  return w;
}

/**
 * Draws browse.excalidraw: Home and Search on desktop and web, and on the phone.
 *
 * @returns {import('./lib').Doc} The drawing.
 * @example
 * const d = buildBrowse();
 * d.elements.filter((e) => e.type === 'frame').length;
 * // → 14
 */
export default function buildBrowse() {
  const d = new Doc('browse');
  const B = new Board(d);

  // Home -----------------------------------------------------------------------------------------------
  B.heading(
    'Home',
    'One featured title, then one grid that scrolls down. Loading, TMDB down and offline: states.excalidraw.'
  );
  B.frame('Home · D W · HOME-1 HOME-2 HOME-3 HOME-4', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Home');
    hero(d, x, y, w, 250);
    y += 270;
    y += ui.chips(d, x, y, CHIPS, { maxW: w }) + 20;
    ui.grid(d, x, y, w, { n: 12, maxY: a.bottom - 8, hover: 2 });
    s.note(
      'The hero is a trending title picked at random each time Home opens, from the ones with a backdrop (HOME-1). Like is the main button; Trailer shows only when there is one.'
    );
    s.note(
      'Chips: Trending (the default), Movies, TV shows, then the genres picked in onboarding (HOME-3). The chip you pick is remembered on this device.'
    );
    s.note(
      'One grid: 20 titles, then Show more adds 30. Each poster opens the title page. Hearts show on hover or focus; filled hearts always (HOME-4).'
    );
    s.note(
      'Before M7 (no accounts yet) and after skipping the genre step, only the first three chips show.'
    );
  });
  B.frame('Home · M · HOME-1 HOME-2 HOME-4', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    let y =
      a.y +
      ui.phoneHeader(d, a.x, a.y, a.w, {
        title: 'Home',
        large: true,
        right: ['bell'],
      });
    hero(d, a.x + 16, y, a.w - 32, 190);
    y += 206;
    y += ui.chips(d, a.x + 16, y, CHIPS, { maxW: a.w - 32 }) + 16;
    phoneGrid(d, a, y, {
      n: 9,
    });
    s.note(
      'The hero is a shorter card without the description, so the first posters show without scrolling (HOME-1).'
    );
    s.note(
      'The chips wrap to a second line; they never scroll sideways. Every heart shows, since there is no hover on a phone (HOME-4).'
    );
  });
  B.frame('Home · genre picked · M · HOME-3', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    let y =
      a.y +
      ui.phoneHeader(d, a.x, a.y, a.w, {
        title: 'Home',
        large: true,
        right: ['bell'],
      });
    hero(d, a.x + 16, y, a.w - 32, 190);
    y += 206;
    y += ui.chips(d, a.x + 16, y, CHIPS, { maxW: a.w - 32, on: 3 }) + 16;
    phoneGrid(d, a, y, {
      n: 9,
      offset: 6,
      liked: [2],
    });
    s.note(
      'Comedy fills the grid with popular comedies, movies and TV mixed (HOME-3). The hero stays the same.'
    );
    s.note('Changing the genres in Settings changes these chips next time.');
  });
  B.frame('Home · next-step card · D W · HOME-5', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Home');
    y += nextCard(d, x, y, w, 'invite') + 20;
    hero(d, x, y, w, 250);
    y += 270;
    y += ui.chips(d, x, y, CHIPS, { maxW: w }) + 20;
    ui.grid(d, x, y, w, { n: 12, maxY: a.bottom - 8, hover: -1 });
    s.note(
      'At most one card, above the hero: the first that applies, in this order (HOME-5).'
    );
    const at = s.noteSpace(2 * 150 + 12);
    const h1 = nextCard(d, at.x, at.y, s.noteW, 'likes');
    nextCard(d, at.x, at.y + h1 + 12, s.noteW, 'matches');
    s.note(
      '1. Like your first titles: no movie or no TV show in your Likes. Pick titles opens the grid from onboarding step 3.'
    );
    s.note(
      '2. Invite your person: no connections and no pending invites. ✕ dismisses 1 and 2 for good; inviting stays on Connections.'
    );
    s.note(
      "3. New matches: goes away once they are seen, with no ✕. It counts matches only, never the other person's Likes (privacy)."
    );
  });
  B.frame('Home · matches card · M · HOME-5', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    let y =
      a.y +
      ui.phoneHeader(d, a.x, a.y, a.w, {
        title: 'Home',
        large: true,
        right: ['bell'],
      });
    y += nextCard(d, a.x + 16, y, a.w - 32, 'matches') + 16;
    hero(d, a.x + 16, y, a.w - 32, 190);
    y += 206;
    y += ui.chips(d, a.x + 16, y, CHIPS, { maxW: a.w - 32 }) + 16;
    phoneGrid(d, a, y, {
      n: 9,
    });
    s.note(
      'On the phone the button goes under the text. See matches opens the shared list with Sam (MATCH).'
    );
  });

  // Search ---------------------------------------------------------------------------------------------
  B.heading(
    'Search',
    'One field for titles, people and studios. Results come as you type, after 2 letters and a pause.'
  );
  B.frame('Search · empty · D W · SEARCH-1', 'desktop', (s) => {
    const a = desktopApp(s, {
      active: 'Search',
      search: { placeholder: 'Titles, people, studios' },
    });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Search', {
      sub: 'Search for titles, people, or a studio like Marvel.',
    });
    d.text(x, y, 'Trending now', { size: 18 });
    y += 36;
    ui.grid(d, x, y, w, { n: 12, maxY: a.bottom - 8, hover: -1 });
    s.note(
      'On desktop and web the field at the top of the sidebar is the search box. ⌘K, Ctrl+K or / puts the focus there from any screen, and this screen opens (SEARCH-1).'
    );
    s.note(
      'Before anything is typed: a short hint and the trending grid, so the screen is never empty. Recent searches come later (SEARCH-4).'
    );
    s.note(
      'In a narrow window the sidebar shows only icons: the search icon opens this screen with its own field at the top.'
    );
  });
  B.frame('Search · empty · M · SEARCH-1', 'phone', (s) => {
    const c = phoneSearch(s);
    const kb = s.bottom - ui.KEYBOARD_H;
    d.text(c.x, c.y + 4, 'Trending now', { size: 17 });
    ui.grid(d, c.x, c.y + 36, c.w, {
      cols: 3,
      gap: 12,
      n: 3,
      maxY: kb - 8,
    });
    ui.keyboard(s, { kind: 'search' });
    s.note(
      'The Search tab focuses the field and opens the keyboard (SEARCH-1). The trending grid is under it; scrolling closes the keyboard.'
    );
  });
  B.frame('Search · results · D W · SEARCH-2', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Search', search: { value: 'emma' } });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Search');
    y += ui.chips(d, x, y, FILTERS, { maxW: w, on: 0 }) + 24;
    d.text(x, y, 'People', { size: 18 });
    const more = 'See all 12 people';
    ui.button(d, x + w - measure(more, 14).w - 32, y - 6, more, {
      variant: 'ghost',
    });
    y += 36;
    const pw = (w - 32) / 3;
    PEOPLE.slice(0, 3).forEach((p, i) =>
      personRow(d, x + i * (pw + 16), y, pw, p)
    );
    y += 96;
    d.text(x, y, 'Titles', { size: 18 });
    y += 36;
    posterGrid(d, x, y, w, {
      items: EMMA,
      cols: 6,
      hover: -1,
      focus: 0,
      maxY: a.bottom,
    });
    s.note(
      'Titles, people and studios in one search, with chips to narrow it. People here are actors and crew from TMDB, never other Movie Mates users (decision 4).'
    );
    s.note(
      "Under All, up to 3 people come first when any match, then the titles in TMDB's order: 20, then Show more adds 30. See all switches to People."
    );
    s.note(
      'Keyboard: ↓ and ↑ move through the results (the ring is on Emma.), Enter opens, Esc clears the field. Back from a result returns here (SEARCH-2).'
    );
    s.note(
      'Only the latest search shows, even if an earlier request answers last. While it waits, the results are skeletons (states.excalidraw).'
    );
  });
  B.frame('Search · results · M · SEARCH-2', 'phone', (s) => {
    const c = phoneSearch(s, { value: 'dune', chip: 0 });
    posterGrid(d, c.x, c.y, c.w, {
      items: DUNE,
      cols: 3,
      gap: 12,
      liked: [0],
      maxY: c.bottom - 8,
      textSize: 12,
    });
    s.note(
      'Scrolling the results closes the keyboard. Each title shows its type and year, and the heart (SEARCH-2).'
    );
  });
  B.frame('Search · people · M · SEARCH-2', 'phone', (s) => {
    const c = phoneSearch(s, { value: 'emma', chip: 3 });
    PEOPLE.forEach((p, i) => personRow(d, c.x, c.y + i * 84, c.w, p));
    s.note(
      'People: the photo, the name and what they are known for. Each opens the person page (PERSON-1). Initials when there is no photo.'
    );
  });
  B.frame('Search · studio · D W · SEARCH-5', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Search', search: { value: 'marvel' } });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Search');
    y += ui.chips(d, x, y, FILTERS, { maxW: w, on: 0 }) + 24;
    d.rect(x, y, 48, 48, { r: 8, fill: C.fill, stroke: C.line });
    d.text(x + 24, y + 16, 'logo', {
      size: 11,
      color: C.muted,
      align: 'center',
    });
    d.text(x + 64, y + 2, 'From Marvel Studios', { size: 18 });
    d.text(x + 64, y + 28, '42 movies and TV shows', {
      size: 13,
      color: C.muted,
    });
    y += 68;
    y +=
      posterGrid(d, x, y, w, {
        items: MARVEL,
        cols: 6,
        hover: 1,
      }) + 20;
    ui.button(d, x + w / 2, y, 'Show more', { center: true });
    y += 64;
    d.text(x, y, 'Other results', { size: 18 });
    cutRow(d, x, y + 36, w, 6, a.bottom);
    s.note(
      'Typing "Marvel" finds the studio, so Wolverine shows up although the word isn\'t in its title (SEARCH-5). Collections ("X-Men Collection") and keywords work the same way.'
    );
    s.note(
      'Only when the name starts with what was typed, so "dune" never puts a company above the film. The other results follow under the group.'
    );
    s.note('The chips still narrow the group: Movies, TV shows.');
  });
  B.frame('Search · no results · D W · SEARCH-3', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Search', search: { value: 'dnue' } });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = pageTitle(d, x, a.y + 24, 'Search');
    y += ui.chips(d, x, y, FILTERS, { maxW: w, on: 0 }) + 80;
    const cx = x + w / 2;
    ui.icon(d, 'search', cx, y + 20, 40, { color: C.dim });
    d.text(cx, y + 64, 'No results for "dnue".', {
      size: 20,
      align: 'center',
    });
    d.text(cx, y + 100, 'Check the spelling, or try the original title.', {
      size: 14,
      color: C.text,
      align: 'center',
    });
    s.note(
      'It says the search worked and what to try (SEARCH-3). TMDB forgives some typos, not all; "Did you mean Dune?" is SEARCH-6, later.'
    );
  });
  B.frame('Search · no results, filtered · M · SEARCH-3', 'phone', (s) => {
    const c = phoneSearch(s, { value: 'arrival', chip: 2 });
    const cx = c.x + c.w / 2;
    let y = c.y + 60;
    ui.icon(d, 'search', cx, y + 20, 40, { color: C.dim });
    y += 64;
    d.text(cx, y, 'No TV shows for "arrival".', { size: 18, align: 'center' });
    y += 40;
    ui.button(d, cx, y, 'Search All', { center: true });
    s.note(
      'With a filter on, it offers to search All instead, where the movie is (SEARCH-3).'
    );
  });

  // Checks ---------------------------------------------------------------------------------------------
  B.heading('Checks', 'Home against the non-functional requirements.');
  B.frame('Home · text 200% · D W · A11Y-6', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home', collapsed: true });
    const x = a.x + 32;
    const w = a.w - 64;
    let y = a.y + 20;
    d.text(x, y, 'Home', { size: 56 });
    y += 90;
    const hh = 250;
    d.rect(x, y, w, hh, { r: 12, rough: 1, fill: C.fill, stroke: C.line });
    d.text(x + 32, y + 24, 'Dune: Part Two', { size: 56 });
    d.text(x + 32, y + 100, 'Movie · 2024', { size: 28, color: C.text });
    let bx = x + 32;
    ['Like', 'Trailer', 'More info'].forEach((label, i) => {
      bx += bigButton(d, bx, y + hh - 92, label, { primary: i === 0 }) + 16;
    });
    y += hh + 28;
    let cx = x;
    CHIPS.forEach((label, i) => {
      const cw = measure(label, 28).w + 56 + (i === 0 ? 36 : 0);
      if (cx + cw > x + w) {
        cx = x;
        y += 68;
      }
      cx += ui.chip(d, cx, y, label, { on: i === 0, size: 28, h: 56 }).w + 12;
    });
    // the first row of the grid, 3 large posters cut off by the window's edge
    cutRow(d, x, y + 88, w, 3, s.bottom, { hearts: true, size: 48 });
    s.note(
      'Text at 200% (A11Y-6), on the desktop app and the web alike. Layouts switch by text size: the breakpoints count in text units, so 200% on a 1280 px window gets the narrow layout.'
    );
    s.note(
      'That means the sidebar shows icons only, the hero drops its description, the chips wrap, and the grid below has 3 columns with titles on two lines, as in the phone frame in shell.excalidraw.'
    );
    s.note(
      'Nothing is cut off and nothing scrolls sideways. Icons keep their size; only text grows.'
    );
  });

  return d;
}
