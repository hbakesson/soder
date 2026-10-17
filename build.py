#!/usr/bin/env python3
"""Bygger webbplatsens data från originalarkivet.

Läser de ursprungliga HTML-sidorna i ``source/`` (en orörd kopia av Bengt-Göran
Jönssons sidor) och bilderna i ``sodermalm.one/``, och skriver ett strukturerat,
rensat innehåll till ``data/``:

    data/index.js            platser, sidtitlar och utdrag (laddas direkt)
    data/places/<mapp>.js    alla sidor i en mapp (laddas när de behövs)

Varje sida blir en lista av block (stycken, rubriker, bilder med bildtexter,
bildgallerier, uppslag där text och bilder hör ihop, klickbara kartor och
länklistor). Sidan renderas sedan av app.js.

Kör:  python3 build.py
Kräver: beautifulsoup4 och lxml (finns förinstallerat på macOS-python3 här,
annars  pip3 install beautifulsoup4 lxml).
"""

import json
import os
import posixpath
import re
import struct
import sys
from collections import OrderedDict, defaultdict
from html import escape
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "source"
MEDIA_DIR = "sodermalm.one"
MEDIA = ROOT / MEDIA_DIR
OUT = ROOT / "data"

# --------------------------------------------------------------------------
# Redaktionellt: namn, kategorier och startsidor per mapp
# --------------------------------------------------------------------------

NAMES = {
    "annalindhagen": "Anna Lindhagens täppa",
    "ansgarieg": "Ansgariegatan",
    "asoberget": "Åsöberget",
    "barnangen": "Barnängen",
    "bastugatan": "Bastugatan",
    "bellmansgatannorr": "Bellmansgatan norr",
    "bellmansgatanshornsg": "Bellmansgatan söder",
    "bengtekenhjelmsgatan": "Bengt Ekehjelmsgatan",
    "bergsprangargrand": "Bergsprängargränd",
    "bjorngardsgatan": "Björngårdsgatan",
    "blecktornsgrand": "Blecktornsgränd",
    "bondegatan": "Bondegatan",
    "brannkyrkagost": "Brännkyrkagatan öst",
    "brannkyrkagvast": "Brännkyrkagatan väst",
    "danviken": "Danviken",
    "ekermanskamalmg": "Ekermanska malmgården",
    "ersta": "Ersta",
    "fafangan": "Fåfängan",
    "fargargavljus": "Färgargården",
    "fatburen": "Fatburen",
    "fiskarroddargatan": "Fiskargatan och Roddargatan",
    "fjallgatan": "Fjällgatan",
    "fjallgatannorr": "Fjällgatan, norra sidan",
    "fjallgatansoder": "Fjällgatan, södra sidan",
    "folkungagatan": "Folkungagatan",
    "forensodermalm": "Föreningen Södermalm",
    "fredmansgatan": "Fredmansgatan",
    "gatorbyggnplats": "Register",
    "glasbruksgatan": "Glasbruksgatan",
    "gotgatan": "Götgatan",
    "heleneborg": "Heleneborg",
    "historia": "Södermalms historia",
    "hogalid": "Högalid",
    "hogbergsgost": "Högbergsgatan öst",
    "hogbergsgvast": "Högbergsgatan väst",
    "hornsgatan": "Hornsgatan",
    "hornsgatanostsoder": "Hornsgatan, Hornstull",
    "innehall": "Källor",
    "josabeth": "Josabeth",
    "katarina": "Katarina",
    "katarinanordvast": "Nordvästra Katarina",
    "kocksgatan": "Kocksgatan",
    "kristallen": "Kristallen",
    "krukmakargatan": "Krukmakargatan",
    "kvarngatan": "Kvarngatan",
    "langholmen": "Långholmen",
    "liljeholmensstearin": "Liljeholmens stearinfabrik",
    "lillaersta": "Lilla Erstagatan",
    "lillaskinnarviksgrand": "Lilla Skinnarviksgränd",
    "malmgardsvagen": "Malmgårdsvägen",
    "mariaberget": "Mariaberget",
    "mariatrappgrand": "Maria trappgränd",
    "mastermikael": "Mäster Mikaels gata",
    "masterparsgrand": "Mäster Pers gränd",
    "mejtens": "Mejtens",
    "nytorget": "Nytorget",
    "nytorgsgatan": "Nytorgsgatan",
    "ostgotagatan": "Östgötagatan",
    "pafogelstrom": "Per Anders Fogelström",
    "prastgardsgatan": "Prästgårdsgatan",
    "pryssgrand": "Pryssgränd",
    "pustegrand": "Pustegränd",
    "ragvaldsgatan": "Ragvaldsgatan",
    "reimersholme": "Reimersholme",
    "renstjernasgatan": "Renstiernas gata",
    "rosenlund": "Rosenlund",
    "sickla": "Sickla",
    "sistastyv": "Sista styverns trappor",
    "skanegatanostnytgt": "Skånegatan",
    "skaraborgsgatan": "Skaraborgsgatan",
    "skinnarviksberget": "Skinnarviksberget",
    "slussen": "Slussen",
    "sodermannagatan": "Södermannagatan",
    "stadsgarden": "Stadsgården",
    "stigberget": "Stigberget",
    "stigbergsgatan": "Stigbergsgatan",
    "stpaulsgatan": "Sankt Paulsgatan",
    "swedenborgsgatan": "Swedenborgsgatan",
    "tanto": "Tanto",
    "tavastgatan": "Tavastgatan",
    "tegelviken": "Tegelviken",
    "timmermansgatan": "Timmermansgatan",
    "tjarhovsgatan": "Tjärhovsgatan",
    "tjarhovsgmellgotgrenstj": "Tjärhovsgatan, Götgatan–Renstiernas gata",
    "torkelknutssonsgatan": "Torkel Knutssonsgatan",
    "vastgotagatan": "Västgötagatan",
    "vitabergen": "Vita bergen",
    "wollmaryxkullsgatan": "Wollmar Yxkullsgatan",
}

# Kategorier för filtrering på startsidan.
CATEGORIES = OrderedDict([
    ("gator", "Gator"),
    ("grander", "Gränder & trappor"),
    ("berg", "Berg & kvarter"),
    ("vatten", "Stränder & holmar"),
    ("teman", "Människor & teman"),
])

CATEGORY_OF = {
    "grander": ["bergsprangargrand", "blecktornsgrand", "lillaskinnarviksgrand",
                "mariatrappgrand", "masterparsgrand", "pryssgrand", "pustegrand",
                "sistastyv"],
    "berg": ["asoberget", "mariaberget", "skinnarviksberget", "stigberget",
             "vitabergen", "katarina", "katarinanordvast", "hogalid", "ersta",
             "mejtens", "nytorget", "fargargavljus", "barnangen", "fatburen",
             "rosenlund", "ekermanskamalmg", "kristallen"],
    "vatten": ["langholmen", "reimersholme", "tanto", "heleneborg", "danviken",
               "fafangan", "tegelviken", "stadsgarden", "slussen", "sickla",
               ],
    "teman": ["pafogelstrom", "annalindhagen", "josabeth", "liljeholmensstearin", "forensodermalm", "historia", "gatorbyggnplats",
              "innehall"],
}

# Mappar som inte visas som platser i rutnätet (de nås via menyn).
NOT_PLACES = {"historia", "gatorbyggnplats", "innehall", "forensodermalm"}

# Startsida per mapp när den inte heter <mapp>.html
MAIN_PAGE = {
    "ansgarieg": "ansgarieg1",
    "ekermanskamalmg": "ekermanmalm",
    "gatorbyggnplats": "gbp",
    "historia": "historiabas",
    "innehall": "kallforteckning",
    "malmgardsvagen": "nr55",
    "mastermikael": "kartor",
    "skanegatanostnytgt": "skanegatan",
    "stigberget": "stigberget",
}

# Utvalda platser på startsidan (i ordning).
FEATURED = ["fjallgatan", "mariaberget", "slussen", "vitabergen", "langholmen",
            "bellmansgatanshornsg"]

# Bakgrundsbilder (BODY background) som duger som toppbild, med beskärning av
# inbyggda vita marginaler i procent: [topp, höger, botten, vänster].
# Övriga bakgrunder är bleka texturer och visas inte.
HERO_BACKGROUNDS = {
    "asoberget/nutidfrfafangan2.jpg": [6.4, 13.6, 10.2, 8.1],
}

# Bilder som är rubriker, knappar eller dekor och aldrig ska visas som foton.
DECOR_RE = re.compile(
    r"(forstoringsglas|lupp|^pil|pil(hoger|vanster|upp|ned)|arrow|spacer|"
    r"tillbaka|hem\.|home|knapp|button|rubr|rubrik|^namn|^namnet|titel|"
    r"vinjett|bakgr|^bg|waves|mute|nutidspunkt|linje|^line|ikon|icon|"
    r"blank|tom\.|transparent)", re.I)

# Webbhotell som har lagts ned; länkar dit tas bort (texten behålls).
DEAD_HOSTS_RE = re.compile(r"^https?://([^/]*\.)?(geocities\.com|w\d+\.\d+\.telia\.com|"
                           r"hemsidor\.torget\.se|home\.swipnet\.se|hem\.passagen\.se)", re.I)

SMALL_WORDS = {"och", "i", "på", "av", "vid", "från", "till", "mot", "med",
               "för", "en", "ett", "om", "under", "över", "efter", "den",
               "det", "de", "som"}

INSTRUCTION_RE = re.compile(
    r"^(klicka|tryck|peka|för musen|se större|större bild|förstora|"
    r"fortsättning följer|tillbaka|åter till|till början|upp$)", re.I)

# --------------------------------------------------------------------------
# Filindex (skiftlägesokänsligt, så att länkar fungerar på GitHub Pages)
# --------------------------------------------------------------------------

media_files = {}   # "mapp/fil.jpg".lower() -> "mapp/fil.jpg" (verkligt namn)
for dirpath, _, files in os.walk(MEDIA):
    for f in files:
        rel = os.path.relpath(os.path.join(dirpath, f), MEDIA).replace(os.sep, "/")
        media_files[rel.lower()] = rel

src_pages = {}     # "mapp/sida" (lower, utan ändelse) -> Path
for dirpath, _, files in os.walk(SRC):
    for f in files:
        if f.lower().endswith((".htm", ".html")):
            rel = os.path.relpath(os.path.join(dirpath, f), SRC).replace(os.sep, "/")
            pid = re.sub(r"\.html?$", "", rel.lower())
            src_pages[pid] = Path(dirpath) / f

IMAGE_EXT = (".jpg", ".jpeg", ".gif", ".png")

# --------------------------------------------------------------------------
# Bildmått direkt från filhuvudet (ingen PIL behövs)
# --------------------------------------------------------------------------

_dim_cache = {}


def image_size(rel):
    if rel in _dim_cache:
        return _dim_cache[rel]
    size = None
    try:
        with open(MEDIA / rel, "rb") as fh:
            head = fh.read(26)
            if head[:6] in (b"GIF87a", b"GIF89a"):
                size = struct.unpack("<HH", head[6:10])
            elif head[:8] == b"\x89PNG\r\n\x1a\n":
                size = struct.unpack(">II", head[16:24])
            elif head[:2] == b"\xff\xd8":
                fh.seek(2)
                while True:
                    marker = fh.read(2)
                    if len(marker) < 2 or marker[0] != 0xFF:
                        break
                    while marker[1] == 0xFF:
                        marker = marker[:1] + fh.read(1)
                    code = marker[1]
                    if code in (0xD8, 0x01) or 0xD0 <= code <= 0xD7:
                        continue
                    seglen = struct.unpack(">H", fh.read(2))[0]
                    if code in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                                0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                        fh.read(1)
                        h, w = struct.unpack(">HH", fh.read(4))
                        size = (w, h)
                        break
                    fh.seek(seglen - 2, 1)
    except (OSError, struct.error):
        size = None
    _dim_cache[rel] = size
    return size


# --------------------------------------------------------------------------
# Hjälpfunktioner
# --------------------------------------------------------------------------

def read_html(path):
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("cp1252", errors="replace")
    return text


def norm_ws(s):
    return re.sub(r"[ \t\r\n\f ]+", " ", s)


def plain(html):
    s = re.sub(r"<br\s*/?>", " ", html)
    s = re.sub(r"<[^>]+>", "", s)
    s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
          .replace("&quot;", '"').replace("&#39;", "'"))
    return norm_ws(s).strip()


def fold(s):
    """Förenkla för sökning: gemener, utan diakriter utom åäö-skillnad bort."""
    s = s.lower()
    for a, b in (("å", "a"), ("ä", "a"), ("ö", "o"), ("é", "e"), ("ü", "u")):
        s = s.replace(a, b)
    return s


def smart_case(label):
    """'OM ÅSÖBERGET' -> 'Om Åsöberget'. Lämnar blandad versalisering orörd."""
    letters = [c for c in label if c.isalpha()]
    if not letters or not all(c.isupper() for c in letters):
        return label
    words = label.lower().split(" ")
    out = []
    for i, w in enumerate(words):
        if i > 0 and w in SMALL_WORDS:
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    return " ".join(out)


def tidy_title(t):
    t = norm_ws(t).strip(" .,;:-–—»«\"'")
    t = re.sub(r"\s*\(\s*\)\s*", " ", t).strip()
    return smart_case(t)


def resolve(folder, href):
    """Tolka en relativ länk från en sida i ``folder``.

    Returnerar (typ, värde): ('page', pid) | ('image', relpath) |
    ('file', relpath) | ('mail', href) | ('ext', href) | (None, None)
    """
    if not href:
        return None, None
    href = href.strip().replace("\\", "/")
    low = href.lower()
    if low.startswith("mailto:"):
        return "mail", href
    if low.startswith(("http://", "https://")):
        if DEAD_HOSTS_RE.search(low):
            return None, None
        m = re.match(r"https?://(www\.)?[^/]*soder[^/]*/(.*)", href, re.I)
        if not m:
            return "ext", href
        href = "/" + m.group(2)
    if low.startswith(("javascript:", "#")):
        return None, None
    href = href.split("#")[0].split("?")[0]
    if not href:
        return None, None
    if href.startswith("/"):
        rel = posixpath.normpath(href.lstrip("/"))
    else:
        rel = posixpath.normpath(posixpath.join(folder, href))
    if rel.startswith("../"):
        rel = rel.lstrip("./")
    rel_low = rel.lower()
    if rel_low.startswith("sodermalm.one/"):
        rel_low = rel_low[len("sodermalm.one/"):]
    if rel_low.endswith((".htm", ".html")):
        pid = re.sub(r"\.html?$", "", rel_low)
        if pid in src_pages:
            return "page", pid
        # samma namn med annan ändelse eller i annan mapp
        base = pid.rsplit("/", 1)[-1]
        cands = [p for p in src_pages if p.rsplit("/", 1)[-1] == base]
        if len(cands) == 1:
            return "page", cands[0]
        return None, None
    if rel_low in media_files:
        real = media_files[rel_low]
        if real.lower().endswith(IMAGE_EXT):
            return "image", real
        return "file", real
    # mappnamn -> mappens startsida
    if rel_low.rstrip("/") in folders_main:
        return "page", folders_main[rel_low.rstrip("/")]
    return None, None


def media_url(rel):
    return MEDIA_DIR + "/" + rel


# --------------------------------------------------------------------------
# Tokenisering: platta ut gammal HTML till en ström av text/bild/brytningar
# --------------------------------------------------------------------------

BLOCK_TAGS = {"p", "div", "center", "h1", "h2", "h3", "h4", "h5", "h6", "li",
              "ul", "ol", "blockquote", "hr", "dl", "dt", "dd", "form",
              "address", "pre"}
SKIP_TAGS = {"script", "style", "head", "title", "meta", "link", "map",
             "noscript", "object", "embed", "applet", "iframe", "input",
             "select", "textarea", "button", "bgsound"}


class Ctx(object):
    __slots__ = ("small", "big", "b", "i", "href", "color")

    def __init__(self, small=0, big=0, b=False, i=False, href=None, color=None):
        self.small, self.big, self.b, self.i = small, big, b, i
        self.href, self.color = href, color

    def copy(self, **kw):
        c = Ctx(self.small, self.big, self.b, self.i, self.href, self.color)
        for k, v in kw.items():
            setattr(c, k, v)
        return c


class Tok(object):
    __slots__ = ("kind", "text", "ctx", "img")

    def __init__(self, kind, text="", ctx=None, img=None):
        self.kind, self.text, self.ctx, self.img = kind, text, ctx, img


def font_size(attr):
    if not attr:
        return 0, 0
    a = attr.strip().replace(" ", "")
    try:
        if a.startswith("+"):
            return 0, int(a[1:])
        if a.startswith("-"):
            return int(a[1:]), 0
        n = int(a)
        if n <= 2:
            return 3 - n, 0
        if n >= 4:
            return 0, n - 3
    except ValueError:
        pass
    return 0, 0


class PageParser(object):
    def __init__(self, pid, html):
        self.pid = pid
        self.folder = pid.rsplit("/", 1)[0] if "/" in pid else ""
        self.soup = BeautifulSoup(html, "lxml")
        self.maps = {}
        for m in self.soup.find_all("map"):
            name = (m.get("name") or m.get("id") or "").strip().lstrip("#").lower()
            self.maps[name] = m
        self.links = []          # (pid, label) i ordning
        self.images = []         # alla visade bilder
        self.bg = None

    # ---- länkar -----------------------------------------------------------

    def link_attr(self, href):
        kind, val = resolve(self.folder, href)
        if kind == "page":
            return {"route": val}
        if kind == "image":
            return {"image": val}
        if kind == "file":
            return {"file": val}
        if kind in ("mail", "ext"):
            return {"ext": val}
        return None

    def anchor_html(self, link, inner):
        if not link:
            return inner
        if "route" in link:
            return '<a href="#/%s">%s</a>' % (link["route"], inner)
        if "image" in link:
            return '<a href="%s" data-lightbox>%s</a>' % (
                escape(media_url(link["image"])), inner)
        if "file" in link:
            return '<a href="%s" target="_blank" rel="noopener">%s</a>' % (
                escape(media_url(link["file"])), inner)
        return '<a href="%s" target="_blank" rel="noopener">%s</a>' % (
            escape(link["ext"]), inner)

    # ---- bilder -----------------------------------------------------------

    def image_info(self, img, ctx):
        src = (img.get("src") or "").strip()
        kind, rel = resolve(self.folder, src)
        if kind != "image":
            return None
        name = rel.rsplit("/", 1)[-1].lower()
        try:
            aw = int(re.sub(r"\D", "", img.get("width", "")) or 0)
            ah = int(re.sub(r"\D", "", img.get("height", "")) or 0)
        except ValueError:
            aw = ah = 0
        real = image_size(rel) or (aw, ah)
        info = {"rel": rel, "name": name, "w": real[0], "h": real[1],
                "aw": aw or real[0], "ah": ah or real[1], "link": None,
                "usemap": (img.get("usemap") or "").strip().lstrip("#").lower(),
                "alt": (img.get("alt") or "").strip()}
        if ctx.href:
            info["link"] = self.link_attr(ctx.href)
        return info

    # ---- vandring ---------------------------------------------------------

    def walk(self, node, ctx, out):
        """Lägg till tokens i ``out``. Tabeller blir strukturerade block."""
        for child in node.children:
            if isinstance(child, Comment):
                continue
            if isinstance(child, NavigableString):
                t = norm_ws(str(child))
                if t:
                    out.append(Tok("text", t, ctx))
                continue
            if not isinstance(child, Tag):
                continue
            name = child.name.lower()
            if name in SKIP_TAGS or ":" in name and name.startswith(("v:", "w:")):
                continue
            if name == "br":
                out.append(Tok("br", ctx=ctx))
            elif name == "img":
                info = self.image_info(child, ctx)
                if info:
                    out.append(Tok("img", ctx=ctx, img=info))
            elif name == "table":
                out.append(Tok("break"))
                out.append(Tok("blocks", img=self.table_blocks(child, ctx)))
                out.append(Tok("break"))
            elif name in ("tbody", "thead", "tfoot", "tr", "td", "th"):
                # lösa celler utanför tabell: behandla som block
                out.append(Tok("break"))
                self.walk(child, ctx, out)
                out.append(Tok("break"))
            else:
                c = ctx
                if name == "a":
                    href = child.get("href")
                    if href:
                        c = ctx.copy(href=href)
                elif name == "font":
                    sm, bg = font_size(child.get("size"))
                    if sm or bg:
                        c = ctx.copy(small=sm, big=bg)
                    if child.get("color"):
                        c = c.copy(color=child.get("color").lower())
                elif name in ("b", "strong"):
                    c = ctx.copy(b=True)
                elif name in ("i", "em", "cite"):
                    c = ctx.copy(i=True)
                elif name in ("h1", "h2"):
                    c = ctx.copy(big=2, small=0)
                elif name in ("h3", "h4", "h5", "h6"):
                    c = ctx.copy(big=1, small=0)
                elif name in ("small",):
                    c = ctx.copy(small=1)
                elif name in ("big",):
                    c = ctx.copy(big=1)
                block = name in BLOCK_TAGS
                if block:
                    out.append(Tok("break"))
                if name == "hr":
                    out.append(Tok("break"))
                    continue
                self.walk(child, c, out)
                if block:
                    out.append(Tok("break"))

    def flow(self, node, ctx):
        toks = []
        self.walk(node, ctx, toks)
        return Builder(self).build(toks)

    # ---- tabeller ---------------------------------------------------------

    def table_blocks(self, table, ctx):
        rows = []
        for tr in table.find_all("tr"):
            if tr.find_parent("table") is not table:
                continue
            cells = [td for td in tr.find_all(["td", "th"], recursive=False)]
            rows.append(cells)
        result = []
        for cells in rows:
            groups = []
            for td in cells:
                blocks = self.flow(td, ctx)
                blocks = [b for b in blocks if b]
                if blocks:
                    groups.append(blocks)
            if not groups:
                continue
            if len(groups) == 1:
                result.extend(groups[0])
                continue
            result.extend(combine_cells(groups))
        return result

    # ---- huvud ------------------------------------------------------------

    def parse(self):
        body = self.soup.body or self.soup
        bg = body.get("background") if hasattr(body, "get") else None
        if bg:
            kind, rel = resolve(self.folder, bg)
            if kind == "image" and rel in HERO_BACKGROUNDS:
                size = image_size(rel)
                self.bg = {"s": media_url(rel), "w": size[0], "h": size[1],
                           "crop": HERO_BACKGROUNDS[rel]}
        blocks = self.flow(body, Ctx())
        return finish(blocks)


def text_len(blocks):
    n = 0
    for b in blocks:
        if b["t"] in ("p", "h", "src", "note", "quote"):
            n += len(plain(b["h"]))
        elif b["t"] == "spread":
            n += text_len(b["text"])
    return n


def figures_of(blocks):
    figs = []
    for b in blocks:
        if b["t"] == "fig":
            figs.append(b["f"])
        elif b["t"] == "gal":
            figs.extend(b["items"])
        elif b["t"] == "spread":
            figs.extend(b["media"])
    return figs


def combine_cells(groups):
    """En tabellrad med flera celler: para ihop text och bilder."""
    kinds = []
    for blocks in groups:
        tl = text_len(blocks)
        nf = len(figures_of(blocks))
        has_map = any(b["t"] == "map" for b in blocks)
        if has_map:
            kinds.append("other")
        elif nf and tl < 220 + 120 * nf:
            kinds.append("media")
        elif tl:
            kinds.append("text")
        else:
            kinds.append("other")
    if "text" in kinds and "media" in kinds:
        text, media, extra = [], [], []
        first_media = kinds.index("media")
        first_text = kinds.index("text")
        for blocks, k in zip(groups, kinds):
            if k == "media":
                for b in blocks:
                    if b["t"] in ("fig", "gal", "spread"):
                        media.extend(figures_of([b]))
                    else:
                        # kort text i bildcellen: lägg till som bildtext/notis
                        if b["t"] in ("p", "note") and media and not media[-1].get("c"):
                            media[-1]["c"] = b["h"]
                        else:
                            text.append(b)
            elif k == "text":
                text.extend(blocks)
            else:
                extra.extend(blocks)
        out = [{"t": "spread", "side": "left" if first_media < first_text else "right",
                "text": text, "media": media}]
        return out + extra
    out = []
    if all(k == "media" for k in kinds):
        items = []
        loose = []
        for blocks in groups:
            for b in blocks:
                if b["t"] in ("fig", "gal", "spread"):
                    items.extend(figures_of([b]))
                    if b["t"] == "spread":
                        loose.extend(b["text"])
                elif b["t"] in ("p", "note") and items and not items[-1].get("c"):
                    items[-1]["c"] = b["h"]
                else:
                    loose.append(b)
        out.extend(loose)
        if items:
            out.append({"t": "gal", "items": items})
        return out
    for blocks in groups:
        out.extend(blocks)
    return out


# --------------------------------------------------------------------------
# Blockbyggare: tokens -> stycken, rubriker, figurer
# --------------------------------------------------------------------------

class Builder(object):
    def __init__(self, page):
        self.page = page
        self.blocks = []
        self.para = []      # tokens i aktuellt stycke
        self.fig = None     # figur som väntar på bildtext
        self.cap = []       # tokens för bildtext
        self.brs = 0

    # -- inline-html från tokens --
    def inline(self, toks):
        parts = []
        cur_key = None
        cur = []

        def flush():
            if not cur:
                return
            html = "".join(cur)
            b, i, href = cur_key
            if b:
                html = "<b>%s</b>" % html
            if i:
                html = "<i>%s</i>" % html
            if href:
                link = self.page.link_attr(href)
                html = self.page.anchor_html(link, html)
            parts.append(html)

        for t in toks:
            if t.kind == "br":
                flush()
                cur = []
                cur_key = None
                parts.append("<br>")
                continue
            key = (t.ctx.b, t.ctx.i, t.ctx.href)
            if key != cur_key:
                flush()
                cur = []
                cur_key = key
            cur.append(escape(t.text, quote=False))
        flush()
        html = "".join(parts)
        html = re.sub(r"\s+", " ", html)
        html = re.sub(r"(\s*<br>\s*)+$", "", html)
        html = re.sub(r"^(\s*<br>\s*)+", "", html)
        html = re.sub(r"(\s*<br>\s*){2,}", "<br>", html)
        html = re.sub(r"</b>(\s*)<b>", r"\1", html)
        html = re.sub(r"</i>(\s*)<i>", r"\1", html)
        return html.strip()

    def flush_para(self):
        toks = self.para
        self.para = []
        self.brs = 0
        if not toks:
            return
        if not any(t.kind == "text" and t.text.strip() for t in toks):
            return
        # Länklista? Varje rad domineras av en enda länk (ev. med en rubrikrad först).
        lines, line = [], []
        for t in toks:
            if t.kind == "br":
                if line:
                    lines.append(line)
                line = []
            else:
                line.append(t)
        if line:
            lines.append(line)
        lines = [ln for ln in lines if any(t.text.strip() for t in ln)]

        def link_line(ln):
            hrefs = {t.ctx.href for t in ln if t.ctx.href and t.text.strip()}
            if len(hrefs) != 1:
                return None
            total = sum(len(t.text.strip()) for t in ln)
            linked = sum(len(t.text.strip()) for t in ln if t.ctx.href)
            if linked < 0.5 * total:
                return None
            href = hrefs.pop()
            label = norm_ws("".join(t.text for t in ln if t.ctx.href)).strip()
            rest = norm_ws("".join(t.text for t in ln if not t.ctx.href)).strip(" ,.-–")
            return href, label, rest

        # En rad med flera länker efter varandra ("Karta 1885 Karta 1902 ...") -> länklista
        texty_all = [t for t in toks if t.kind == "text" and t.text.strip()]
        hrefs_all = [t.ctx.href for t in texty_all if t.ctx.href]
        if len(set(hrefs_all)) >= 2:
            total = sum(len(t.text.strip()) for t in texty_all)
            linked = sum(len(t.text.strip()) for t in texty_all if t.ctx.href)
            if linked >= 0.85 * total:
                items, run, run_href = [], [], None
                for t in texty_all + [None]:
                    href = t.ctx.href if t is not None else None
                    if run and href != run_href:
                        label = norm_ws("".join(x.text for x in run)).strip()
                        link = self.page.link_attr(run_href) if run_href else None
                        if link and label:
                            items.append(self.link_item(link, label))
                        run = []
                    if t is not None and href:
                        run.append(t)
                    run_href = href
                if len(items) >= 2:
                    self.blocks.append({"t": "links", "items": items})
                    return

        parsed = [link_line(ln) for ln in lines]
        n_links = sum(1 for x in parsed if x)
        if parsed and (n_links == len(parsed) or n_links >= 2 and n_links >= len(parsed) - 2):
            items = []

            def flush_items():
                if items:
                    self.blocks.append({"t": "links", "items": list(items)})
                    del items[:]

            for ln, x in zip(lines, parsed):
                if x:
                    href, label, rest = x
                    link = self.page.link_attr(href)
                    if link and label:
                        item = self.link_item(link, label)
                        if rest:
                            item["sub"] = rest
                        items.append(item)
                else:
                    flush_items()
                    self.para = ln
                    self.flush_para()
            flush_items()
            return
        # "<b>Åsögatan 195</b><br>(Tidigare 141) ..." -> rubrik + stycke
        if len(toks) > 2 and toks[0].kind == "text" and toks[0].ctx.b and not toks[0].ctx.href:
            lead = []
            for j, t in enumerate(toks):
                if t.kind == "br":
                    break
                lead.append(t)
            else:
                j = None
            if j is not None and all(t.ctx.b for t in lead if t.text.strip()):
                ltxt = norm_ws("".join(t.text for t in lead)).strip()
                if 2 < len(ltxt) < 70 and any(t.kind == "text" and t.text.strip() for t in toks[j + 1:]):
                    self.blocks.append({"t": "h", "h": ltxt.rstrip(":"), "l": 3})
                    self.para = toks[j + 1:]
                    self.flush_para()
                    return
        html = self.inline(toks)
        text = plain(html)
        if not text or re.fullmatch(r"[\s\W_]*", text):
            return
        if len(text) < 90 and INSTRUCTION_RE.match(text):
            return
        texty = [t for t in toks if t.kind == "text" and t.text.strip()]
        n = sum(len(t.text) for t in texty)
        big = sum(len(t.text) for t in texty if t.ctx.big) / max(n, 1)
        bold = sum(len(t.text) for t in texty if t.ctx.b) / max(n, 1)
        ital = sum(len(t.text) for t in texty if t.ctx.i) / max(n, 1)
        small = sum(len(t.text) for t in texty if t.ctx.small) / max(n, 1)
        if big > 0.8 and len(text) < 120:
            self.blocks.append({"t": "h", "h": smart_case(plain(html)), "l": 2})
        elif bold > 0.9 and len(text) < 90 and not text.endswith((".", ",", ":")) or \
                bold > 0.9 and len(text) < 60:
            if ital > 0.8 and (text.lower().startswith("ur ") or "»" in text):
                self.blocks.append({"t": "src", "h": strip_tags_keep_links(html)})
            else:
                self.blocks.append({"t": "h", "h": smart_case(text.rstrip(":")), "l": 3})
        elif bold > 0.9 and len(text) >= 90:
            self.blocks.append({"t": "p", "h": re.sub(r"</?b>", "", html), "lede": 1})
        elif ital > 0.9 and len(text) < 140 and text.lower().startswith(("ur ", "källa", "text:", "från ")):
            self.blocks.append({"t": "src", "h": strip_tags_keep_links(html)})
        elif small > 0.9 and len(text) < 220:
            self.blocks.append({"t": "note", "h": html})
        else:
            self.blocks.append({"t": "p", "h": small_caps_lead(html)})

    def link_item(self, link, label):
        item = {"label": tidy_title(label)}
        if "route" in link:
            item["route"] = link["route"]
            self.page.links.append((link["route"], label))
        elif "image" in link:
            item["image"] = media_url(link["image"])
            size = image_size(link["image"])
            if size:
                item["w"], item["h"] = size
        elif "file" in link:
            item["file"] = media_url(link["file"])
        else:
            item["ext"] = link["ext"]
        return item

    def finish_fig(self):
        if not self.fig:
            return
        fig, cap = self.fig, self.cap
        self.fig, self.cap = None, []
        cap_html = self.inline(cap) if cap else ""
        cap_text = plain(cap_html)
        small = cap and all(t.ctx.small for t in cap if t.kind == "text" and t.text.strip())
        if cap_text and (len(cap_text) <= 260 or small and len(cap_text) <= 600):
            if not (len(cap_text) < 90 and INSTRUCTION_RE.match(cap_text)):
                fig["c"] = cap_html
        elif cap_text:
            self.blocks.append({"t": "fig", "f": fig})
            self.para = cap
            self.flush_para()
            return
        self.blocks.append({"t": "fig", "f": fig})

    def add_img(self, info):
        name = info["name"]
        w, h = info["aw"] or info["w"], info["ah"] or info["h"]
        rw, rh = info["w"] or w, info["h"] or h
        link = info["link"]
        tiny = (w and h and (w <= 48 or h <= 32)) or (rw and rh and rw * rh < 2500)
        is_decor = bool(DECOR_RE.search(name))
        # Förstoringsglas / liten ikon som länkar till en större bild
        if (tiny or "forstoringsglas" in name or "lupp" in name) and link and "image" in link:
            target = self.last_fig()
            if target is not None:
                self.set_full(target, link["image"])
            return
        # Knapp/pil som länkar vidare till en sida -> textlänk
        if link and "route" in link and (is_decor or tiny or (h and h <= 70 and w <= 320)):
            self.finish_fig()
            self.flush_para()
            label = self.page_label_hint(link["route"], info)
            self.blocks.append({"t": "links", "items": [self.link_item(link, label)]})
            return
        if tiny or is_decor:
            return
        # Klickbar karta
        if info["usemap"] and info["usemap"] in self.page.maps:
            self.finish_fig()
            self.flush_para()
            block = self.page_map(info)
            if block:
                self.blocks.append(block)
                return
        self.finish_fig()
        self.flush_para()
        fig = {"s": media_url(info["rel"]), "w": rw, "h": rh}
        self.page.images.append(info["rel"])
        if link:
            if "image" in link:
                self.set_full(fig, link["image"])
            elif "route" in link:
                fig["route"] = link["route"]
                self.page.links.append((link["route"], ""))
            elif "ext" in link:
                fig["ext"] = link["ext"]
        if not fig.get("full") and re.search(r"min\.(jpe?g|gif|png)$", info["rel"], re.I):
            # tumnagel utan länk: försök hitta storbilden
            big = re.sub(r"min(\.(jpe?g|gif|png))$", r"\1", info["rel"], flags=re.I)
            if big.lower() in media_files:
                self.set_full(fig, media_files[big.lower()])
        self.fig = fig
        self.cap = []

    def set_full(self, fig, rel):
        size = image_size(rel)
        if not size:
            return
        fig["s"] = media_url(rel)
        fig["w"], fig["h"] = size
        fig["full"] = True

    def last_fig(self):
        if self.fig:
            return self.fig
        for b in reversed(self.blocks):
            if b["t"] == "fig":
                return b["f"]
            if b["t"] == "gal":
                return b["items"][-1]
            if b["t"] in ("p", "h"):
                return None
        return None

    def page_label_hint(self, route, info):
        alt = info.get("alt", "")
        if alt and not re.search(r"\.(jpe?g|gif|png)$", alt, re.I):
            return alt
        stem = info["name"].rsplit(".", 1)[0]
        if re.search(r"(hoger|fram|nasta|next)", stem):
            return "Nästa sida"
        if re.search(r"(vanster|bak|tillbaka|back|prev)", stem):
            return "Föregående sida"
        return "@" + route   # ersätts med sidans titel i efterbehandlingen

    def page_map(self, info):
        m = self.page.maps[info["usemap"]]
        cw = info["aw"] or info["w"]
        ch = info["ah"] or info["h"]
        if not cw or not ch:
            return None
        areas = []
        seen = set()
        for a in m.find_all("area"):
            href = a.get("href")
            if not href or a.has_attr("nohref"):
                continue
            link = self.page.link_attr(href)
            if not link:
                continue
            try:
                nums = [int(float(x)) for x in re.split(r"[,\s]+", a.get("coords", "").strip()) if x]
            except ValueError:
                continue
            shape = (a.get("shape") or "rect").lower()
            if shape.startswith("circ") and len(nums) >= 3:
                x0, y0, x1, y1 = nums[0] - nums[2], nums[1] - nums[2], nums[0] + nums[2], nums[1] + nums[2]
            elif shape.startswith("poly") and len(nums) >= 6:
                xs, ys = nums[0::2], nums[1::2]
                x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
            elif len(nums) >= 4:
                x0, y0, x1, y1 = nums[:4]
            else:
                continue
            x0, x1 = sorted((max(0, x0), min(cw, x1)))
            y0, y1 = sorted((max(0, y0), min(ch, y1)))
            if x1 - x0 < 2 or y1 - y0 < 2:
                continue
            area = {"x": round(100.0 * x0 / cw, 2), "y": round(100.0 * y0 / ch, 2),
                    "w": round(100.0 * (x1 - x0) / cw, 2), "h": round(100.0 * (y1 - y0) / ch, 2)}
            title = (a.get("title") or a.get("alt") or "").strip()
            if "route" in link:
                area["route"] = link["route"]
                self.page.links.append((link["route"], title))
            elif "image" in link:
                area["image"] = media_url(link["image"])
            else:
                continue
            area["label"] = title
            key = (area.get("route") or area.get("image"), area["x"], area["y"])
            if key in seen:
                continue
            seen.add(key)
            areas.append(area)
        if not areas:
            return None
        self.page.images.append(info["rel"])
        return {"t": "map", "s": media_url(info["rel"]), "w": info["w"] or cw,
                "h": info["h"] or ch, "areas": areas}

    def build(self, toks):
        for t in toks:
            k = t.kind
            if k == "text":
                if self.fig is not None:
                    if t.text.strip() or self.cap:
                        self.cap.append(t)
                else:
                    if t.text.strip() or self.para:
                        self.para.append(t)
                self.brs = 0
            elif k == "br":
                self.brs += 1
                if self.fig is not None:
                    if self.cap and self.brs >= 2:
                        self.finish_fig()
                    elif self.cap:
                        self.cap.append(t)
                elif self.brs >= 2:
                    self.flush_para()
                elif self.para:
                    self.para.append(t)
            elif k == "break":
                self.finish_fig()
                self.flush_para()
            elif k == "img":
                self.add_img(t.img)
            elif k == "blocks":
                self.finish_fig()
                self.flush_para()
                self.blocks.extend(t.img)
        self.finish_fig()
        self.flush_para()
        return self.blocks


def small_caps_lead(html):
    """'INTILL TEGELVIKEN låg ...' -> kapitäler för inledande versaler."""
    m = re.match(r"^(<b>)?([A-ZÅÄÖÉ][A-ZÅÄÖÉ\-]+(?:\s+[A-ZÅÄÖÉ][A-ZÅÄÖÉ\-]+)+)(?=[\s,.:;]|</b>)", html)
    if not m or len(m.group(2)) < 6:
        return html
    return html[:m.start(2)] + '<span class="caps">%s</span>' % m.group(2) + html[m.end(2):]


def strip_tags_keep_links(html):
    html = re.sub(r"</?(b|i)>", "", html)
    return html.strip()


# --------------------------------------------------------------------------
# Efterbehandling av block
# --------------------------------------------------------------------------

def finish(blocks):
    out = []
    for b in blocks:
        t = b["t"]
        if t == "spread":
            b["text"] = finish(b["text"])
            if not b["media"]:
                out.extend(b["text"])
                continue
            if not b["text"]:
                out.append({"t": "gal", "items": b["media"]} if len(b["media"]) > 1
                           else {"t": "fig", "f": b["media"][0]})
                continue
        if t == "links" and out and out[-1]["t"] == "links":
            out[-1]["items"].extend(b["items"])
            continue
        if t == "fig" and out and out[-1]["t"] == "fig":
            prev = out.pop()
            out.append({"t": "gal", "items": [prev["f"], b["f"]]})
            continue
        if t == "fig" and out and out[-1]["t"] == "gal":
            out[-1]["items"].append(b["f"])
            continue
        if t == "gal" and out and out[-1]["t"] in ("gal", "fig"):
            prev = out.pop()
            items = prev["items"] if prev["t"] == "gal" else [prev["f"]]
            out.append({"t": "gal", "items": items + b["items"]})
            continue
        if t == "p" and out and out[-1]["t"] == "p" and out[-1]["h"].endswith(("-", "–")):
            out[-1]["h"] += " " + b["h"]
            continue
        out.append(b)
    # Dubblettfigurer (samma bild två gånger direkt efter varandra)
    for b in out:
        if b["t"] == "gal":
            seen, items = set(), []
            for f in b["items"]:
                if f["s"] in seen:
                    continue
                seen.add(f["s"])
                items.append(f)
            b["items"] = items
    res = []
    for b in out:
        if b["t"] == "gal" and len(b["items"]) == 1:
            res.append({"t": "fig", "f": b["items"][0]})
        elif b["t"] == "links":
            seen, items = set(), []
            for it in b["items"]:
                key = it.get("route") or it.get("image") or it.get("file") or it.get("ext")
                if key in seen:
                    continue
                seen.add(key)
                items.append(it)
            b["items"] = items
            res.append(b)
        else:
            res.append(b)
    return res


def walk_blocks(blocks):
    for b in blocks:
        yield b
        if b["t"] == "spread":
            for x in walk_blocks(b["text"]):
                yield x


# --------------------------------------------------------------------------
# Huvudprogram
# --------------------------------------------------------------------------

folders = sorted({p.split("/", 1)[0] for p in src_pages if "/" in p})
folders_main = {}
for f in folders:
    cand = [MAIN_PAGE.get(f), f]
    main = None
    for c in cand:
        if c and "%s/%s" % (f, c) in src_pages:
            main = "%s/%s" % (f, c)
            break
    if not main:
        pages = sorted((p for p in src_pages if p.startswith(f + "/")), key=len)
        main = pages[0] if pages else None
    if main:
        folders_main[f] = main


def main():
    pages = {}
    incoming = defaultdict(list)   # pid -> [(från, etikett)]
    for pid in sorted(src_pages):
        if "/" not in pid:
            continue   # rotsidor (gamla startsidan) används inte
        parser = PageParser(pid, read_html(src_pages[pid]))
        blocks = parser.parse()
        pages[pid] = {"blocks": blocks, "bg": parser.bg, "images": parser.images,
                      "links": parser.links}
        for target, label in parser.links:
            incoming[target].append((pid, label))

    # ---- titlar ----
    def heading_title(blocks):
        seen_p = 0
        for b in list(walk_blocks(blocks))[:8]:
            if b["t"] == "h":
                t = tidy_title(b["h"])
                if 3 <= len(t) <= 70 and not re.fullmatch(r"[\d\s.,–-]+", t) and \
                        not t.endswith("!") and not t.startswith(("(", "Följande", "Läs ")):
                    return t, b
            if b["t"] == "p":
                seen_p += 1
                if seen_p >= 2:
                    break
        return None, None

    def remove_block(blocks, target):
        for i, b in enumerate(blocks):
            if b is target:
                blocks.pop(i)
                return True
            if b["t"] == "spread" and remove_block(b["text"], target):
                return True
        return False

    def street_base(folder):
        name = NAMES.get(folder, "")
        base = re.split(r"[,(]| öst| väst| norr| söder", name)[0].strip()
        if re.search(r"(gatan|gata|gränd|vägen|backe|torget)$", base):
            return base
        return None

    def number_title(folder, stem):
        base = street_base(folder)
        m = re.fullmatch(r"[a-zåäö]*?(\d+[a-z]?(?:_\d+[a-z]?)*)[a-z]?", stem)
        if not base or not m:
            return None
        nums = [re.sub(r"[a-z]$", "", n) for n in m.group(1).split("_")]
        if any(len(n) > 3 for n in nums):
            return None
        if len(nums) > 1 and int(nums[-1]) < int(nums[0]) and int(nums[-1]) < 10:
            nums = nums[:1]
        if len(nums) > 1:
            return "%s %s–%s" % (base, nums[0], nums[-1])
        return "%s %s" % (base, nums[0])

    def source_title(blocks):
        for b in list(walk_blocks(blocks))[:4]:
            if b["t"] == "src":
                t = re.sub(r"^ur\s+", "", plain(b["h"]), flags=re.I)
                t = re.split(r",\s|\s–\s|\s-\s", t)[0].strip(" .:»«\"")
                if 3 <= len(t) <= 60 and fold(t) != "wikipedia":
                    return t[:1].upper() + t[1:]
        return None

    def lead_title(blocks):
        for b in list(walk_blocks(blocks))[:3]:
            if b["t"] == "p":
                m = re.match(r"<b>([^<]{4,50})</b>", b["h"])
                if m:
                    t = norm_ws(m.group(1)).strip(" ,.:")
                    if not t.isupper():
                        return t
                return None
        return None

    def caption_title(blocks):
        for b in walk_blocks(blocks):
            for f in figures_of([b]):
                c = plain(f.get("c", ""))
                if not c:
                    continue
                c = re.split(r"(?<=[a-zåäö0-9])\.\s|\s\(|:\s", c)[0].strip(" .")
                if 4 <= len(c) <= 60 and not re.fullmatch(r"(nutid|idag|i dag)?\s*[\d\s.,–-]*(talet)?", c, re.I):
                    return c
                return None
            if b["t"] == "p":
                return None
        return None

    for pid, page in pages.items():
        folder, stem = pid.split("/", 1)
        title, hblock = heading_title(page["blocks"])
        is_main = folders_main.get(folder) == pid
        label = None
        for src, lab in incoming.get(pid, []):
            lab = tidy_title(lab)
            if lab and 2 < len(lab) <= 70 and not lab.startswith("@") and \
                    not re.fullmatch(r"(nästa.*|föregående.*|tillbaka.*|hit|här|klicka.*|större.*|mer.*|\d+)", lab, re.I):
                label = lab
                break
        place = NAMES.get(folder, folder.capitalize())
        if is_main:
            final = place
            if title and fold(title).startswith(fold(final)[:6]):
                remove_block(page["blocks"], hblock)
        elif title:
            final = title
            remove_block(page["blocks"], hblock)
        else:
            final = (label or number_title(folder, stem) or source_title(page["blocks"])
                     or lead_title(page["blocks"])
                     or caption_title(page["blocks"]))
            if not final:
                figs = sum(len(figures_of([b])) for b in page["blocks"])
                final = place + (" i bilder" if figs and not text_len(page["blocks"]) else " – fortsättning")
        page["title"] = final
        page["is_main"] = is_main

    # Ersätt platshållare '@route' i länketiketter med sidans titel
    def fix_labels(blocks):
        for b in walk_blocks(blocks):
            if b["t"] == "links":
                for it in b["items"]:
                    if it["label"].startswith("@"):
                        r = it.get("route")
                        it["label"] = pages[r]["title"] if r in pages else "Läs mer"
            elif b["t"] == "map":
                for a in b["areas"]:
                    if not a.get("label") and a.get("route") in pages:
                        a["label"] = pages[a["route"]]["title"]
    for page in pages.values():
        fix_labels(page["blocks"])

    # ---- utdrag ----
    def excerpt(blocks, n=170):
        for b in walk_blocks(blocks):
            if b["t"] != "p":
                continue
            t = plain(b["h"])
            linked = sum(len(plain(m)) for m in re.findall(r"<a [^>]*>(.*?)</a>", b["h"]))
            if len(t) < 80 or linked > 0.3 * len(t) or not re.search(r"[a-zåäö]{3}[.!?]( |$)", t):
                continue
            if len(t) > n:
                t = t[:n].rsplit(" ", 1)[0].rstrip(",;:–- ") + " …"
            m = re.match(r"((?:[A-ZÅÄÖÉ][A-ZÅÄÖÉ\-]+\s+)+)", t)
            if m:
                lead = m.group(1).lower()
                t = lead[:1].upper() + lead[1:] + t[len(lead):]
            return t
        return ""

    # ---- sökord: underrubriker och fetade namn ----
    def keywords(blocks, limit=500):
        words, seen = [], set()
        for b in walk_blocks(blocks):
            found = []
            if b["t"] == "h":
                found.append(b["h"])
            elif b["t"] in ("p", "note"):
                found.extend(plain(m) for m in re.findall(r"<b>(.*?)</b>", b["h"]))
            for w in found:
                w = norm_ws(w).strip(" ,.:;()-–")
                key = fold(w)
                if 3 <= len(w) <= 50 and key not in seen:
                    seen.add(key)
                    words.append(w)
        out = " · ".join(words)
        return out[:limit].rsplit(" · ", 1)[0] if len(out) > limit else out

    # ---- sidordning inom mapp (BFS från startsidan) ----
    order = {}
    for f, mainpid in folders_main.items():
        seq, queue, seen = [], [mainpid], {mainpid}
        while queue:
            p = queue.pop(0)
            seq.append(p)
            for target, _ in pages.get(p, {}).get("links", []):
                if target.startswith(f + "/") and target not in seen and target in pages:
                    seen.add(target)
                    queue.append(target)
        rest = sorted(p for p in pages if p.startswith(f + "/") and p not in seen)
        order[f] = seq + rest

    # ---- kortbild per plats ----
    def card_image(f):
        best, best_score = None, -1e9
        for rank, pid in enumerate(order[f][:8]):
            page = pages[pid]
            cands = []
            if page["bg"]:
                cands.append((page["bg"]["s"][len(MEDIA_DIR) + 1:], 60))
            for b in walk_blocks(page["blocks"]):
                for fig in figures_of([b]):
                    cands.append((fig["s"][len(MEDIA_DIR) + 1:], 0))
            for i, (rel, bonus) in enumerate(cands):
                size = image_size(rel)
                if not size:
                    continue
                w, h = size
                name = rel.rsplit("/", 1)[-1].lower()
                ar = w / float(h)
                score = min(w, 1400) / 20.0 + bonus - rank * 8 - i * 1.5
                if 1.2 <= ar <= 1.9:
                    score += 30
                elif ar < 0.9 or ar > 2.6:
                    score -= 40
                if re.search(r"karta|map|txt|text|rubr|namn|plan|ritning|tomt", name):
                    score -= 45
                if w < 380:
                    score -= 60
                if score > best_score:
                    best, best_score = (rel, w, h), score
        if not best:
            return None
        card = {"s": media_url(best[0]), "w": best[1], "h": best[2]}
        if best[0] in HERO_BACKGROUNDS:
            card["crop"] = HERO_BACKGROUNDS[best[0]]
        return card

    def card_override(rel):
        size = image_size(rel)
        return {"s": media_url(rel), "w": size[0], "h": size[1]} if size else None

    OVERRIDE_CARD = {k: card_override(v) for k, v in {
        "slussen": "slussen/ericsons_sluss_1895.jpg",
        "fjallgatan": "fjallgatan/fjgsodrasidan.jpg",
    }.items()}

    # ---- skriv platsfiler ----
    OUT.mkdir(exist_ok=True)
    (OUT / "places").mkdir(exist_ok=True)
    for old in (OUT / "places").glob("*.js"):
        old.unlink()

    cat_of = {}
    for cat, ids in CATEGORY_OF.items():
        for i in ids:
            cat_of[i] = cat

    page_index = OrderedDict()
    places = []
    total_imgs = 0
    for f in folders:
        if f not in folders_main:
            continue
        bundle = OrderedDict()
        n_imgs = 0
        for pid in order[f]:
            page = pages[pid]
            imgs = len(set(page["images"]))
            n_imgs += imgs
            entry = OrderedDict([("title", page["title"]), ("blocks", page["blocks"])])
            if page["bg"]:
                entry["hero"] = page["bg"]
            bundle[pid] = entry
            thumb = page["bg"]["s"] if page["bg"] else ""
            if not thumb:
                for b in walk_blocks(page["blocks"]):
                    if b["t"] == "map":
                        thumb = b["s"]
                        break
                    figs = [x for x in figures_of([b]) if x["w"] >= 200 and x["h"] >= 120]
                    if figs:
                        thumb = figs[0]["s"]
                        break
            page_index[pid] = [page["title"], excerpt(page["blocks"], 140),
                               thumb[len(MEDIA_DIR) + 1:] if thumb else "",
                               keywords(page["blocks"])]
        total_imgs += n_imgs
        js = "SODER.addPlace(%s, %s);\n" % (
            json.dumps(f), json.dumps(bundle, ensure_ascii=False, separators=(",", ":")))
        (OUT / "places" / (f + ".js")).write_text(js, encoding="utf-8")
        card = OVERRIDE_CARD.get(f) or card_image(f)
        places.append(OrderedDict([
            ("id", f),
            ("name", NAMES.get(f, f.capitalize())),
            ("cat", cat_of.get(f, "gator")),
            ("main", folders_main[f]),
            ("pages", order[f]),
            ("img", card),
            ("ex", excerpt(pages[folders_main[f]]["blocks"]) or
                   next((excerpt(pages[p]["blocks"]) for p in order[f] if excerpt(pages[p]["blocks"])), "")),
            ("n_img", n_imgs),
            ("listed", f not in NOT_PLACES),
        ]))

    places.sort(key=lambda p: fold(p["name"]).replace("a", "a"))
    index = OrderedDict([
        ("categories", CATEGORIES),
        ("featured", FEATURED),
        ("places", places),
        ("pages", page_index),
        ("stats", {"places": sum(1 for p in places if p["listed"]),
                   "pages": len(page_index), "images": total_imgs}),
    ])
    js = "window.SODER_INDEX = %s;\n" % json.dumps(index, ensure_ascii=False, separators=(",", ":"))
    (OUT / "index.js").write_text(js, encoding="utf-8")

    size = sum(p.stat().st_size for p in OUT.rglob("*.js"))
    print("Byggde %d platser, %d sidor, %d bilder (%.1f MB data)." % (
        index["stats"]["places"], len(page_index), total_imgs, size / 1e6))


if __name__ == "__main__":
    sys.setrecursionlimit(10000)
    main()
