# Journal

A dated, open-ended journal within the existing GitHub Pages homepage. Topics can
cross research, technology, politics, philosophy, art, and everyday life. Short
notes and longer essays both belong here.

## Structure

- `index.html`: English default, reverse-chronological article index.
- `de.html`: German index, linking to the German versions of entries.
- `<slug>/index.html`: English article; semantic, static HTML.
- `<slug>/de.html`: German original where available.
- `style.css`: journal-specific styles, reusing the homepage's colors and navigation.
- `feed.xml` / `feed-de.xml`: English / German RSS 2.0, with stable permalink
  GUIDs and short summaries. A translation is one entry in its language's feed,
  not an extra entry in the same feed.
- The root `index.html` links to the journal and features the newest entry.

There is no build dependency, client-side renderer, external font, analytics,
comment service, database, or new hosting service. Pages and feeds work with
JavaScript disabled. Root-relative URLs assume this repository's existing
deployment at `https://frnkptrln.github.io/`.

## Add an entry

German is a natural drafting language for Frank; English is the public default.
Develop and edit the thought in German first when that preserves his voice best.
Translate the argument, not just the words: preserve qualifications, sources,
uncertainty, and the difference between observation and interpretation. English
should read naturally without making the claim stronger. Both versions receive
substantive corrections together; record any lag explicitly.

1. Copy an article directory to a new descriptive slug. Keep URLs stable when a
   title changes. Use `index.html` for English and `de.html` for the German
   version; set `lang` and the Open Graph locale for each. Keep shared section
   IDs stable across translations. The existing first-essay slug is preserved.
2. Update the title, description, canonical/Open Graph URLs, author, date, source
   links, section IDs, contents navigation, and revision note. Match the visible
   date with `article:published_time` and the RSS publication date. The first
   article's date should be checked when its pull request is approved for release.
3. Add an entry at the top of each applicable language index and its feed.
   Update the homepage's featured entry in English. Keep the title, URL, date,
   and summary consistent within each language. Add a visible EN/DE switch,
   self-referencing canonical URLs, reciprocal `hreflang` alternatives, and
   `x-default` pointing to English. Link each page to its language's feed.
   Topics are text labels, not nonfunctional
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

Open `/`, `/journal/`, `/journal/de.html`, and both versions of an article at
`http://localhost:8080`. Check narrow
mobile and desktop widths, keyboard navigation, source anchors, print layout,
and JavaScript-disabled reading. `check_journal.py` uses only Python's standard
library; it validates local journal links, metadata, anchor targets, reciprocal
language links, matching source URLs across translations, and index / homepage /
feed consistency. External source availability and translation meaning need
separate checks.
