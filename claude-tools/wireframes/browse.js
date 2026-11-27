// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// browse.excalidraw (#157): Home, Search, the title page, the trailer and the person page. Loading, TMDB
// down and offline are drawn once for every screen in states.excalidraw, so these frames show only what is
// particular to these screens.
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

// --- The title page and the person page ---------------------------------------------------------------

/** The movie the desktop title page shows. */
const MOVIE = {
  name: 'Dune: Part Two',
  meta: 'Movie · 2024 · 2 h 46 min · PG-13',
  rating: '8.2',
  votes: '5,400 votes · Sci-Fi, Adventure',
  tagline: 'Long live the fighters.',
  overview:
    'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
  facts: [
    ['Release date', 'March 1, 2024 (United States)'],
    ['Director', 'Denis Villeneuve'],
    ['Original language', 'English'],
    ['Budget', '$190,000,000'],
    ['Revenue', '$714,444,358'],
  ],
  watch: [
    ['Stream', ['Max']],
    ['Rent', ['Apple TV', 'Prime Video']],
    ['Buy', ['Apple TV', 'Google Play']],
  ],
};

/** The TV show the phone title page shows. */
const SHOW = {
  name: 'Severance',
  meta: 'TV show · 2022– · 2 seasons · TV-MA',
  rating: '8.4',
  votes: '2,900 votes · Drama, Mystery, Sci-Fi',
  tagline: 'Love your work.',
  overview:
    'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.',
  facts: [
    ['Created by', 'Dan Erickson'],
    ['Network', 'Apple TV+'],
    ['Status', 'Returning'],
  ],
  watch: [['Stream', ['Apple TV+']]],
};

/** The cast of the movie, with one person who has no photo (initials instead). */
const CAST = [
  ['Timothée Chalamet', 'Paul Atreides'],
  ['Zendaya', 'Chani'],
  ['Rebecca Ferguson', 'Lady Jessica'],
  ['Javier Bardem', 'Stilgar'],
  ['Josh Brolin', 'Gurney Halleck'],
  ['Austin Butler', 'Feyd-Rautha'],
  ['Florence Pugh', 'Princess Irulan'],
  ['Dave Bautista', 'Rabban'],
  ['Christopher Walken', 'Emperor Shaddam IV'],
  ['Léa Seydoux', 'Lady Margot Fenring'],
  ['Souheila Yacoub', 'Shishakli', 'SY'],
  ['Stellan Skarsgård', 'Baron Harkonnen'],
];

/** The cast of the TV show. */
const SHOW_CAST = [
  ['Adam Scott', 'Mark Scout'],
  ['Britt Lower', 'Helly R.'],
  ['Zach Cherry', 'Dylan G.'],
  ['John Turturro', 'Irving B.'],
  ['Patricia Arquette', 'Harmony Cobel'],
  ['Tramell Tillman', 'Seth Milchick'],
  ['Dichen Lachman', 'Gemma'],
  ['Jen Tullock', 'Devon'],
  ['Christopher Walken', 'Burt G.'],
];

/** Related titles under the movie. */
const RELATED = [
  ['Dune', 'Movie · 2021'],
  ['Arrival', 'Movie · 2016'],
  ['Blade Runner 2049', 'Movie · 2017'],
  ['Interstellar', 'Movie · 2014'],
  ['Foundation', 'TV show · 2021'],
  ['Sicario', 'Movie · 2015'],
  ['Prisoners', 'Movie · 2013'],
  ['The Martian', 'Movie · 2015'],
  ['Mad Max: Fury Road', 'Movie · 2015'],
  ['Silo', 'TV show · 2023'],
];

/** Related titles under the TV show. */
const SHOW_RELATED = [
  ['Silo', 'TV show · 2023'],
  ['Black Mirror', 'TV show · 2011'],
  ['Mr. Robot', 'TV show · 2015'],
  ['The Leftovers', 'TV show · 2014'],
  ['Dark', 'TV show · 2017'],
  ['Fallout', 'TV show · 2024'],
];

/** What the person page lists under Known for. */
const KNOWN_FOR = [
  ['Dune: Part Two', '2024 · Chani'],
  ['Challengers', '2024 · Tashi'],
  ['Euphoria', 'TV · 2019 · Rue'],
  ['Spider-Man: No Way Home', '2021 · MJ'],
  ['The Greatest Showman', '2017 · Anne'],
  ['Malcolm & Marie', '2021 · Marie'],
];

/**
 * Draws a section's heading, as the title page and the person page use it.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string} text - The heading.
 * @param {string} [sub] - A gray note after it, such as "19 episodes".
 * @returns {number} The height it takes, 40.
 * @example
 * sectionTitle(d, 272, 900, 'Cast');
 * // → 40
 */
function sectionTitle(d, x, y, text, sub) {
  const t = d.text(x, y, text, { size: 20 });
  if (sub) {
    d.text(t.x + t.width + 10, y + 5, sub, { size: 14, color: C.muted });
  }
  return 40;
}

/**
 * Draws the TMDB rating as a ring with the score inside.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} cx - The center, across.
 * @param {number} cy - The center, down.
 * @param {string} value - The score, such as '8.2'.
 * @returns {void}
 * @example
 * ratingRing(d, 500, 600, '8.2');
 */
function ratingRing(d, cx, cy, value) {
  d.circle(cx, cy, 38, { fill: C.white, stroke: C.ink, sw: 3 });
  d.textMid(cx, cy, value, { size: 13, align: 'center' });
}

/**
 * Draws the "Match with Sam" chip that sits under the heart when the title is on a shared list (TITLE-7).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @returns {number} Its width.
 * @example
 * matchChip(d, 470, 640);
 * // → 182
 */
function matchChip(d, x, y) {
  const label = 'Match with Sam';
  const w = measure(label, 14).w + 92;
  d.rect(x, y, w, 36, { r: 18, fill: C.fill, stroke: C.ink });
  ui.avatar(d, x + 20, y + 18, 24, 'S');
  d.textMid(x + 40, y + 18, label, { size: 14 });
  d.textMid(x + w - 36, y + 18, '+1', { size: 13, color: C.muted });
  ui.icon(d, 'forward', x + w - 14, y + 18, 12);
  return w;
}

/**
 * Draws the title page's header: the backdrop, the poster over its edge, the title, the facts line, the
 * rating, the tagline and the buttons, with the heart first (TITLE-1).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; under 600 px it's the one-column version, edge to edge.
 * @param {object} [o] - `t` (MOVIE or SHOW), `match` (the chip from TITLE-7), `backdrop: false` (the
 *   poster's colors instead), `poster: false` (a plain tile), `loading` (only what the grid already knew),
 *   `liked`, `trailer: false` (no trailer, so no button).
 * @returns {number} The height it takes.
 * @example
 * titleHeader(d, 272, 112, 976, { match: true });
 * // → 562
 */
function titleHeader(d, x, y, w, o = {}) {
  const t = o.t ?? MOVIE;
  const narrow = w < 600;
  const bh = narrow ? 200 : 300;
  if (o.loading) {
    d.rect(x, y, w, bh, { r: narrow ? 0 : 12, fill: C.faint, stroke: C.faint });
  } else if (o.backdrop === false) {
    d.rect(x, y, w, bh, { r: narrow ? 0 : 12, fill: C.mid, stroke: C.mid });
  } else {
    d.rect(x, y, w, bh, {
      r: narrow ? 0 : 12,
      rough: 1,
      fill: C.fill,
      stroke: C.line,
    });
    d.line(
      [
        [x + 12, y + 12],
        [x + w - 12, y + bh - 12],
      ],
      { stroke: C.faint }
    );
    d.line(
      [
        [x + w - 12, y + 12],
        [x + 12, y + bh - 12],
      ],
      { stroke: C.faint }
    );
  }
  const pw = narrow ? 110 : 170;
  const ph = Math.round(pw * 1.5);
  const px = x + (narrow ? 16 : 32);
  const py = y + bh - (narrow ? 80 : 120);
  if (o.poster === false) {
    d.rect(px, py, pw, ph, { r: 6, fill: C.fill, stroke: C.line });
    d.text(px + pw / 2, py + ph / 2 - 20, t.name, {
      size: 13,
      color: C.muted,
      align: 'center',
      wrap: pw - 16,
    });
  } else {
    ui.poster(d, px, py, pw, { title: false, heart: false });
  }
  const tx = narrow ? x + 16 : px + pw + 28;
  const tw = narrow ? w - 32 : x + w - tx;
  let ty = narrow ? py + ph + 16 : y + bh + 18;
  ty += d.text(tx, ty, t.name, { size: narrow ? 26 : 32, wrap: tw }).height + 6;
  if (o.loading) {
    d.text(tx, ty, 'Movie · 2024', { size: 14, color: C.text });
    ty += 30;
    ty += ui.skeletonLines(d, tx, ty, [tw * 0.5, tw * 0.3], { h: 12 }) + 20;
  } else {
    ty +=
      d.text(tx, ty, t.meta, { size: 14, color: C.text, wrap: tw }).height + 12;
    if (t.rating) {
      ratingRing(d, tx + 19, ty + 19, t.rating);
      d.textMid(tx + 50, ty + 19, t.votes, {
        size: 13,
        color: C.muted,
        wrap: tw - 50,
      });
      ty += 50;
    }
    if (t.tagline) {
      d.text(tx, ty, `"${t.tagline}"`, { size: 14, color: C.muted });
      ty += 30;
    }
  }
  const heart = o.liked ? 'heart-filled' : 'heart';
  if (narrow) {
    ui.button(d, tx, ty, o.liked ? 'Liked' : 'Like', {
      variant: 'primary',
      icon: heart,
      w: tw,
      size: 'lg',
    });
    ty += 56;
    const noTrailer = o.trailer === false;
    const bw = noTrailer ? tw : (tw - 12) / 2;
    ui.button(d, tx, ty, 'Add to list', {
      menu: true,
      w: bw,
      disabled: o.loading,
    });
    if (!noTrailer) {
      ui.button(d, tx + bw + 12, ty, 'Trailer', {
        icon: 'play',
        w: bw,
        disabled: o.loading,
      });
    }
    ty += 48;
  } else {
    let bx = tx;
    bx +=
      ui.button(d, bx, ty, o.liked ? 'Liked' : 'Like', {
        variant: 'primary',
        icon: heart,
        size: 'lg',
      }).w + 12;
    bx +=
      ui.button(d, bx, ty + 6, 'Add to Watch later', {
        menu: true,
        disabled: o.loading,
      }).w + 12;
    ui.button(d, bx, ty + 6, 'Trailer', { icon: 'play', disabled: o.loading });
    ty += 60;
  }
  if (o.match) {
    matchChip(d, tx, ty);
    ty += 48;
  }
  return Math.max(ty, py + ph) - y;
}

/**
 * Draws "Where to watch": the services for the region grouped as Stream, Rent and Buy, the region with
 * Change, and the JustWatch credit (TITLE-4).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; the services wrap inside it.
 * @param {object} [o] - `t` (MOVIE or SHOW), `none` (no service in the region has it).
 * @returns {number} The height it takes.
 * @example
 * whereToWatch(d, 948, 700, 300);
 * // → 302
 */
function whereToWatch(d, x, y, w, o = {}) {
  const t = o.t ?? MOVIE;
  let ny = y + sectionTitle(d, x, y, 'Where to watch');
  const where = d.text(x, ny - 6, 'In the United States ·', {
    size: 13,
    color: C.text,
  });
  const change = d.text(where.x + where.width + 6, ny - 6, 'Change', {
    size: 13,
  });
  d.line(
    [
      [change.x, ny + 9],
      [change.x + change.width, ny + 9],
    ],
    { stroke: C.ink }
  );
  ny += 24;
  if (o.none) {
    const n = d.text(
      x + 16,
      ny + 12,
      'Not available to stream or buy in the United States right now.',
      { size: 14, wrap: w - 32 }
    );
    const box = d.rect(x, ny, w, n.height + 24, {
      r: 8,
      fill: C.fill,
      stroke: C.dim,
    });
    // the box goes under the text
    d.elements.splice(d.elements.indexOf(box), 1);
    d.elements.splice(d.elements.indexOf(n), 0, box);
    ny += n.height + 24 + 12;
  } else {
    t.watch.forEach(([group, services]) => {
      d.text(x, ny, group, { size: 12, color: C.muted });
      ny += 20;
      let sx = x;
      services.forEach((name) => {
        const sw = measure(name, 14).w + 56;
        if (sx > x && sx + sw > x + w) {
          sx = x;
          ny += 44;
        }
        d.rect(sx, ny, sw, 36, { r: 8, fill: C.white, stroke: C.line });
        d.rect(sx + 8, ny + 8, 20, 20, { r: 4, fill: C.mid, stroke: C.mid });
        d.textMid(sx + 36, ny + 18, name, { size: 14 });
        sx += sw + 8;
      });
      ny += 50;
    });
  }
  d.text(x, ny, 'Data from JustWatch', { size: 11, color: C.muted });
  return ny + 20 - y;
}

/**
 * Draws a list of facts, each a gray label over its value (TITLE-2).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width; long values wrap.
 * @param {Array<[string, string]>} rows - [label, value] pairs.
 * @returns {number} The height it takes.
 * @example
 * facts(d, 948, 1100, 300, MOVIE.facts);
 * // → 250
 */
function facts(d, x, y, w, rows) {
  let ny = y;
  rows.forEach(([label, value]) => {
    d.text(x, ny, label, { size: 12, color: C.muted });
    ny += 18 + d.text(x, ny + 18, value, { size: 14, wrap: w }).height + 14;
  });
  return ny - y;
}

/**
 * Draws a link: underlined text.
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {string} text - The words.
 * @returns {void}
 * @example
 * link(d, 272, 880, 'More');
 */
function link(d, x, y, text) {
  const t = d.text(x, y, text, { size: 14 });
  d.line(
    [
      [t.x, y + 16],
      [t.x + t.width, y + 16],
    ],
    { stroke: C.ink }
  );
}

/**
 * Draws the overview cut to about 5 lines, with More (TITLE-2).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {string} [text] - The overview; none says "No description yet."
 * @returns {number} The height it takes.
 * @example
 * overview(d, 272, 760, 636, MOVIE.overview);
 * // → 120
 */
function overview(d, x, y, w, text) {
  if (!text) {
    d.text(x, y, 'No description yet.', { size: 15, color: C.muted });
    return 28;
  }
  const t = d.text(x, y, text, { size: 15, color: C.text, wrap: w });
  link(d, x, y + t.height + 8, 'More');
  return t.height + 34;
}

/**
 * Draws a grid of cast members: the photo (or initials), the name and the character (TITLE-3).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @param {number} cols - The columns.
 * @param {Array<string[]>} people - [name, character, initials when there's no photo].
 * @returns {number} The height it takes.
 * @example
 * castGrid(d, 272, 900, 636, 4, CAST);
 * // → 642
 */
function castGrid(d, x, y, w, cols, people) {
  const gap = 16;
  const cw = (w - gap * (cols - 1)) / cols;
  const photoH = Math.round(cw * 1.1);
  // room for a name on two lines
  const rowH = photoH + 70;
  people.forEach(([name, role, initials], i) => {
    const cx = x + (i % cols) * (cw + gap);
    const cy = y + Math.floor(i / cols) * (rowH + gap);
    if (initials) {
      d.rect(cx, cy, cw, photoH, { r: 8, fill: C.faint, stroke: C.line });
      ui.avatar(
        d,
        cx + cw / 2,
        cy + photoH / 2,
        Math.min(64, cw - 20),
        initials
      );
    } else {
      d.rect(cx, cy, cw, photoH, {
        r: 8,
        rough: 1,
        fill: C.fill,
        stroke: C.line,
      });
      ui.icon(d, 'person', cx + cw / 2, cy + photoH / 2, 32, { color: C.mid });
    }
    const n = d.text(cx, cy + photoH + 6, name, { size: 13, wrap: cw });
    d.text(cx, n.y + n.height + 2, role, {
      size: 12,
      color: C.muted,
      wrap: cw,
    });
  });
  const rows = Math.ceil(people.length / cols);
  return rows * rowH + (rows - 1) * gap;
}

/**
 * Draws the seasons of a TV show, newest last, specials at the end (TITLE-6).
 *
 * @param {import('./lib').Doc} d - The drawing.
 * @param {number} x - The left edge.
 * @param {number} y - The top edge.
 * @param {number} w - The width.
 * @returns {number} The height it takes.
 * @example
 * seasons(d, 16, 1400, 358);
 * // → 224
 */
function seasons(d, x, y, w) {
  let ny = y + sectionTitle(d, x, y, 'Seasons', '19 episodes');
  [
    ['Season 1', '2022 · 9 episodes'],
    ['Season 2', '2025 · 10 episodes'],
  ].forEach(([name, line]) => {
    d.rect(x, ny, 56, 84, { r: 4, rough: 1, fill: C.fill, stroke: C.line });
    d.text(x + 72, ny + 22, name, { size: 15 });
    d.text(x + 72, ny + 46, line, { size: 13, color: C.muted, wrap: w - 72 });
    ny += 96;
  });
  return ny - y;
}

/**
 * Draws browse.excalidraw: Home, Search, the title page, the trailer and the person page, on desktop
 * and web, and on the phone.
 *
 * @returns {import('./lib').Doc} The drawing.
 * @example
 * const d = buildBrowse();
 * d.elements.filter((e) => e.type === 'frame').length;
 * // → 24
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

  // Title page -----------------------------------------------------------------------------------------
  B.heading(
    'Title page',
    'One page for movies and TV shows. Drawn full length: two columns on a wide window, one on the phone.'
  );
  B.frame(
    'Title page · movie · D W · TITLE-1 TITLE-2 TITLE-3 TITLE-4 TITLE-5 TITLE-7',
    { w: 1280, h: 2500 },
    (s) => {
      const a = desktopApp(s, { active: 'Home' });
      const x = a.x + 32;
      const w = a.w - 64;
      ui.button(d, x, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
      let y = a.y + 64;
      y += titleHeader(d, x, y, w, { match: true, liked: true }) + 40;
      const sideW = 300;
      const mainW = w - sideW - 40;
      const sx = x + mainW + 40;
      let my = y + sectionTitle(d, x, y, 'About');
      my += overview(d, x, my, mainW, MOVIE.overview) + 40;
      my += sectionTitle(d, x, my, 'Cast');
      my += castGrid(d, x, my, mainW, 4, CAST) + 20;
      ui.button(d, x + mainW / 2, my, 'Show more', { center: true });
      my += 56;
      let sy = y + whereToWatch(d, sx, y, sideW) + 32;
      sy += sectionTitle(d, sx, sy, 'Details');
      sy += facts(d, sx, sy, sideW, MOVIE.facts);
      y = Math.max(my, sy) + 32;
      y += sectionTitle(d, x, y, 'More like this');
      y += posterGrid(d, x, y, w, { items: RELATED, cols: 5, hover: -1 }) + 20;
      ui.button(d, x + w / 2, y, 'Show more', { center: true });
      s.note(
        "Drawn full length, as if the window were tall; the sidebar stays put while the page scrolls. The poster's colors tint the page, as today (TITLE-1)."
      );
      s.note(
        'Header: the heart is the main button (Liked here). Add to list (LIST) and Trailer (TITLE-8) are secondary; Trailer is hidden when there is none.'
      );
      s.note(
        '"Match with Sam +1" appears only when the title is on a shared list, and opens it (TITLE-7). A title someone else likes but you don\'t shows nothing (privacy).'
      );
      s.note(
        'Two columns on a wide window: the reading on the left, the quick facts on the right, where to watch first so you know before you like it for tonight (TITLE-4).'
      );
      s.note(
        'Cast: 12, then Show more up to 30 (TITLE-3). Souheila Yacoub has no photo, so initials. Related titles span the width at the bottom: 10, then Show more (TITLE-5).'
      );
      s.note(
        'Sections TMDB has nothing for are hidden, and facts it lacks are left out, never "Unknown" or "0" (TITLE-2). A section that fails to load says so on its own (states.excalidraw).'
      );
      s.note(
        'A TV show on a wide window: Seasons go in the left column after About, and the facts become Created by, Network and Status.'
      );
    }
  );
  B.frame(
    'Title page · TV show · M · TITLE-1 TITLE-2 TITLE-3 TITLE-4 TITLE-5 TITLE-6',
    { w: 390, h: 2920 },
    (s) => {
      let { y } = s;
      y += ui.phoneHeader(d, s.x, y, s.w, { back: 'Home', right: ['more'] });
      y += titleHeader(d, s.x, y, s.w, { t: SHOW }) + 32;
      const x = s.x + 16;
      const w = s.w - 32;
      y += whereToWatch(d, x, y, w, { t: SHOW }) + 32;
      y += sectionTitle(d, x, y, 'About');
      y += overview(d, x, y, w, SHOW.overview) + 20;
      y += facts(d, x, y, w, SHOW.facts) + 20;
      y += seasons(d, x, y, w) + 20;
      y += sectionTitle(d, x, y, 'Cast');
      y += castGrid(d, x, y, w, 3, SHOW_CAST) + 20;
      ui.button(d, x + w / 2, y, 'Show more', { center: true });
      y += 64;
      y += sectionTitle(d, x, y, 'More like this');
      y +=
        posterGrid(d, x, y, w, {
          items: SHOW_RELATED,
          cols: 3,
          gap: 12,
          textSize: 12,
        }) + 20;
      ui.button(d, x + w / 2, y, 'Show more', { center: true });
      ui.tabBar(d, s.x, s.bottom - 83, s.w, { active: 'Home', phone: true });
      s.note(
        "Drawn full length. On the phone it is one column in the story's order: header, where to watch, about and the facts, seasons, cast, related. The header and the tab bar stay put."
      );
      s.note(
        'A TV show: years running ("2022–" while it runs) and the number of seasons in the header (TITLE-1); Created by, Network and Status in the facts, and the next episode\'s date when one is announced (TITLE-2).'
      );
      s.note(
        'Seasons list the poster, name, year and episodes, with the total in the heading. The heart is for the whole show; seasons are not liked on their own (TITLE-6).'
      );
      s.note(
        'Like is full width under the title, within thumb reach. ⋯ in the header opens Share (later, TITLE-9).'
      );
    }
  );
  B.frame('Title page · loading · D W · TITLE-1', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    const w = a.w - 64;
    ui.button(d, x, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    let y = a.y + 64;
    y += titleHeader(d, x, y, w, { loading: true }) + 40;
    const mainW = w - 340;
    ui.skeletonLines(d, x, y, [mainW, mainW * 0.95, mainW * 0.9, mainW * 0.6]);
    ui.skeletonLines(d, x + mainW + 40, y, [300, 220, 260, 180]);
    s.note(
      'Opened from a grid, the page already knows the poster, title, type and year, so they show at once, with the heart working. The rest are skeletons (TITLE-1).'
    );
    s.note(
      'Add to list and Trailer wait until the title has loaded. Sections fill in as they arrive; the page is usable before all of them have.'
    );
  });
  B.frame('Title page · not on any service · M · TITLE-4', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    let { y } = a;
    y += ui.phoneHeader(d, a.x, y, a.w, { back: 'Home', right: ['more'] });
    y +=
      titleHeader(d, a.x, y, a.w, {
        t: {
          ...MOVIE,
          name: 'Perfect Days',
          meta: 'Movie · 2023 · 2 h 4 min',
          rating: '7.8',
          votes: '1,100 votes · Drama',
          tagline: '',
        },
      }) + 24;
    whereToWatch(d, a.x + 16, y, a.w - 32, { none: true });
    s.note(
      'No service in your region has it: said clearly, near the top, so you know before you like it for tonight (TITLE-4).'
    );
    s.note(
      'Change opens the region setting. The region never hides a title; it only changes this section.'
    );
  });
  B.frame('Title page · little data · M · TITLE-1 TITLE-2', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    let { y } = a;
    y += ui.phoneHeader(d, a.x, y, a.w, { back: 'Search', right: ['more'] });
    const t = {
      name: 'Night Shift',
      meta: 'Movie · 1998',
      watch: [],
    };
    y +=
      titleHeader(d, a.x, y, a.w, {
        t,
        backdrop: false,
        poster: false,
        trailer: false,
      }) + 24;
    const x = a.x + 16;
    const w = a.w - 32;
    y += sectionTitle(d, x, y, 'About');
    y += overview(d, x, y, w) + 20;
    facts(d, x, y, w, [['Original language', 'Spanish']]);
    s.note(
      'A title TMDB knows little about: no backdrop, so the header takes a color from the theme; no poster, so a plain tile with the title (States table).'
    );
    s.note(
      'No rating, runtime, tagline or trailer, so those are left out. "No description yet." in muted text. Cast, seasons and related are hidden when empty; where to watch still says it isn\'t available.'
    );
  });

  // Trailer --------------------------------------------------------------------------------------------
  B.heading(
    'Trailer',
    "TMDB's official YouTube trailer: in a dialog on desktop and web, in YouTube on the phone."
  );
  B.frame('Trailer · D W · TITLE-8', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    const w = a.w - 64;
    ui.button(d, x, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    titleHeader(d, x, a.y + 64, w, { liked: true });
    s.flush();
    ui.scrim(d, s.x, s.top, s.w, s.bottom - s.top);
    const vw = 880;
    const vh = Math.round((vw * 9) / 16);
    const dx = s.x + (s.w - vw) / 2;
    const dy = s.top + 40;
    const box = ui.dialog(d, dx, dy, vw, vh + 72, {
      title: 'Dune: Part Two · Official Trailer',
    });
    d.rect(dx, box.body - 8, vw, vh, { fill: C.ink, stroke: C.ink });
    d.circle(dx + vw / 2, box.body - 8 + vh / 2, 72, {
      fill: C.white,
      stroke: C.white,
    });
    ui.icon(d, 'play', dx + vw / 2 + 4, box.body - 8 + vh / 2, 28);
    s.note(
      "A dialog over the page with YouTube's privacy-enhanced player (youtube-nocookie.com). Esc, ✕ or a click outside closes it and stops the video; focus goes back to Trailer (TITLE-8)."
    );
    s.note(
      "The official trailer in your language, then in English, then any YouTube trailer. None: the Trailer button isn't shown, here or on the Home hero."
    );
    s.note(
      'Offline: the button stays, and pressing it says "You\'re offline".'
    );
  });
  B.frame('Trailer · M · TITLE-8', 'phone', (s) => {
    const { top } = s;
    d.rect(s.x, top, s.w, 52, { fill: C.fill, stroke: C.line });
    d.textMid(s.x + 16, top + 26, 'Done', { size: 16 });
    d.textMid(s.x + s.w / 2, top + 26, 'youtube.com', {
      size: 14,
      color: C.text,
      align: 'center',
    });
    const vh = Math.round((s.w * 9) / 16);
    d.rect(s.x, top + 52, s.w, vh, { fill: C.ink, stroke: C.ink });
    d.circle(s.x + s.w / 2, top + 52 + vh / 2, 56, {
      fill: C.white,
      stroke: C.white,
    });
    ui.icon(d, 'play', s.x + s.w / 2 + 3, top + 52 + vh / 2, 22);
    ui.skeletonLines(d, s.x + 16, top + 52 + vh + 20, [300, 220, 260], {
      h: 12,
    });
    ui.homeIndicator(d, s.x, s.bottom, s.w);
    s.note(
      "The YouTube app opens when it is installed. Otherwise an in-app browser (drawn here, lo-fi: it is the system's), and Done returns to the title page (TITLE-8)."
    );
  });

  // Person page ----------------------------------------------------------------------------------------
  B.heading(
    'Person page',
    'An actor, director or writer from TMDB, and what they are known for.'
  );
  B.frame('Person page · D W · PERSON-1', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home' });
    const x = a.x + 32;
    const w = a.w - 64;
    ui.button(d, x, a.y + 16, 'Back', { variant: 'ghost', icon: 'back' });
    let y = a.y + 64;
    d.rect(x, y, 160, 240, { r: 8, rough: 1, fill: C.fill, stroke: C.line });
    ui.icon(d, 'person', x + 80, y + 120, 48, { color: C.mid });
    const tx = x + 192;
    const tw = w - 192;
    d.text(tx, y, 'Zendaya', { size: 32 });
    d.text(tx, y + 48, 'Acting', { size: 15, color: C.text });
    d.text(tx, y + 74, 'Born September 1, 1996, in Oakland, California', {
      size: 14,
      color: C.muted,
    });
    overview(
      d,
      tx,
      y + 108,
      tw,
      'Zendaya is an American actress and singer. She began her career as a child model and backup dancer before gaining prominence for her role as Rocky Blue on the Disney Channel sitcom Shake It Up, and went on to star in films and series across many genres.'
    );
    y += 272;
    y += sectionTitle(d, x, y, 'Known for');
    y += ui.chips(d, x, y, ['All', 'Movies', 'TV shows'], { maxW: w }) + 20;
    posterGrid(d, x, y, w, {
      items: KNOWN_FOR,
      cols: 6,
      hover: -1,
      liked: [0],
      maxY: a.bottom,
    });
    s.note(
      'Photo, name, what they are known for, birth date and place, and the death date when there is one (PERSON-1).'
    );
    s.note(
      'The biography is cut to about 5 lines with More. With none in your language: the English one, or nothing.'
    );
    s.note(
      'Known for: most popular first, with the heart, filtered by Movies and TV shows: 20, then Show more adds 30. The character, or for crew the job (Director, Writer), goes under the year.'
    );
  });
  B.frame('Person page · M · PERSON-1', 'phone', (s) => {
    const a = phoneApp(s, { active: 'Home' });
    let { y } = a;
    y += ui.phoneHeader(d, a.x, y, a.w, {
      back: 'Dune: Part Two',
      right: ['more'],
    });
    const x = a.x + 16;
    const w = a.w - 32;
    y += 8;
    d.rect(x, y, 100, 150, { r: 8, rough: 1, fill: C.fill, stroke: C.line });
    ui.icon(d, 'person', x + 50, y + 75, 36, { color: C.mid });
    d.text(x + 116, y + 20, 'Zendaya', { size: 26 });
    d.text(x + 116, y + 60, 'Acting', { size: 14, color: C.text });
    d.text(x + 116, y + 84, 'Born September 1, 1996,\nin Oakland, California', {
      size: 13,
      color: C.muted,
    });
    y += 166;
    y +=
      overview(
        d,
        x,
        y,
        w,
        'Zendaya is an American actress and singer. She began her career as a child model and backup dancer before gaining prominence on the Disney Channel.'
      ) + 20;
    y += sectionTitle(d, x, y, 'Known for');
    y += ui.chips(d, x, y, ['All', 'Movies', 'TV shows'], { maxW: w }) + 16;
    const h = posterGrid(d, x, y, w, {
      items: KNOWN_FOR,
      cols: 3,
      gap: 12,
      liked: [0],
      maxY: a.bottom - 8,
      textSize: 12,
    });
    cutRow(d, x, y + (h ? h + 12 : 0), w, 3, a.bottom + 12, {
      hearts: true,
      gap: 12,
    });
    s.note(
      'Back is named after the title the person was opened from. The grid continues under the tab bar.'
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

  B.frame('Title page · text 200% · D W · A11Y-6', 'desktop', (s) => {
    const a = desktopApp(s, { active: 'Home', collapsed: true });
    const x = a.x + 32;
    const w = a.w - 64;
    d.text(x, a.y + 12, '‹ Back', { size: 28 });
    let y = a.y + 64;
    d.rect(x, y, w, 200, { r: 12, rough: 1, fill: C.fill, stroke: C.line });
    ui.poster(d, x + 24, y + 120, 110, { title: false, heart: false });
    y += 310;
    d.text(x, y, 'Dune: Part Two', { size: 60 });
    y += 84;
    d.text(x, y, 'Movie · 2024 · 2 h 46 min · PG-13', {
      size: 28,
      color: C.text,
    });
    y += 56;
    let bx = x;
    ['Like', 'Add to list ▾', 'Trailer'].forEach((label, i) => {
      bx += bigButton(d, bx, y, label, { primary: i === 0 }) + 16;
    });
    y += 96;
    d.text(x, y, 'Where to watch', { size: 40 });
    s.note(
      "Text at 200% (A11Y-6): the narrow layout, so one column in the story's order, as on the phone. The facts and where to watch move from the side column into the flow."
    );
    s.note(
      "The buttons wrap onto a second line when they don't fit; nothing is cut off and nothing scrolls sideways."
    );
  });

  return d;
}
