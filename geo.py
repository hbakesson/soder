#!/usr/bin/env python3
"""Hämtar kartgeometri för platserna och skriver data/geo.js.

Gatornas verkliga sträckning hämtas från OpenStreetMap (Overpass API), och
enstaka platser utan gatunamn (kyrkor, Slussen, Fåfängan ...) slås upp med
Nominatim. Resultatet är litet och checkas in, så skriptet behöver bara köras
igen när en ny plats läggs till eller kopplingen nedan ändras.

Kör:  python3 geo.py
Data © OpenStreetMaps bidragsgivare (ODbL).
"""

import json
import math
import sys
import time
import subprocess
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "geo.js"
STREETS = ROOT / "source" / "streets.json"   # alla gator, råmaterial för build.py
BBOX = (59.300, 18.010, 59.327, 18.115)   # syd, väst, nord, öst
UA = "sodermalm-i-tid-och-rum/1.0 (https://github.com/hbakesson/soder)"

# Koppling plats -> geometri.
#   street:  ett eller flera gatunamn (hela gatan)
#   side:    (riktning, korsande gata) – bara delen norr/söder/öster/väster om den
#   corner:  (gata, gata) – punkt i korsningen
#   area:    namn på park, holme eller plats i OSM (bara punkt)
#   search:  fritextsökning i Nominatim (bara punkt)
#   nudge:   flytta punkten (lat, lon) så att platser på samma gata inte krockar
GEO = {
    "annalindhagen": {"area": "Anna Lindhagens Täppa"},
    "ansgarieg": {"street": ["Ansgariegatan"]},
    "asoberget": {"street": ["Skeppargränd", "Lotsgatan", "Sågargatan", "Kvastmakarbacken"]},
    "barnangen": {"area": "Barnängsparken"},
    "bastugatan": {"street": ["Bastugatan"]},
    "bellmansgatannorr": {"street": ["Bellmansgatan"], "side": ("n", "Hornsgatan")},
    "bellmansgatanshornsg": {"street": ["Bellmansgatan"], "side": ("s", "Hornsgatan")},
    "bengtekenhjelmsgatan": {"street": ["Bengt Ekehjelmsgatan"]},
    "bergsprangargrand": {"street": ["Bergsprängargränd"]},
    "bjorngardsgatan": {"street": ["Björngårdsgatan"]},
    "blecktornsgrand": {"street": ["Blecktornsgränd"]},
    "bondegatan": {"street": ["Bondegatan"]},
    "brannkyrkagost": {"street": ["Brännkyrkagatan"], "side": ("e", "Torkel Knutssonsgatan")},
    "brannkyrkagvast": {"street": ["Brännkyrkagatan"], "side": ("w", "Torkel Knutssonsgatan")},
    "danviken": {"search": "Danvikshem, Nacka"},
    "ekermanskamalmg": {"area": "Ekermans Gränd"},
    "ersta": {"search": "Ersta sjukhus, Stockholm"},
    "fafangan": {"search": "Fåfängan, Stockholm"},
    "fargargavljus": {"area": "Färgargårdstorget"},
    "fatburen": {"area": "Fatbursparken"},
    "fiskarroddargatan": {"street": ["Fiskargatan", "Roddargatan"]},
    "fjallgatan": {"street": ["Fjällgatan"]},
    "fjallgatannorr": {"street": ["Fjällgatan"], "lines": False, "nudge": (0.00035, 0.0)},
    "fjallgatansoder": {"street": ["Fjällgatan"], "lines": False, "nudge": (-0.00035, 0.0)},
    "folkungagatan": {"street": ["Folkungagatan"]},
    "fredmansgatan": {"street": ["Fredmansgatan"]},
    "glasbruksgatan": {"street": ["Glasbruksgatan"]},
    "gotgatan": {"street": ["Götgatan"]},
    "heleneborg": {"street": ["Heleneborgsgatan"]},
    "hogalid": {"search": "Högalidskyrkan, Stockholm", "fallback": "Högalidsparken"},
    "hogbergsgost": {"street": ["Högbergsgatan"], "side": ("e", "Götgatan")},
    "hogbergsgvast": {"street": ["Högbergsgatan"], "side": ("w", "Götgatan")},
    "hornsgatan": {"street": ["Hornsgatan"], "side": ("e", "Torkel Knutssonsgatan")},
    "hornsgatanostsoder": {"search": "Maria Magdalena kyrka, Stockholm"},
    "katarina": {"search": "Katarina kyrka, Stockholm"},
    "katarinanordvast": {"area": "Mosebacke Torg"},
    "kocksgatan": {"street": ["Kocksgatan"]},
    "kristallen": {"corner": ("Skånegatan", "Klippgatan")},
    "krukmakargatan": {"street": ["Krukmakargatan"]},
    "kvarngatan": {"street": ["Kvarngatan"]},
    "langholmen": {"area": "Långholmen"},
    "liljeholmensstearin": {"search": "Liljeholmens stearinfabrik, Stockholm", "fallback": "Liljeholmen"},
    "lillaersta": {"street": ["Lilla Erstagatan"]},
    "lillaskinnarviksgrand": {"street": ["Lilla Skinnarviksgränd"]},
    "malmgardsvagen": {"street": ["Malmgårdsvägen"]},
    "mariaberget": {"area": "Mariaberget"},
    "mariatrappgrand": {"street": ["Maria Trappgränd"]},
    "mastermikael": {"street": ["Mäster Mikaels Gata"]},
    "masterparsgrand": {"street": ["Mäster Pers Gränd"]},
    "mejtens": {"street": ["Stora Mejtens Gränd", "Lilla Mejtens Gränd"]},
    "nytorget": {"area": "Nytorget"},
    "nytorgsgatan": {"street": ["Nytorgsgatan"]},
    "ostgotagatan": {"street": ["Östgötagatan"]},
    "prastgardsgatan": {"street": ["Maria Prästgårdsgata"]},
    "pryssgrand": {"street": ["Pryssgränd"]},
    "pustegrand": {"street": ["Pustegränd"]},
    "ragvaldsgatan": {"street": ["Ragvaldsgatan"]},
    "reimersholme": {"area": "Reimersholme"},
    "renstjernasgatan": {"street": ["Renstiernas Gata"]},
    "rosenlund": {"area": "Rosenlundsparken"},
    "sickla": {"search": "Sickla, Nacka"},
    "sistastyv": {"street": ["Sista Styverns Trappor"]},
    "skanegatanostnytgt": {"street": ["Skånegatan"], "side": ("e", "Nytorget")},
    "skaraborgsgatan": {"street": ["Skaraborgsgatan"]},
    "skinnarviksberget": {"area": "Skinnarviksparken"},
    "slussen": {"search": "Slussen, Stockholm"},
    "sodermannagatan": {"street": ["Södermannagatan"]},
    "stadsgarden": {"street": ["Stadsgårdsleden"], "side": ("w", "Renstiernas Gata")},
    "stigberget": {"area": "Stigbergsparken"},
    "stigbergsgatan": {"street": ["Stigbergsgatan"]},
    "stpaulsgatan": {"street": ["Sankt Paulsgatan"]},
    "swedenborgsgatan": {"street": ["Swedenborgsgatan"]},
    "tanto": {"area": "Tantolunden"},
    "tavastgatan": {"street": ["Tavastgatan"]},
    "tegelviken": {"area": "Tegelviksplan"},
    "timmermansgatan": {"street": ["Timmermansgatan"]},
    "tjarhovsgatan": {"street": ["Tjärhovsgatan"], "side": ("e", "Renstiernas Gata")},
    "tjarhovsgmellgotgrenstj": {"street": ["Tjärhovsgatan"], "side": ("e", "Götgatan"),
                                "side2": ("w", "Renstiernas Gata")},
    "torkelknutssonsgatan": {"street": ["Torkel Knutssonsgatan"]},
    "vastgotagatan": {"street": ["Västgötagatan"]},
    "vitabergen": {"search": "Vitabergsparken, Stockholm"},
    "wollmaryxkullsgatan": {"street": ["Wollmar Yxkullsgatan"]},
}


def http_json(url, data=None):
    # curl i stället för urllib: macOS inbyggda python har för gammal TLS
    cmd = ["curl", "-sS", "--fail", "-m", "180", "-A", UA, url]
    if data is not None:
        cmd[1:1] = ["--data-binary", "@-"]
    for attempt in range(4):
        res = subprocess.run(cmd, input=data, capture_output=True)
        if res.returncode == 0:
            return json.loads(res.stdout.decode("utf-8"))
        wait = 15 * (attempt + 1)
        print("  Servern svarade inte (%s), försöker igen om %d s …" % (res.stderr.decode().strip(), wait))
        time.sleep(wait)
    raise SystemExit("Kunde inte hämta %s" % url)


def fetch_osm():
    s, w, n, e = BBOX
    bb = "(%s,%s,%s,%s)" % (s, w, n, e)
    q = ("[out:json][timeout:90];(way[highway][name]%s;way[name][leisure]%s;"
         "way[name][place]%s;relation[name][place]%s;way[name][natural]%s;);out geom;") % ((bb,) * 5)
    return http_json("https://overpass-api.de/api/interpreter",
                     urllib.parse.urlencode({"data": q}).encode())


def nominatim(query):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1, "countrycodes": "se"})
    time.sleep(1.1)   # Nominatims användarvillkor: högst ett anrop per sekund
    res = http_json(url)
    if res:
        return float(res[0]["lat"]), float(res[0]["lon"])
    return None


def element_lines(el):
    if "geometry" in el:
        return [[(p["lat"], p["lon"]) for p in el["geometry"]]]
    lines = []
    for m in el.get("members", []):
        if "geometry" in m:
            lines.append([(p["lat"], p["lon"]) for p in m["geometry"]])
    return lines


def dist2(a, b):
    dy = a[0] - b[0]
    dx = (a[1] - b[1]) * math.cos(math.radians(a[0]))
    return dx * dx + dy * dy


def nearest_pair(la, lb):
    best = None
    for line in la:
        for p in line:
            for other in lb:
                for q in other:
                    d = dist2(p, q)
                    if best is None or d < best[0]:
                        best = (d, p, q)
    return best


def clip(lines, direction, ref):
    """Behåll delar av linjerna på angiven sida om referenspunkten."""
    idx, sign = {"n": (0, 1), "s": (0, -1), "e": (1, 1), "w": (1, -1)}[direction]
    keep = lambda p: (p[idx] - ref[idx]) * sign > -0.00002
    out = []
    for line in lines:
        run = []
        for p in line:
            if keep(p):
                run.append(p)
            else:
                if len(run) > 1:
                    out.append(run)
                run = []
        if len(run) > 1:
            out.append(run)
    return out


def simplify(line, tol=0.00004):
    """Douglas–Peucker, tolerans ca 4 m."""
    if len(line) < 3:
        return line
    a, b = line[0], line[-1]
    best_i, best_d = 0, -1
    for i in range(1, len(line) - 1):
        p = line[i]
        # avstånd från p till linjen a-b (platt approximation)
        ax, ay, bx, by, px, py = a[1], a[0], b[1], b[0], p[1], p[0]
        dx, dy = bx - ax, by - ay
        if dx == dy == 0:
            d = math.hypot(px - ax, py - ay)
        else:
            t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
            d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
        if d > best_d:
            best_i, best_d = i, d
    if best_d <= tol:
        return [a, b]
    return simplify(line[:best_i + 1], tol)[:-1] + simplify(line[best_i:], tol)


def centroid(lines):
    pts = [p for line in lines for p in line]
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def on_line_marker(lines):
    c = centroid(lines)
    return min((p for line in lines for p in line), key=lambda p: dist2(p, c))


def main():
    print("Hämtar gator från OpenStreetMap …")
    osm = fetch_osm()
    by_name = {}
    for el in osm["elements"]:
        by_name.setdefault(el["tags"]["name"].lower(), []).append(el)

    def lines_for(name, highways_only=True):
        out = []
        for el in by_name.get(name.lower(), []):
            if highways_only and "highway" not in el["tags"]:
                continue
            out.extend(element_lines(el))
        return out

    places = {}
    missing = []
    for pid, spec in GEO.items():
        lines, point = [], None
        if "street" in spec:
            for name in spec["street"]:
                lines.extend(lines_for(name))
            if not lines:
                missing.append((pid, spec["street"]))
                continue
            for key in ("side", "side2"):
                if key in spec:
                    direction, cross = spec[key]
                    cross_lines = lines_for(cross, highways_only=False)
                    pair = nearest_pair(lines, cross_lines)
                    if pair:
                        lines = clip(lines, direction, pair[2])
            point = on_line_marker(lines)
        elif "corner" in spec:
            a, b = spec["corner"]
            pair = nearest_pair(lines_for(a), lines_for(b))
            if pair:
                point = ((pair[1][0] + pair[2][0]) / 2, (pair[1][1] + pair[2][1]) / 2)
        elif "area" in spec:
            geom = lines_for(spec["area"], highways_only=False)
            if geom:
                point = centroid(geom)
        elif "search" in spec:
            point = nominatim(spec["search"])
            if not point and spec.get("fallback"):
                geom = lines_for(spec["fallback"], highways_only=False)
                point = centroid(geom) if geom else nominatim(spec["fallback"] + ", Stockholm")
        if not point:
            missing.append((pid, spec))
            continue
        if "nudge" in spec:
            point = (point[0] + spec["nudge"][0], point[1] + spec["nudge"][1])
        entry = {"p": [round(point[0], 5), round(point[1], 5)]}
        terms = list(spec.get("street", []))
        if "area" in spec:
            terms.append(spec["area"])
        if terms:
            entry["t"] = terms
        if lines and spec.get("lines", True):
            entry["l"] = [[[round(p[0], 5), round(p[1], 5)] for p in simplify(line)] for line in lines]
        places[pid] = entry

    js = ("/* Kartdata, genererad av geo.py. Geometri © OpenStreetMaps bidragsgivare (ODbL). */\n"
          "window.SODER_GEO = %s;\n" % json.dumps(places, ensure_ascii=False, separators=(",", ":")))
    OUT.write_text(js, encoding="utf-8")
    print("Skrev %s: %d platser (%.0f kB)." % (OUT.relative_to(ROOT), len(places), len(js) / 1000))
    for pid, spec in missing:
        print("  Saknas:", pid, spec, file=sys.stderr)

    # Alla namngivna gator, för klickbara gator och registret över omnämnanden.
    # build.py väljer ut de gator som faktiskt nämns i texterna.
    streets = {}
    for el in osm["elements"]:
        tags = el["tags"]
        if "highway" not in tags or tags.get("highway") in ("motorway", "motorway_link", "trunk_link", "proposed", "construction"):
            continue
        for line in element_lines(el):
            if len(line) > 1:
                streets.setdefault(tags["name"], []).append(
                    [[round(p[0], 5), round(p[1], 5)] for p in simplify(line)])
    STREETS.write_text(json.dumps(streets, ensure_ascii=False, separators=(",", ":"), sort_keys=True),
                       encoding="utf-8")
    print("Skrev %s: %d gator." % (STREETS.relative_to(ROOT), len(streets)))


if __name__ == "__main__":
    main()
