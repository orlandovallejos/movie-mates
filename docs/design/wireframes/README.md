# Wireframes

Low-fidelity drawings of every screen in [navigation.md](../../product/navigation.md), on each client, with
their loading, empty and error states. They decide layout, order and behavior. Color, type and the light
theme come later, in the tokens and Storybook.

**See them:** [every frame on one page](frames.md).

| File                                     | What it holds                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`kit.excalidrawlib`](kit.excalidrawlib) | The kit: posters, hearts, buttons, chips, fields, sidebar, tab bar, sheets, dialogs, icons, … |
| [`kit.excalidraw`](kit.excalidraw)       | The same kit laid out on one frame, so it can be reviewed as a PNG                            |
| [`shell.excalidraw`](shell.excalidraw)   | The app frame per client, each kind of screen (dialog, sheet, menu, …) and two checks         |
| [`states.excalidraw`](states.excalidraw) | Loading, empty, error, TMDB down, offline, signed out, messages and not found, per layout     |
| `<area>.excalidraw`                      | One file per area, from R3 on: `auth`, `browse`, `likes-and-lists`, then matching and profile |
| [`png/`](png/)                           | One PNG per frame, written by the export script. These are what gets reviewed.                |
| [`frames.md`](frames.md)                 | Every PNG with its name and story IDs, written by the export script                           |

## How they're made

1. **Claude drafts** each file from code, with [`claude-tools/wireframes`](../../../claude-tools/README.md#wireframes).
   People don't run or edit that code; ask Claude to change a draft.
2. **People adjust** the drawings in Excalidraw (below). After that, the drafting tool refuses to overwrite
   the file, so hand edits are never lost.
3. **The export script** turns every frame into a PNG for review ([Export the PNGs](#export-the-pngs)).

## Open and edit

The `.excalidraw` files are plain JSON. They're marked `linguist-generated` in `.gitattributes`, so GitHub
collapses their diffs; review the PNGs instead.

- **excalidraw.com:** menu → **Open**, pick the file; when done, menu → **Save to…** → **Save to disk**,
  over the same file.
- **VS Code:** the [Excalidraw extension](https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor)
  opens `.excalidraw` files in place and saves them as you go.
- **The kit:** open the library panel (the book icon at the top right), then its menu → **Open**, and pick
  `kit.excalidrawlib`. Drag pieces onto the canvas; ungroup them to change the text.

## Frames

Each frame holds one screen in one state on one layout: the screen at its real size, with a column of notes
on its right. The notes are part of the frame, so they're in the PNG.

| Layout                  | Size       | Used for                                                                                  |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Desktop and web (`D W`) | 1280 × 800 | Every desktop and web screen. The web has no window bar and fits more columns at 1440 px. |
| Narrow (`D W`)          | 960 × 600  | The sidebar shrunk to icons (below 1024 px). Only in `shell` and where a layout changes.  |
| Phone (`M`)             | 390 × 844  | Every phone screen, and the web below 768 px, which uses the phone layout                 |

- **Desktop and web share one frame** unless they differ; the differences go in a note.
- **Each screen gets its main state on both layouts.** Its other states are drawn once, on the layout where
  they differ, and the patterns in `states.excalidraw` cover the rest. A screen's frames show only what's
  new.
- **Frames that test a requirement** (text length, large text) can be any size.

### Names

A frame is named after its row in [navigation.md](../../product/navigation.md), its state, its layout and its
stories, separated by `·`:

```text
Check your email · wrong code · M · AUTH-3 AUTH-5
Home · D W · HOME-1 HOME-2
```

- The state is left out for the main state. The story IDs come last and can be left out.
- The layout is `D W`, `M`, or `D W M` for a frame that shows all of them.
- The PNG is named from the file and the frame, without the IDs:
  `auth--check-your-email--wrong-code--m.png`. Renaming a frame renames its PNG; the export removes the old
  one.
- The export stops with a list of the names to fix when a name doesn't follow this or two frames give the
  same file.

## Style

- **Grayscale.** The drawings hold for both themes; color comes with the tokens. The one color is the blue
  of the notes, which are outside the screen.
- **Hand-drawn shapes, real text.** Boxes are slightly sketchy so nobody mistakes a wireframe for a final
  design. Text uses Excalidraw's **Normal** font (Nunito) at the size it will have (14 on desktop, 15–17 on
  the phone), so lengths are honest.
- **Real words.** Labels and messages are the ones in the stories, never lorem ipsum.
- **Room for Spanish and Portuguese:** buttons size to their text, and long labels may wrap (LANG-7). The
  [text length check](frames.md#text-length--spanish-and-portuguese--d-w-m) shows the longest ones.
- **Color is never the only cue** (A11Y-9): the current item has a bar, picked chips a check, unread entries
  the word New.
- **Targets** are at least 24 px on desktop and web, 44 pt on iOS and 48 dp on Android (A11Y-7).
- **Animations** (empty states, welcome, the match) are dashed boxes that say what they show. Each one has a
  still picture with reduced motion (A11Y-8).

## Export the PNGs

The script runs Excalidraw's own export in a headless browser, so the PNGs match excalidraw.com. It needs
no network: the fonts come from the Excalidraw package. Its dependencies live in `scripts/wireframes/`, apart
from the app's, so the app's `npm ci` doesn't download a browser.

```bash
npm --prefix scripts/wireframes ci
```

```bash
npm --prefix scripts/wireframes run setup
```

```bash
npm --prefix scripts/wireframes run export
```

- `setup` downloads the headless browser, once per machine.
- `export` writes one PNG per frame to `png/`, at 2x, on a dark background (the app's default theme), and
  rewrites `frames.md`. It takes a few seconds.
- Export one file with `npm --prefix scripts/wireframes run export -- browse.excalidraw`, or on a light
  background with `-- --light`.
- The same file gives the same PNGs, so only the frames that changed show up in a diff.
- Commit the `.excalidraw` file, its PNGs and `frames.md` together.

## Credits

The kit is drawn for this project, except the toggles, checkboxes and radio buttons, which come from
[Basic UX/wireframing elements](https://libraries.excalidraw.com/) by Gabriela Macakova. Libraries on
libraries.excalidraw.com are published under the
[MIT licence](https://github.com/excalidraw/excalidraw-libraries/blob/main/LICENSE); they're marked with `*`
in the kit. Excalidraw itself is MIT too.
