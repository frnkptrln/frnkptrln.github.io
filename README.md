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
- [What It's Like](https://frnkptrln.github.io/pieces/#what-its-like) — a video
  series of seven pieces: three pairs between Claude and Sol, plus one closing piece,
  played from an unlisted YouTube playlist
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

## Research reproducibility

The Experiments door also links to two bounded artifacts from the August 2026
Digital Minds Research Sprint:

- [J-Lens × NSD RSA](https://github.com/frnkptrln/jlens-model-brain-rsa) —
  a targeted model–brain representational-similarity experiment;
- [Triage × Persona Measurement Audit](https://github.com/frnkptrln/triage-persona-measurement-audit) —
  a multi-model audit of persona, wording, response format, option order, and
  schema compatibility.

These links point to reproducibility repositories. The papers themselves remain
separate from the code repositories.

## Stack

- semantic HTML
- vanilla CSS
- minimal vanilla JavaScript
- GitHub Pages

## Privacy posture

The site is intentionally static and data-minimal:

- no analytics or advertising trackers
- no embedded social-media widgets
- the one YouTube playlist on `/pieces/` loads only after an explicit click, in
  privacy-enhanced mode (`youtube-nocookie.com`); until then no request goes to YouTube
- no site-set tracking cookies or `localStorage`
- no remote web-font requests; typography falls back to local/system fonts
- ordinary outbound links only
- hosting via GitHub Pages, whose infrastructure logs visitor IP addresses for security

Provider and privacy information live under `/legal/`.

## Publication checklist

The provider and privacy baseline is complete for the current static setup. Re-review
it whenever analytics, embeds, forms, external fonts, other third-party services, or
the hosting setup change.

The Lem-related pieces are intentionally presented as artistic works in explicit
dialogue with Stanisław Lem and clearly identify that source relationship.

## Local preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
