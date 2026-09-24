#!/usr/bin/env python3
"""Validate the static journal, using only Python's standard library."""

from datetime import date, datetime
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://frnkptrln.github.io"
# Separate GitHub Pages projects have no files in this homepage repository.
PROJECT_ROOTS = {"/a-house-in-conversation/", "/systems-and-intelligence/"}
FEEDS = {"en": "/journal/feed.xml", "de": "/journal/feed-de.xml"}


def normalize(text):
    return " ".join(text.split())


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.duplicate_ids = set()
        self.references = []
        self.aria_references = []
        self.meta = {}
        self.canonical = None
        self.alternates = {}
        self.language_links = {}
        self.feed_url = None
        self.language = None
        self.times = []
        self.h1 = []
        self.h1_count = 0
        self.inside_h1 = False
        self.text = []
        self.scripts = 0
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                self.duplicate_ids.add(attrs["id"])
            self.ids.add(attrs["id"])
        for name in ("href", "src"):
            if attrs.get(name):
                self.references.append(attrs[name])
        for name in ("aria-labelledby", "aria-describedby"):
            if attrs.get(name):
                self.aria_references.extend(attrs[name].split())
        if tag == "html":
            self.language = attrs.get("lang")
        if tag == "meta":
            self.meta[attrs.get("name", attrs.get("property"))] = attrs.get("content", "")
        if tag == "link":
            rel = attrs.get("rel", "").split()
            if "canonical" in rel:
                self.canonical = attrs.get("href")
            if "alternate" in rel and attrs.get("type") == "application/rss+xml":
                self.feed_url = attrs.get("href")
            if "alternate" in rel and attrs.get("hreflang"):
                self.alternates[attrs["hreflang"]] = attrs.get("href")
        if tag == "a" and attrs.get("hreflang"):
            self.language_links.setdefault(attrs["hreflang"], []).append(attrs.get("href"))
        if tag == "time":
            self.times.append(attrs.get("datetime"))
        if tag == "h1":
            self.h1_count += 1
            self.inside_h1 = True
        if tag == "script":
            self.scripts += 1

    def handle_endtag(self, tag):
        if tag == "h1":
            self.inside_h1 = False

    def handle_data(self, data):
        self.text.append(data)
        if self.inside_h1:
            self.h1.append(data)

    @property
    def heading(self):
        return normalize(" ".join(self.h1))

    @property
    def plain_text(self):
        return normalize(" ".join(self.text))


def check():
    failures = []
    cache = {}

    def expect(condition, message):
        if not condition:
            failures.append(message)

    def page(path):
        path = path.resolve()
        if path not in cache:
            cache[path] = Page(path)
        return cache[path]

    def canonical(path):
        relative = path.relative_to(ROOT).as_posix()
        if path.name == "index.html":
            relative = relative.removesuffix("index.html")
        return SITE + "/" + relative

    def sources(doc):
        return {ref for ref in doc.references
                if urlsplit(ref).scheme in {"http", "https"}
                and (urlsplit(ref).netloc != urlsplit(SITE).netloc
                     or any(urlsplit(ref).path.startswith(prefix) for prefix in PROJECT_ROOTS))}

    article_paths = sorted((ROOT / "journal").glob("*/index.html"))
    expect(bool(article_paths), "No journal articles found")
    home = page(ROOT / "index.html")
    indexes = {"en": page(ROOT / "journal/index.html"), "de": page(ROOT / "journal/de.html")}
    articles = {
        "en": [page(path) for path in article_paths],
        "de": [page(path.with_name("de.html")) for path in article_paths
               if path.with_name("de.html").is_file()],
    }
    journal_pages = [*indexes.values(), *articles["en"], *articles["de"]]
    checked = [home, *journal_pages]

    for doc in checked:
        label = str(doc.path.relative_to(ROOT))
        expect(doc.h1_count == 1, f"{label}: expected one h1")
        expect(not doc.duplicate_ids, f"{label}: duplicate IDs {doc.duplicate_ids}")
        expect(bool(doc.language), f"{label}: missing document language")
        expect(bool(doc.meta.get("description")), f"{label}: missing description")
        expect(doc.feed_url == FEEDS.get(doc.language), f"{label}: incorrect language-specific RSS discovery")
        for reference in doc.aria_references:
            expect(reference in doc.ids, f"{label}: missing ARIA target {reference}")
        for ref in doc.references:
            url = urlsplit(ref)
            if url.scheme and url.scheme not in {"http", "https"}:
                continue
            if url.netloc and url.netloc != urlsplit(SITE).netloc:
                continue
            if any(url.path.startswith(prefix) for prefix in PROJECT_ROOTS):
                continue
            path_string = unquote(url.path)
            if path_string.startswith("/"):
                target = ROOT / path_string.lstrip("/")
            elif path_string:
                target = doc.path.parent / path_string
            else:
                target = doc.path
            target = target.resolve()
            expect(target.is_relative_to(ROOT), f"{label}: link escapes root: {ref}")
            if target.is_dir():
                target = target / "index.html"
            expect(target.is_file(), f"{label}: missing local target: {ref}")
            if target.is_file() and url.fragment and target.suffix == ".html":
                expect(unquote(url.fragment) in page(target).ids, f"{label}: missing anchor: {ref}")

    for doc in journal_pages:
        expect(doc.scripts == 0, f"{doc.path}: journal should not need scripts")
        expected_language = "de" if doc.path.name == "de.html" else "en"
        expect(doc.language == expected_language, f"{doc.path}: incorrect document language")
        expected = canonical(doc.path)
        expect(doc.canonical == expected, f"{doc.path}: wrong canonical URL")
        expect(doc.meta.get("og:url") == expected, f"{doc.path}: wrong Open Graph URL")
        expect(doc.meta.get("og:locale") == {"en": "en_GB", "de": "de_DE"}[expected_language],
               f"{doc.path}: incorrect Open Graph locale")
        english_url = canonical(doc.path.with_name("index.html"))
        expect(doc.alternates.get("x-default") == english_url, f"{doc.path}: default must be English")
        for lang, filename in (("en", "index.html"), ("de", "de.html")):
            sibling_path = doc.path.with_name(filename)
            if sibling_path.is_file():
                sibling = page(sibling_path)
                sibling_url = canonical(sibling_path)
                expect(doc.alternates.get(lang) == sibling_url, f"{doc.path}: incorrect {lang} alternate")
                expect(sibling.alternates.get(doc.language) == expected, f"{doc.path}: missing reciprocal alternate")
                if lang != doc.language:
                    expect(urlsplit(sibling_url).path in doc.language_links.get(lang, []),
                           f"{doc.path}: missing visible {lang} language switch")

    feed_items = {}
    for lang, index in indexes.items():
        rss = ET.parse(ROOT / FEEDS[lang].lstrip("/")).getroot()
        expect(rss.tag == "rss" and rss.attrib.get("version") == "2.0", f"{lang}: expected RSS 2.0")
        channel = rss.find("channel")
        expect(channel is not None, f"{lang}: missing RSS channel")
        if channel is None:
            continue
        expect(channel.findtext("link") == index.canonical, f"{lang}: wrong RSS channel link")
        expect(channel.findtext("language") == lang, f"{lang}: wrong RSS language")
        atom_link = channel.find("{http://www.w3.org/2005/Atom}link")
        expect(atom_link is not None and atom_link.get("href") == SITE + FEEDS[lang],
               f"{lang}: missing RSS self link")
        items = channel.findall("item")
        feed_items[lang] = items
        urls = [item.findtext("link") for item in items]
        expect(len(set(urls)) == len(urls), f"{lang}: duplicate RSS item URLs")
        expect(set(urls) == {doc.canonical for doc in articles[lang]}, f"{lang}: RSS and article URLs differ")
        expect(index.times == sorted(index.times, reverse=True), f"{lang}: index is not newest first")
        expect(len(index.times) == len(articles[lang]), f"{lang}: index and article counts differ")
        feed_dates = [parsedate_to_datetime(item.findtext("pubDate")) for item in items]
        expect(feed_dates == sorted(feed_dates, reverse=True), f"{lang}: RSS is not newest first")

        for doc in articles[lang]:
            slug_path = urlsplit(doc.canonical).path
            matches = [item for item in items if item.findtext("link") == doc.canonical]
            expect(len(matches) == 1, f"{slug_path}: expected one RSS item")
            expect(slug_path in index.references, f"{slug_path}: missing from index")
            expect(doc.heading in index.plain_text, f"{slug_path}: index title differs")
            expect(len(doc.times) == 1, f"{slug_path}: expected one visible publication date")
            expect(doc.meta.get("author") == "Frank Peterlein", f"{slug_path}: missing author")
            expect(doc.meta.get("og:type") == "article", f"{slug_path}: missing article type")
            expect(doc.meta.get("og:title") == doc.heading, f"{slug_path}: Open Graph title differs")
            expect("quellen" in doc.ids, f"{slug_path}: missing sources section")
            if len(doc.times) == 1:
                published = date.fromisoformat(doc.times[0])
                expect(datetime.fromisoformat(doc.meta["article:published_time"]).date() == published,
                       f"{slug_path}: visible / metadata dates differ")
            if matches:
                item = matches[0]
                expect(item.findtext("title") == doc.heading, f"{slug_path}: RSS title differs")
                expect(item.findtext("guid") == doc.canonical, f"{slug_path}: RSS GUID differs")
                expect(parsedate_to_datetime(item.findtext("pubDate")).date().isoformat() == doc.times[0],
                       f"{slug_path}: RSS date differs")
                expect(normalize(item.findtext("description", "")) in index.plain_text,
                       f"{slug_path}: RSS / index summaries differ")
            if lang == "de":
                original_pair = page(doc.path.with_name("index.html"))
                expect(doc.times == original_pair.times, f"{slug_path}: translation dates differ")
                expect(sources(doc) == sources(original_pair), f"{slug_path}: translation source URLs differ")
                expect(doc.ids == original_pair.ids, f"{slug_path}: translation anchor IDs differ")

    if articles["en"]:
        newest = max(articles["en"], key=lambda doc: doc.times[0])
        expect(urlsplit(newest.canonical).path in home.references, "Newest article missing from homepage")
        expect(newest.heading in home.plain_text, "Homepage title differs from newest article")
        expect(newest.times[0] in home.times, "Homepage date differs from newest article")
        item = next((item for item in feed_items.get("en", []) if item.findtext("link") == newest.canonical), None)
        if item is not None:
            expect(normalize(item.findtext("description", "")) in home.plain_text,
                   "Homepage summary differs from newest article")

    return failures, checked


if __name__ == "__main__":
    try:
        errors, pages = check()
    except (OSError, ValueError, KeyError, IndexError, ET.ParseError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
    print(f"OK: {len(pages)} pages, 2 feeds; links, anchors, reciprocal languages, metadata, source parity, index/homepage/RSS consistency")
