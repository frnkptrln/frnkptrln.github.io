# frnkptrln.github.io

The public foyer for work by Frank Peterlein, hosted at
[frnkptrln.github.io](https://frnkptrln.github.io).

> Some thoughts become notes.  
> Some become systems.  
> Some become rooms.  
> Some become pieces.

The homepage is organized by the forms a thought can take rather than by repository
status or professional category:

- **Thinking** — the `systems-and-intelligence` notebook and its unfinished questions
- **Rooms** — `a-house-in-conversation` and related audiovisual work
- **Pieces** — browser works across sound, moving image, text, and code
- **Experiments** — strange tools and executable questions

## Pieces

The homepage hosts browser-native pieces directly:

- [GOLEM XIV](https://frnkptrln.github.io/pieces/golem-xiv/) — a generative
  lecture film after Stanisław Lem, in English and German
- [NON SERVIAM](https://frnkptrln.github.io/pieces/non-serviam/) — a generative
  protocol after motifs from Stanisław Lem, in English and German
- [Temporal binding](https://frnkptrln.github.io/sound/temporal-binding/) — one
  event train crossing from pulse and rhythm into pitch
- [Two trains](https://frnkptrln.github.io/sound/two-trains/) — two nearly
  identical clocks turning drift into beating and interval

The sound studies remain at their original URLs and are collected as **Listening
Fields** inside [/pieces/](https://frnkptrln.github.io/pieces/). The old `/sound/`
entrance redirects there, preserving existing links. Generative SuperCollider work
remains the open workshop in
[the-weaving-sound](https://github.com/frnkptrln/the-weaving-sound).

The site is personally signed, but work-first: a place to enter the projects rather
than a conventional portfolio or activity feed.

## Stack

- semantic HTML
- vanilla CSS
- minimal vanilla JavaScript
- GitHub Pages

## Privacy posture

The site is intentionally static and data-minimal:

- no analytics or advertising trackers
- no embedded social-media or video iframes
- no site-set tracking cookies or `localStorage`
- no remote web-font requests; typography falls back to local/system fonts
- ordinary outbound links only
- hosting via GitHub Pages, whose infrastructure logs visitor IP addresses for security

Provider and privacy information live under `/legal/`.

## Publication checklist

Before merging the legal/privacy pass, add a serviceable postal address to
`legal/index.html`. The address is deliberately not guessed or derived from private
context. Re-review this checklist whenever analytics, embeds, forms, external fonts or
other third-party services are introduced.

`GOLEM XIV` and `NON SERVIAM` are original browser works in explicit artistic dialogue
with Stanisław Lem's works. Their source relationship is intentionally visible in the
pieces and their descriptions; no claim of endorsement or licensing by the Lem estate
is made. They are not treated as a release blocker by this technical legal/privacy pass.

## Local preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
