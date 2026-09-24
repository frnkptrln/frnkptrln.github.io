# Journal

A dated, open-ended journal within the existing GitHub Pages homepage. Topics can
cross research, technology, politics, philosophy, art, and everyday life. Short
notes and longer essays both belong here.

## Structure

- `index.html`: reverse-chronological article index.
- `<slug>/index.html`: one stable URL per article; semantic, static HTML.
- `style.css`: journal-specific styles, reusing the homepage's colors and navigation.
- `feed.xml`: RSS 2.0, with stable permalink GUIDs and short summaries.
- The root `index.html` links to the journal and features the newest entry.

There is no build dependency, client-side renderer, external font, analytics,
comment service, database, or new hosting service. Pages and feeds work with
JavaScript disabled. Root-relative URLs assume this repository's existing
deployment at `https://frnkptrln.github.io/`.

## Add an entry

1. Copy an article directory to a new descriptive slug. Keep URLs stable when a
   title changes. Write the article in its own language and set the HTML `lang`.
2. Update the title, description, canonical/Open Graph URLs, author, date, source
   links, section IDs, contents navigation, and revision note. Match the visible
   date with `article:published_time` and the RSS publication date. The first
   article's date should be checked when its pull request is approved for release.
3. Add an entry at the top of `journal/index.html` and an item in `feed.xml`.
   Update the homepage's featured entry. Keep the title, URL, date, and summary
   consistent across those three places. Topics are text labels, not nonfunctional
   filter controls; add filtering only when enough posts make it useful.
4. Distinguish sourced facts, personal interpretation, hypotheses, and open
   questions. Cite the actual document used and date time-sensitive statements.
   Link to an immutable source revision for research claims where possible.
   Record substantive corrections visibly; preserve the original publication date
   and RSS GUID. Disclose substantial AI assistance in the article's revision note.
5. Check locally, then review the text and layout in a pull request. Merging to
   the Pages publishing branch is the release step. Check provider/editorial
   information before publishing new kinds of content; this addition makes no
   changes to the site's legal notice.

## Checks

From the repository root:

```bash
python3 tools/check_journal.py
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `/`, `/journal/`, and an article at `http://localhost:8080`. Check narrow
mobile and desktop widths, keyboard navigation, source anchors, print layout,
and JavaScript-disabled reading. `check_journal.py` uses only Python's standard
library; it validates local journal links, metadata, anchor targets, and index /
homepage / feed consistency. External source availability needs a separate check.
