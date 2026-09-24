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

    article_paths = sorted((ROOT / "journal").glob("*/index.html"))
    expect(bool(article_paths), "No journal articles found")
    home = page(ROOT / "index.html")
    index = page(ROOT / "journal/index.html")
    articles = [page(path) for path in article_paths]
    checked = [home, index, *articles]

    for doc in checked:
        label = str(doc.path.relative_to(ROOT))
        expect(doc.h1_count == 1, f"{label}: expected one h1")
        expect(not doc.duplicate_ids, f"{label}: duplicate IDs {doc.duplicate_ids}")
        expect(bool(doc.language), f"{label}: missing document language")
        expect(bool(doc.meta.get("description")), f"{label}: missing description")
        expect(doc.feed_url == "/journal/feed.xml", f"{label}: missing RSS discovery")
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

    for doc in [index, *articles]:
        expect(doc.scripts == 0, f"{doc.path}: journal should not need scripts")
        if doc is index:
            expect(doc.language == "de", f"{doc.path}: expected German index language")
        expected = SITE + "/" + doc.path.parent.relative_to(ROOT).as_posix() + "/"
        expect(doc.canonical == expected, f"{doc.path}: wrong canonical URL")
        expect(doc.meta.get("og:url") == expected, f"{doc.path}: wrong Open Graph URL")

    rss = ET.parse(ROOT / "journal/feed.xml").getroot()
    expect(rss.tag == "rss" and rss.attrib.get("version") == "2.0", "Expected RSS 2.0")
    channel = rss.find("channel")
    expect(channel is not None, "Missing RSS channel")
    if channel is None:
        return failures, checked
    expect(channel.findtext("link") == SITE + "/journal/", "Wrong RSS channel link")
    atom_link = channel.find("{http://www.w3.org/2005/Atom}link")
    expect(atom_link is not None and atom_link.get("href") == SITE + "/journal/feed.xml", "Missing RSS self link")
    items = channel.findall("item")
    urls = [item.findtext("link") for item in items]
    expect(len(set(urls)) == len(urls), "Duplicate RSS item URLs")
    expect(set(urls) == {doc.canonical for doc in articles}, "RSS and article URLs differ")
    expect(index.times == sorted(index.times, reverse=True), "Index is not newest first")
    expect(len(index.times) == len(articles), "Index and article counts differ")
    feed_dates = [parsedate_to_datetime(item.findtext("pubDate")) for item in items]
    expect(feed_dates == sorted(feed_dates, reverse=True), "RSS is not newest first")

    for doc in articles:
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

    if articles:
        newest = max(articles, key=lambda doc: doc.times[0])
        expect(urlsplit(newest.canonical).path in home.references, "Newest article missing from homepage")
        expect(newest.heading in home.plain_text, "Homepage title differs from newest article")
        expect(newest.times[0] in home.times, "Homepage date differs from newest article")
        item = next((item for item in items if item.findtext("link") == newest.canonical), None)
        if item is not None:
            expect(normalize(item.findtext("description", "")) in home.plain_text,
                   "Homepage summary differs from newest article")

    return failures, checked


if __name__ == "__main__":
    try:
        errors, pages = check()
    except (OSError, ValueError, KeyError, ET.ParseError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
    print(f"OK: {len(pages)} pages; local links, anchors, metadata, index/homepage/RSS consistency")
