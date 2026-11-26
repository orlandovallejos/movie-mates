// Claude tool: Claude runs and changes this file; people don't edit it by hand. See claude-tools/README.md.
//
// kit.excalidrawlib: the pieces the wireframes are made of, to drag in from Excalidraw's library panel.
import { C, Doc } from './lib';
import * as ui from './ui';
import { hero } from './frames';

/** Every icon `ui.icon` draws; each also becomes a kit piece. */
const ICONS = [
  'pointer',
  'heart',
  'heart-filled',
  'search',
  'home',
  'list',
  'matches',
  'people',
  'person',
  'bell',
  'gear',
  'lock',
  'back',
  'forward',
  'down',
  'close',
  'plus',
  'more',
  'check',
  'play',
  'offline',
  'alert',
  'trash',
  'sort',
  'refresh',
];

/**
 * Builds the kit library: every piece drawn here, then the pieces from "Basic UX/wireframing
 * elements" as they are.
 *
 * @param {object[]} thirdParty - The items already in kit.excalidrawlib that came from "Basic UX/wireframing
 *   elements" (toggles, checkboxes, radio buttons), copied unchanged.
 * @returns {{ type: 'excalidrawlib', version: 2, source: string, libraryItems: object[] }} The library file.
 * @example
 * const kit = buildKit([]);
 * kit.libraryItems.length;
 * // → 79 (85 with the six third-party pieces)
 * kit.libraryItems[0].name;
 * // → 'Poster · heart always shown (phone, touch)'
 */
export default function buildKit(thirdParty) {
  const d = new Doc('kit');
  const items = [];
  /**
   * Adds one kit piece: what draw adds to the drawing, outside any frame.
   *
   * @param {string} name - The name shown in Excalidraw's library panel.
   * @param {() => void} draw - Draws the piece at the top left.
   * @returns {void}
   * @example
   * item('Chip', () => ui.chip(d, 0, 0, 'Movies'));
   * items.at(-1).name;
   * // → 'Chip'
   */
  const item = (name, draw) => {
    const start = d.elements.length;
    draw();
    const elements = d.elements
      .slice(start)
      .map((e) => ({ ...e, frameId: null }));
    items.push({
      id: `kit-${items.length + 1}`,
      status: 'published',
      created: 1,
      name,
      elements,
    });
  };

  item('Poster · heart always shown (phone, touch)', () =>
    ui.poster(d, 0, 0, 140, { title: 'Title', year: '2024', heart: 'empty' })
  );
  item('Poster · liked', () =>
    ui.poster(d, 0, 0, 140, { title: 'Title', year: '2024', heart: 'filled' })
  );
  item('Poster · desktop and web, resting (no empty heart)', () =>
    ui.poster(d, 0, 0, 140, {
      title: 'Title',
      year: '2024',
      heart: 'empty',
      hoverable: true,
    })
  );
  item('Poster · desktop and web, hover', () =>
    ui.poster(d, 0, 0, 140, {
      title: 'Title',
      year: '2024',
      heart: 'empty',
      hoverable: true,
      hovered: true,
    })
  );
  item('Poster · heart disabled (offline)', () =>
    ui.poster(d, 0, 0, 140, { title: 'Title', year: '2024', heart: 'disabled' })
  );
  item('Poster · with menu button', () =>
    ui.poster(d, 0, 0, 140, {
      title: 'Title',
      year: '2024',
      heart: 'empty',
      menu: true,
    })
  );
  item('Poster · match badge', () =>
    ui.poster(d, 0, 0, 140, {
      title: 'Title',
      year: '2024',
      heart: 'filled',
      badgeAvatar: 'S',
    })
  );
  item('Poster · no image', () =>
    ui.poster(d, 0, 0, 140, {
      title: 'Title',
      year: '2024',
      heart: 'empty',
      plain: true,
    })
  );
  item('Poster · skeleton', () => ui.poster(d, 0, 0, 140, { skeleton: true }));
  item('Poster · phone (111)', () =>
    ui.poster(d, 0, 0, 111, { title: 'Title', year: '2024', heart: 'empty' })
  );
  item('Hero', () => hero(d, 0, 0, 900, 250));
  item('Hero · phone', () => hero(d, 0, 0, 358, 190));

  item('Button · primary', () =>
    ui.button(d, 0, 0, 'Button', { variant: 'primary' })
  );
  item('Button · secondary', () => ui.button(d, 0, 0, 'Button'));
  item('Button · ghost', () =>
    ui.button(d, 0, 0, 'Button', { variant: 'ghost' })
  );
  item('Button · destructive', () =>
    ui.button(d, 0, 0, 'Delete', { variant: 'destructive', icon: 'trash' })
  );
  item('Button · disabled', () =>
    ui.button(d, 0, 0, 'Button', { disabled: true })
  );
  item('Button · focused', () =>
    ui.button(d, 0, 0, 'Button', { focused: true })
  );
  item('Button · two-part (add to list)', () =>
    ui.button(d, 0, 0, 'Add to Watch later', { menu: true })
  );
  item('Button · large (phone)', () =>
    ui.button(d, 0, 0, 'Button', { variant: 'primary', size: 'lg', w: 358 })
  );
  item('Button · Like', () =>
    ui.button(d, 0, 0, 'Like', { variant: 'primary', icon: 'heart' })
  );
  item('Chip', () => ui.chip(d, 0, 0, 'Movies'));
  item('Chip · picked', () => ui.chip(d, 0, 0, 'Trending', { on: true }));
  item('Text field', () =>
    ui.field(d, 0, 0, 320, { label: 'Label', placeholder: 'Placeholder' })
  );
  item('Text field · error', () =>
    ui.field(d, 0, 0, 320, {
      label: 'Label',
      value: 'Value',
      error: 'What went wrong and how to fix it',
    })
  );
  item('Search field', () =>
    ui.field(d, 0, 0, 320, {
      placeholder: 'Search',
      icon: 'search',
      shortcut: '⌘K',
      h: 36,
      size: 14,
    })
  );
  item('Badge · count', () => ui.badge(d, 9, 9, 3));
  item('Badge · dot', () => ui.badge(d, 5, 5, ''));
  item('Avatar', () => ui.avatar(d, 20, 20, 40, 'S'));
  item('Only you (privacy cue)', () =>
    ui.privateCue(d, 0, 0, 'Only you can see your Likes')
  );

  item('Sidebar', () => ui.sidebar(d, 0, 0, 772, { active: 'Home' }));
  item('Sidebar · icons only', () =>
    ui.sidebar(d, 0, 0, 572, { active: 'Home', collapsed: true })
  );
  item('Sidebar item', () => {
    ui.icon(d, 'heart', 24, 20, 20);
    d.textMid(46, 20, 'Likes', { size: 15 });
  });
  item('Sidebar item · current', () => {
    d.rect(0, 0, 224, 40, { r: 8, fill: C.mid, stroke: C.mid });
    d.rect(0, 8, 4, 24, { r: 2, fill: C.ink, stroke: C.ink });
    ui.icon(d, 'home', 24, 20, 20);
    d.textMid(46, 20, 'Home', { size: 15 });
  });
  item('Tab bar', () =>
    ui.tabBar(d, 0, 0, 390, { active: 'Home', phone: true })
  );
  item('Phone header · main screen', () =>
    ui.phoneHeader(d, 0, 0, 390, {
      title: 'Likes',
      large: true,
      right: ['bell'],
    })
  );
  item('Phone header · full screen', () =>
    ui.phoneHeader(d, 0, 0, 390, {
      back: 'Home',
      title: 'Title',
      right: ['more'],
    })
  );
  item('Desktop window (1280 × 800)', () => {
    d.rect(0, 0, 1280, 800, { r: 10, fill: C.white, stroke: C.ink, sw: 1.5 });
    ui.windowBar(d, 0, 0, 1280);
  });
  item('Phone screen (390 × 844)', () => {
    d.rect(0, 0, 390, 844, { r: 48, fill: C.white, stroke: C.ink, sw: 2 });
    ui.statusBar(d, 0, 0, 390);
  });
  item('Window bar', () => ui.windowBar(d, 0, 0, 1280));
  item('Status bar (phone)', () => ui.statusBar(d, 0, 0, 390));

  item('Offline banner', () => ui.offlineBanner(d, 0, 0, 1040));
  item('Message', () =>
    ui.message(d, 210, 0, 'Removed from your Likes.', { action: 'Undo' })
  );
  item('Message · error', () =>
    ui.message(d, 210, 0, "Couldn't save your Like.", {
      action: 'Try again',
      icon: 'alert',
    })
  );
  item('Dialog', () => {
    ui.dialog(d, 0, 0, 440, 250, { title: 'Title' });
    ui.button(d, 440 - 24 - 90, 190, 'Save', { variant: 'primary', w: 90 });
    ui.button(d, 440 - 24 - 190, 190, 'Cancel', { w: 90 });
  });
  item('Confirmation', () => {
    ui.dialog(d, 0, 0, 420, 200, { title: 'Delete "List"?', close: false });
    d.text(24, 64, 'Say what will be lost.', { size: 14, color: C.text });
    ui.button(d, 420 - 24 - 96, 140, 'Delete', {
      variant: 'destructive',
      icon: 'trash',
      w: 96,
    });
    ui.button(d, 420 - 24 - 196, 140, 'Cancel', { w: 90, focused: true });
  });
  item('Bottom sheet', () => ui.sheet(d, 0, 0, 390, 360, { title: 'Title' }));
  item('Menu', () =>
    ui.menu(d, 0, 0, 230, [
      { text: 'Action', icon: 'plus' },
      { text: 'Action', icon: 'list' },
      { sep: true },
      { text: 'Action', icon: 'forward' },
    ])
  );
  item('Menu · poster', () =>
    ui.menu(d, 0, 0, 280, [
      { text: 'Add to Watch later', icon: 'plus' },
      { text: 'Add to Horror to watch alone', icon: 'plus' },
      { text: 'Add to list…', icon: 'list', sub: '›' },
    ])
  );
  item('Menu · checklist', () =>
    ui.menu(d, 0, 0, 260, [
      { text: 'New list', icon: 'plus' },
      { text: 'Watch later', check: true },
      { text: 'Binge-watch', check: false },
    ])
  );
  item('Dimmed page (scrim)', () => ui.scrim(d, 0, 0, 1280, 800, { r: 10 }));
  item('Skeleton · lines', () => ui.skeletonLines(d, 0, 0, [320, 280, 200]));
  item('Animation placeholder', () =>
    ui.animation(d, 0, 0, 260, 200, 'Animation: what it shows')
  );
  item('Note', () =>
    ui.note(
      d,
      0,
      0,
      280,
      'A note for the reviewer. Keep notes outside the screen, in the column on the right of the frame.'
    )
  );

  for (const name of ICONS)
    item(`Icon · ${name}`, () => ui.icon(d, name, 10, 10, 20));

  for (const found of thirdParty ?? []) {
    items.push({ ...found, id: `kit-${items.length + 1}` });
  }

  return {
    type: 'excalidrawlib',
    version: 2,
    source: 'https://github.com/orlandovallejos/movie-mates',
    libraryItems: items,
  };
}
