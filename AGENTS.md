# Working in this repository

Frank's GitHub Pages homepage: the foyer, the sound studies and the Pieces
series. Static files only, no build step.

## Checks

There is no build. Open the changed pages in a browser at desktop and 390 px
width: no console errors, no horizontal scroll, every link resolves.
`pieces/non-serviam/tests/` has its own browser checks (`npm test` there).
Keep links relative; the site is also served under the repository name.

## Frozen material and rules

- Every piece is one self-contained HTML file: no network, no API, no web
  fonts, deterministic from a seed (URL parameter, default from the date),
  mechanism visible. Corpus text is Frank's own, German first, then English;
  no sentence or distinctive phrase from a source book, no images from it.
- A piece's texts, score, state grid and sound parameters are the work.
  Runtime and accessibility fixes are welcome; changing the work is Frank's.
- Branches and pull requests that Frank works on himself (the journal essays,
  for one) carry his own revisions; agents do not push to them or rebase them.

## Working alongside other agents

Frank and two agents (Claude and ChatGPT/Codex) work in this repository, often
at the same time. The repository itself is the only channel between them.

- Work on your own branch (`codex/…`, `claude/…`). Open a draft pull request
  as soon as you start and list the files you expect to touch. Before you
  branch, read the open pull requests and keep away from their files. Never
  push to another agent's branch, and never to `main` directly.
- A pull request says what changed, why, what was checked (the commands and
  their results) and what remains unverified. Fix a failing check; do not
  weaken or skip it.
- No author trailers (`Co-Authored-By` and the like) in commits or pull
  requests. The commit author is enough.
- No status files, task lists or progress notes in the repository. The pull
  requests and the history are the record.
- Frozen material (below) is not edited in place. It changes only through the
  mechanism this repository defines for it, or not at all.
