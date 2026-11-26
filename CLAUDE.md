# Notes for Claude

Claude Code reads this file at the start of every session in this repo. People can read it too: it says
what Claude is expected to know and do here.

- **Follow [CONTRIBUTING.md](CONTRIBUTING.md):** the workflow, branch names, Conventional Commits, the
  "What we'll learn" question in every issue and the "Lesson" paragraph in every pull request, and the code
  style, including a JSDoc comment with an `@example` on every function.
- **Your tools live in [`claude-tools/`](claude-tools/README.md).** Keep there any program you write to
  do part of the work (such as drafting wireframes), never in a temporary folder, so it survives and can
  be reviewed. People don't edit those files by hand; you maintain them. Never overwrite what a person
  changed by hand: check first, as `claude-tools/wireframes/run.mjs` does.
- **Wireframes:** draft with `node claude-tools/wireframes/run.mjs`, then export the PNGs as in
  [docs/design/wireframes/README.md](docs/design/wireframes/README.md#export-the-pngs). Once a file was
  changed by hand, edit that file directly.
- **Format with** `npx prettier --config packages/config/prettier.json`. Install with
  `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci`, so the commit hooks run.
