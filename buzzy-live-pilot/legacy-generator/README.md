# Old page generator (historical, not used)

Until 2026-11-21 the host, player, start and viewer pages were generated from the frozen prototype
`buzzy-output/buzzy_midnight_studio_v7_51.html` by `generate-ui.mjs` and the patch modules here, which applied
about 155 exact-string replacements in sequence.

In #441 (docs/BACKLOG.md) the generated output became the source: `app/` holds the page script, styles and
shells, and `scripts/build-pages.mjs` builds the pages from them. The first build was checked byte for byte
against this generator's output.

These files are kept only so the history of each change stays easy to find (the comments name the backlog IDs).
Do not edit them and do not run them as part of the build; change `app/` instead.
