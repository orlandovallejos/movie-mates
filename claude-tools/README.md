# Claude tools

Programs that Claude (the AI assistant this project works with, through Claude Code) runs and maintains to
do part of the work. **They aren't for people to run or edit by hand.** Their output is reviewed like any
other change; the tools themselves are kept here so the work can be repeated, checked and continued in any
session.

## Rules

- **Don't edit these files by hand.** To change what a tool does, ask Claude. It changes the code, runs it,
  and opens a pull request like any other change.
- **Read them freely.** Every function has a JSDoc comment with an `@example`
  ([CONTRIBUTING.md](../CONTRIBUTING.md#code-style)), and every file starts with a line pointing here.
- **A tool never overwrites work a person did.** If its output was changed by hand, it stops and says so.
  From then on, the hand-edited file is the one that counts.
- **They follow the repo's rules:** ESLint and Prettier run on them, and new dependencies go through review.
- **What people run lives elsewhere.** Tools meant for people, such as the PNG export in
  [`scripts/wireframes`](../scripts/wireframes), stay in `scripts/`.

## Tools

| Tool                         | What it does                                                    | Its output                                     |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| [`wireframes/`](wireframes/) | Draws the first drafts of the wireframes from code (#155, #175) | `docs/design/wireframes/*.excalidraw`, the kit |

### wireframes

Claude makes the first draft of each wireframe file from code, so frames share exact sizes, the same kit
pieces and the real text measured with Excalidraw's fonts. A person then adjusts the drawings in
excalidraw.com or VS Code, and the [export script](../docs/design/wireframes/README.md#export-the-pngs)
turns them into the PNGs that get reviewed.

```bash
node claude-tools/wireframes/run.mjs
```

- It drafts `shell.excalidraw`, `states.excalidraw`, `auth.excalidraw`, `kit.excalidrawlib` and
  `kit.excalidraw`. Name files to draft only those: `node claude-tools/wireframes/run.mjs states.excalidraw`.
- `--out <folder>` writes the drafts somewhere else instead, to compare them with the files in the repo.
- It uses the packages installed for the export script (`npm --prefix scripts/wireframes ci`), so both use
  the same Excalidraw version.
- **Hand edits are safe.** [`drafted.json`](wireframes/drafted.json) keeps a fingerprint (a SHA-256 hash)
  of each file as it was last drafted. If a file no longer matches (someone saved it in Excalidraw), the
  run stops, names the file and writes nothing. Claude then edits that file directly, or drafts only the
  others by naming them.
- `kit.excalidraw` is laid out from the drafted kit. If `kit.excalidrawlib` was changed by hand, the sheet
  is updated by hand too.

| File                    | What it holds                                                                     |
| ----------------------- | --------------------------------------------------------------------------------- |
| `run.mjs`               | The command: bundles the drawing code, runs it in headless Chromium, writes files |
| `main.js`               | Runs in the browser: loads Excalidraw's fonts, then builds every file             |
| `lib.js`                | The palette, text measuring, and `Doc`, which collects Excalidraw elements        |
| `ui.js`                 | Icons and components: buttons, posters, grids, sidebar, tab bar, dialogs, …       |
| `frames.js`             | Frames on the canvas, and the desktop and phone app layouts                       |
| `shell.js`, `states.js` | The frames of `shell.excalidraw` and `states.excalidraw`                          |
| `auth.js`               | The frames of `auth.excalidraw`: sign-in, then onboarding (#156)                  |
| `flow.js`               | Flowcharts in the same style: boxes, diamonds for questions, labeled arrows       |
| `kit.js`, `sheet.js`    | The kit library, and the sheet that shows it as one frame                         |
| `drafted.json`          | The fingerprints, written by `run.mjs`                                            |
