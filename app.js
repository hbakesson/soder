/* Södermalm i tid och rum — klientapp
   Hash-routing (#/plats/sida), lata innehållspaket per plats, sök och bildvisning.
   Fungerar både via webbserver och direkt från filsystemet (file://). */

(function () {
    'use strict';

    var IDX = window.SODER_INDEX;
    var main = document.getElementById('main');
    if (!IDX) {
        main.innerHTML = '<div class="wrap"><p class="empty-state">Kunde inte läsa in innehållet.<small>Kör <code>python3 build.py</code> för att skapa data/index.js.</small></p></div>';
        return;
    }

    var places = IDX.places;
    var placeById = {};
    places.forEach(function (p) { placeById[p.id] = p; });
    var pageMeta = IDX.pages;           // pid -> [titel, utdrag, tumnagel]
    var CATS = IDX.categories;
    var MEDIA = 'sodermalm.one/';
    var SITE = 'Södermalm i tid och rum';

    var ICON = {
        chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
        down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
        image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 16l-5-5-8.5 8"/></svg>',
        doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/></svg>',
        ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M17 14v4.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H10"/></svg>',
        pages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h9.5a.5.5 0 0 1 .5.5V18"/><rect x="5" y="7" width="10" height="13" rx="1"/></svg>',
        search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
    };

    /* ------------------------------------------------------------------ */
    /* Hjälpfunktioner                                                      */
    /* ------------------------------------------------------------------ */

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function fold(s) {
        return String(s).toLowerCase()
            .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[éè]/g, 'e').replace(/ü/g, 'u');
    }

    function store(key, val) {
        try {
            if (val === undefined) return window.localStorage.getItem(key);
            if (val === null) window.localStorage.removeItem(key);
            else window.localStorage.setItem(key, val);
        } catch (e) { /* privat läge m.m. */ }
        return null;
    }

    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    function placeOf(pid) { return placeById[pid.split('/')[0]]; }

    function pageTitle(pid) { return pageMeta[pid] ? pageMeta[pid][0] : ''; }

    function thumbOf(pid) {
        var m = pageMeta[pid];
        return m && m[2] ? MEDIA + m[2] : '';
    }

    function img(src, w, h, alt, extra) {
        var dims = w && h ? ' width="' + w + '" height="' + h + '"' : '';
        return '<img src="' + esc(src) + '"' + dims + ' alt="' + esc(alt || '') + '" loading="lazy" decoding="async" class="loading"' + (extra || '') + '>';
    }

    /* Bild med inbyggda marginaler: beskärs via en ram i rätt proportion.
       boxAR = behållarens proportion (täcker den), annars fyller ramen helt. */
    function croppedImg(o, boxAR, alt, extra) {
        var t = o.crop[0] / 100, r = o.crop[1] / 100, b = o.crop[2] / 100, l = o.crop[3] / 100;
        var cw = Math.round(o.w * (1 - l - r)), ch = Math.round(o.h * (1 - t - b));
        var fit = !boxAR ? 'inset:0' : (cw / ch > boxAR
            ? 'height:100%;left:50%;transform:translateX(-50%)'
            : 'width:100%;top:50%;transform:translateY(-50%)');
        return '<div class="crop" style="position:absolute;aspect-ratio:' + cw + '/' + ch + ';' + fit + ';overflow:hidden">' +
            '<img src="' + esc(o.s) + '" alt="' + esc(alt || '') + '" decoding="async"' + (extra || '') +
            ' style="position:absolute;max-width:none;max-height:none;object-fit:fill;width:' + (100 / (1 - l - r)).toFixed(3) + '%;height:' + (100 / (1 - t - b)).toFixed(3) +
            '%;left:' + (-l / (1 - l - r) * 100).toFixed(3) + '%;top:' + (-t / (1 - t - b) * 100).toFixed(3) + '%"></div>';
    }

    /* ------------------------------------------------------------------ */
    /* Lata innehållspaket                                                  */
    /* ------------------------------------------------------------------ */

    var bundles = {};
    var waiting = {};

    window.SODER = {
        addPlace: function (id, data) {
            bundles[id] = data;
            if (waiting[id]) waiting[id].resolve(data);
        }
    };

    function loadPlace(id) {
        if (bundles[id]) return Promise.resolve(bundles[id]);
        if (!waiting[id]) {
            var entry = {};
            entry.promise = new Promise(function (resolve, reject) {
                entry.resolve = resolve;
                var s = document.createElement('script');
                s.src = 'data/places/' + id + '.js';
                s.async = true;
                s.onerror = function () { delete waiting[id]; reject(new Error('Kunde inte ladda ' + id)); };
                document.head.appendChild(s);
            });
            waiting[id] = entry;
        }
        return waiting[id].promise;
    }

    function prefetch(e) {
        var a = e.target.closest && e.target.closest('a[href^="#/"]');
        if (!a) return;
        var id = a.getAttribute('href').slice(2).split('/')[0];
        if (placeById[id] && !bundles[id]) loadPlace(id).catch(function () { });
    }
    document.addEventListener('pointerenter', prefetch, true);
    document.addEventListener('touchstart', prefetch, { passive: true, capture: true });

    /* Bilder tonas in när de laddats; trasiga bilder döljs */
    document.addEventListener('load', function (e) {
        if (e.target.tagName === 'IMG') e.target.classList.remove('loading');
    }, true);
    document.addEventListener('error', function (e) {
        var t = e.target;
        if (t.tagName !== 'IMG') return;
        var fig = t.closest('.fig, .gal-item, .spread-media .item');
        if (fig) fig.remove();
        else if (t.closest('.card-media, .thumb, .sr-thumb, .teaser-media')) {
            t.parentNode.classList.add('empty');
            t.remove();
        }
    }, true);

    /* ------------------------------------------------------------------ */
    /* Router                                                               */
    /* ------------------------------------------------------------------ */

    var scrollMemory = {};
    var linkNavigation = false;
    var currentHash = null;

    function parseRoute() {
        var h = location.hash.replace(/^#\/?/, '');
        try { h = decodeURIComponent(h); } catch (e) { }
        h = h.split('?')[0].replace(/\/+$/, '');
        if (!h) return { view: 'home' };
        if (h === 'om') return { view: 'about' };
        var parts = h.split('/');
        var place = placeById[parts[0]];
        if (!place) return { view: 'notfound' };
        var pid = parts.length > 1 ? h : place.main;
        if (!pageMeta[pid]) return { view: 'notfound' };
        return { view: 'page', place: place, pid: pid };
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#/"]');
        if (a && !e.metaKey && !e.ctrlKey) linkNavigation = true;
    }, true);

    function route() {
        if (currentHash !== null) scrollMemory[currentHash] = window.scrollY;
        var restore = !linkNavigation && scrollMemory[location.hash] != null ? scrollMemory[location.hash] : null;
        linkNavigation = false;
        currentHash = location.hash;
        closeMenu();
        closeSearch(true);

        var r = parseRoute();
        setActiveNav(r);
        var done = function () {
            window.scrollTo(0, restore || 0);
            if (restore == null) main.focus({ preventScroll: true });
        };
        if (r.view === 'home') { renderHome(); done(); }
        else if (r.view === 'about') { renderAbout(); done(); }
        else if (r.view === 'page') {
            if (!bundles[r.place.id]) main.innerHTML = '<div class="boot"><div class="spinner"></div></div>';
            loadPlace(r.place.id).then(function () {
                if (location.hash !== currentHash) return;
                renderPage(r.place, r.pid);
                done();
            }).catch(function () {
                main.innerHTML = '<div class="wrap view"><p class="empty-state">Sidan kunde inte laddas.<small>Kontrollera anslutningen och försök igen.</small></p></div>';
            });
        } else { renderNotFound(); done(); }
    }

    function setActiveNav(r) {
        var key = r.view === 'home' ? 'home' : r.view === 'about' ? 'om' : r.place ? r.place.id : '';
        document.querySelectorAll('.topnav a').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-nav') === key);
        });
    }

    /* ------------------------------------------------------------------ */
    /* Startsida                                                            */
    /* ------------------------------------------------------------------ */

    var listed = places.filter(function (p) { return p.listed; });
    var activeCat = store('soder.cat') || 'alla';
    if (activeCat !== 'alla' && !CATS[activeCat]) activeCat = 'alla';

    function placeCard(p, opts) {
        opts = opts || {};
        var media = p.img
            ? '<div class="card-media">' + (p.img.crop ? croppedImg(p.img, 4 / 3, '') : img(p.img.s, p.img.w, p.img.h, '')) + '</div>'
            : '<div class="card-media empty">' + ICON.image + '</div>';
        var n = p.pages.length;
        return '<a class="card" href="#/' + p.id + '">' + media +
            '<div class="card-body">' +
            '<span class="card-kicker">' + esc(CATS[p.cat] || '') + '</span>' +
            '<h3 class="card-title">' + esc(p.name) + '</h3>' +
            (opts.text !== false && p.ex ? '<p class="card-text">' + esc(p.ex) + '</p>' : '') +
            '<span class="card-meta"><span>' + plural(n, 'sida', 'sidor') + '</span><span>' + plural(p.n_img, 'bild', 'bilder') + '</span></span>' +
            '</div></a>';
    }

    function renderHome() {
        document.title = SITE;
        var st = IDX.stats;
        var featured = IDX.featured.map(function (id) { return placeById[id]; }).filter(Boolean);
        var hist = placeById.historia;
        var histPages = hist ? hist.pages.slice(1, 6) : [];

        var chips = '<button class="chip" type="button" data-cat="alla" aria-pressed="' + (activeCat === 'alla') + '">Alla<span class="n">' + listed.length + '</span></button>';
        Object.keys(CATS).forEach(function (k) {
            var n = listed.filter(function (p) { return p.cat === k; }).length;
            if (n) chips += '<button class="chip" type="button" data-cat="' + k + '" aria-pressed="' + (activeCat === k) + '">' + esc(CATS[k]) + '<span class="n">' + n + '</span></button>';
        });

        main.innerHTML =
            '<div class="view">' +
            '<section class="hero"><div class="wrap hero-grid">' +
            '<div class="hero-copy">' +
            '<p class="eyebrow">Stockholm · 1600-tal till i dag</p>' +
            '<h1>Södermalm<br><em>i tid och rum</em></h1>' +
            '<p class="hero-lede">Gator, gränder, berg och människor. En vandring genom Södermalms historia i text och bild, sammanställd av Bengt-Göran Jönsson.</p>' +
            '<button class="hero-search" type="button" data-action="search">' + ICON.search + '<span>Sök gata, plats eller person</span><span class="kbd">⌘K</span></button>' +
            '<ul class="hero-stats">' +
            '<li><b>' + st.places + '</b><span>platser</span></li>' +
            '<li><b>' + st.pages + '</b><span>sidor</span></li>' +
            '<li><b>' + Math.floor(st.images / 100) * 100 + '+</b><span>bilder</span></li>' +
            '</ul></div>' +
            '<figure class="hero-figure"><div class="frame">' +
            '<img src="' + MEDIA + 'slussen/stockholm_panorama_1868.jpg" width="1213" height="815" alt="Färglagt panorama över Stockholm i fågelperspektiv, 1868" fetchpriority="high">' +
            '</div><figcaption>Stockholm i fågelperspektiv, 1868</figcaption></figure>' +
            '</div></section>' +

            '<section class="home-section"><div class="wrap">' +
            '<div class="section-head"><h2 class="section-title">Börja här</h2></div>' +
            '<div class="featured">' + featured.map(function (p) { return placeCard(p); }).join('') + '</div>' +
            '</div></section>' +

            '<section class="home-section" id="platser"><div class="wrap">' +
            '<div class="section-head"><h2 class="section-title">Alla platser</h2><p class="section-meta" id="placeCount"></p></div>' +
            '<div class="filters" role="toolbar" aria-label="Filtrera platser">' + chips + '</div>' +
            '<div class="grid" id="placeGrid"></div>' +
            '</div></section>' +

            (hist ? '<section class="home-section"><div class="wrap">' +
                '<div class="teaser">' +
                '<div class="teaser-media"><img src="' + MEDIA + 'katarinanordvast/mosebackepanorama_1842.jpg" alt="Utsikt från Mosebacke över Stockholm, 1842" loading="lazy"></div>' +
                '<div class="teaser-body">' +
                '<p class="eyebrow">Fördjupning</p>' +
                '<h2>Södermalms historia</h2>' +
                '<p>Från landisens avsmältning och Åsöns första bebyggelse till stormaktstidens stadsplan, häxprocesserna och pesten.</p>' +
                '<ol class="chapter-list">' + histPages.map(function (pid) {
                    return '<li><a href="#/' + pid + '">' + esc(pageTitle(pid)) + '</a></li>';
                }).join('') + '</ol>' +
                '<a class="text-link" href="#/historia">Läs historien ' + ICON.arrow + '</a>' +
                '</div></div></div></section>' : '') +
            '</div>';

        renderGrid();
        main.querySelector('.filters').addEventListener('click', function (e) {
            var b = e.target.closest('.chip');
            if (!b) return;
            activeCat = b.getAttribute('data-cat');
            store('soder.cat', activeCat);
            main.querySelectorAll('.chip').forEach(function (c) {
                c.setAttribute('aria-pressed', c === b);
            });
            renderGrid();
        });
    }

    function renderGrid() {
        var list = listed.filter(function (p) { return activeCat === 'alla' || p.cat === activeCat; });
        document.getElementById('placeGrid').innerHTML = list.map(function (p) { return placeCard(p); }).join('');
        document.getElementById('placeCount').textContent = plural(list.length, 'plats', 'platser');
    }

    /* ------------------------------------------------------------------ */
    /* Artikelsida                                                          */
    /* ------------------------------------------------------------------ */

    var gallery = [];   // bilder på aktuell sida, för bildvisningen

    function addToGallery(f) {
        gallery.push({ s: f.s, w: f.w, h: f.h, c: f.c || '' });
        return gallery.length - 1;
    }

    function figAttrs(f) {
        return ' data-lb="' + addToGallery(f) + '"';
    }

    function figureLink(f) {
        if (f.route && pageMeta[f.route]) {
            return '<a class="fig-link" href="#/' + f.route + '">' + esc(pageTitle(f.route)) + ' ' + ICON.chev + '</a>';
        }
        if (f.ext) return '<a class="fig-link" href="' + esc(f.ext) + '" target="_blank" rel="noopener">Öppna länk ' + ICON.ext + '</a>';
        return '';
    }

    function renderFig(f) {
        var ar = f.w / f.h;
        var cls = 'fig';
        if (f.w >= 860 && ar >= 1.25) cls += ' wide';
        var maxw = Math.round(f.w * 1.25);
        return '<figure class="' + cls + '" style="max-width:min(' + (cls.indexOf('wide') > -1 ? 'var(--wide)' : 'var(--measure)') + ',' + maxw + 'px)">' +
            '<div class="frame">' + img(f.s, f.w, f.h, plainText(f.c), figAttrs(f)) + '</div>' +
            (f.c ? '<figcaption>' + f.c + '</figcaption>' : '') + figureLink(f) +
            '</figure>';
    }

    function renderGal(items) {
        return '<div class="gal">' + items.map(function (f) {
            var ar = (f.w / f.h) || 1.4;
            return '<figure class="gal-item" style="flex:' + (ar * 100).toFixed(1) + ' 1 calc(' + ar.toFixed(3) + ' * var(--row-h, 190px));max-width:' + Math.round(f.w * 1.4) + 'px">' +
                '<div class="frame" style="aspect-ratio:' + f.w + '/' + f.h + '">' + img(f.s, f.w, f.h, plainText(f.c), figAttrs(f)) + '</div>' +
                (f.c ? '<figcaption>' + f.c + '</figcaption>' : '') + figureLink(f) +
                '</figure>';
        }).join('') + '</div>';
    }

    function renderSpread(b) {
        var est = b.media.reduce(function (sum, f) { return sum + 300 * f.h / f.w + 48; }, 0);
        var mediaCls = 'spread-media' + (b.media.length > 1 ? ' carousel' : '') + (est < window.innerHeight * 0.75 ? ' sticky' : '');
        var media = '<div class="' + mediaCls + '">' + b.media.map(function (f) {
            return '<figure class="item"><div class="frame">' + img(f.s, f.w, f.h, plainText(f.c), figAttrs(f)) + '</div>' +
                (f.c ? '<figcaption>' + f.c + '</figcaption>' : '') + figureLink(f) + '</figure>';
        }).join('') + '</div>';
        return '<div class="spread' + (b.side === 'left' ? ' media-left' : '') + '">' +
            '<div class="spread-text">' + renderBlocks(b.text) + '</div>' + media + '</div>';
    }

    function renderLinks(items) {
        var routes = items.filter(function (it) { return it.route; });
        var compact = items.length > 8;
        var html = '<ul class="links' + (compact ? ' compact' : '') + '">';
        items.forEach(function (it) {
            var href, attrs = '', thumb, sub = it.sub || '';
            if (it.route) {
                href = '#/' + it.route;
                var t = thumbOf(it.route);
                thumb = t ? '<span class="thumb">' + img(t, 0, 0, '') + '</span>' : '<span class="thumb icon">' + ICON.doc + '</span>';
                if (!sub && pageMeta[it.route]) {
                    var p = placeOf(it.route);
                    sub = pageMeta[it.route][1] || (p ? p.name : '');
                }
            } else if (it.image) {
                href = it.image;
                attrs = ' data-lb-src="' + esc(it.image) + '" data-lb-w="' + (it.w || '') + '" data-lb-h="' + (it.h || '') + '" data-lb-c="' + esc(it.label) + '"';
                thumb = '<span class="thumb">' + img(it.image, 0, 0, '') + '</span>';
                sub = sub || 'Bild';
            } else if (it.file) {
                href = it.file;
                attrs = ' target="_blank" rel="noopener"';
                thumb = '<span class="thumb icon">' + ICON.doc + '</span>';
                sub = sub || 'Dokument';
            } else {
                href = it.ext;
                attrs = ' target="_blank" rel="noopener"';
                thumb = '<span class="thumb icon">' + ICON.ext + '</span>';
                sub = sub || it.ext.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
            }
            if (compact) {
                html += '<li><a href="' + esc(href) + '"' + attrs + '><span>' + esc(it.label) +
                    (it.sub ? ' <span class="sub">' + esc(it.sub) + '</span>' : '') + '</span>' + ICON.chev + '</a></li>';
            } else {
                html += '<li><a class="link-card" href="' + esc(href) + '"' + attrs + '>' + thumb +
                    '<span class="txt"><span class="label">' + esc(it.label) + '</span>' +
                    (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</span>' + ICON.chev + '</a></li>';
            }
        });
        void routes;
        return html + '</ul>';
    }

    function renderMap(b) {
        var spots = b.areas.map(function (a, i) {
            var style = 'left:' + a.x + '%;top:' + a.y + '%;width:' + a.w + '%;height:' + a.h + '%';
            var label = a.label || (a.route ? pageTitle(a.route) : 'Bild');
            if (a.route) return '<a class="hotspot" href="#/' + a.route + '" style="' + style + '" aria-label="' + esc(label) + '" data-tip="' + esc(label) + '"></a>';
            return '<a class="hotspot" href="' + esc(a.image) + '" style="' + style + '" aria-label="' + esc(label) + '" data-tip="' + esc(label) + '" data-lb-src="' + esc(a.image) + '" data-lb-c="' + esc(label) + '"></a>';
        }).join('');
        var seen = {}, list = [];
        b.areas.forEach(function (a) {
            var key = a.route || a.image;
            if (seen[key]) return;
            seen[key] = 1;
            if (a.route) list.push({ route: a.route, label: a.label || pageTitle(a.route) });
            else list.push({ image: a.image, label: a.label || 'Bild' });
        });
        list.sort(function (x, y) {
            var nx = parseInt(x.label, 10), ny = parseInt(y.label, 10);
            if (!isNaN(nx) && !isNaN(ny)) return nx - ny;
            return 0;
        });
        return '<div class="map">' +
            '<div class="map-frame">' + img(b.s, b.w, b.h, 'Klickbar karta') + spots + '</div>' +
            '<div class="map-tools"><span>Tryck på kartan för att öppna en plats.</span>' +
            '<button type="button" data-action="reveal" aria-pressed="false">Visa ytor</button></div>' +
            '<p class="map-list-title">På kartan</p>' + renderLinks(list) +
            '</div>';
    }

    function plainText(html) {
        if (!html) return '';
        var d = document.createElement('div');
        d.innerHTML = html;
        return d.textContent.trim();
    }

    function renderBlocks(blocks) {
        var out = '';
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i];
            switch (b.t) {
                case 'p': out += '<p' + (b.lede ? ' class="lede"' : '') + '>' + b.h + '</p>'; break;
                case 'h': out += b.l === 2 ? '<h2>' + esc(b.h) + '</h2>' : '<h3>' + esc(b.h) + '</h3>'; break;
                case 'src': out += '<p class="source">' + b.h + '</p>'; break;
                case 'note': out += '<p class="note">' + b.h + '</p>'; break;
                case 'fig': out += renderFig(b.f); break;
                case 'gal': out += renderGal(b.items); break;
                case 'spread': out += renderSpread(b); break;
                case 'links': out += renderLinks(b.items); break;
                case 'map': out += renderMap(b); break;
            }
        }
        return out;
    }

    function pickHero(entry) {
        if (entry.hero) return { hero: entry.hero, blocks: entry.blocks };
        var first = entry.blocks[0];
        if (first && first.t === 'fig' && first.f.w >= 640 && first.f.w / first.f.h >= 1.2) {
            return { hero: first.f, blocks: entry.blocks.slice(1) };
        }
        return { hero: null, blocks: entry.blocks };
    }

    function renderPage(place, pid) {
        var entry = bundles[place.id][pid];
        if (!entry) { renderNotFound(); return; }
        gallery = [];
        var title = entry.title;
        var isMain = pid === place.main;
        var order = place.pages;
        var pos = order.indexOf(pid);
        var hasToc = order.length > 1;
        var picked = pickHero(entry);
        document.title = (isMain ? title : title + ' – ' + place.name) + ' · ' + SITE;

        var crumbs = '<ol class="crumbs"><li><a href="#/">Platser</a></li>' +
            (isMain ? '' : '<li><a href="#/' + place.id + '">' + esc(place.name) + '</a></li>') + '</ol>';

        var nImg = 0;
        (function count(bs) {
            bs.forEach(function (b) {
                if (b.t === 'fig') nImg++;
                else if (b.t === 'gal') nImg += b.items.length;
                else if (b.t === 'spread') { nImg += b.media.length; count(b.text); }
            });
        })(entry.blocks);

        var meta = '<div class="article-meta">' +
            (CATS[place.cat] ? '<span>' + esc(CATS[place.cat]) + '</span>' : '') +
            (hasToc ? '<span>' + ICON.pages + 'Sida ' + (pos + 1) + ' av ' + order.length + '</span>' : '') +
            (nImg ? '<span>' + ICON.image + plural(nImg, 'bild', 'bilder') + '</span>' : '') +
            '</div>';

        var heroHtml = '';
        if (picked.hero) {
            var h = picked.hero;
            var lbAttr = ' data-lb="' + addToGallery(h) + '" fetchpriority="high"';
            heroHtml = '<figure class="article-hero">' + (h.crop
                ? '<div class="frame" style="aspect-ratio:16/9">' + croppedImg(h, 16 / 9, plainText(h.c), lbAttr) + '</div>'
                : '<div class="frame"><img src="' + esc(h.s) + '" width="' + h.w + '" height="' + h.h + '" alt="' + esc(plainText(h.c)) + '"' + lbAttr + '></div>') +
                (h.c ? '<figcaption>' + h.c + '</figcaption>' : '') + '</figure>';
        }

        var tocItems = order.map(function (p) {
            return '<li><a href="#/' + p + '"' + (p === pid ? ' aria-current="page"' : '') + '>' + esc(pageTitle(p)) + '</a></li>';
        }).join('');

        var disclosure = hasToc ? '<details class="pages-disclosure"><summary><span>' + esc(place.name) +
            ' <span class="muted">· ' + plural(order.length, 'sida', 'sidor') + '</span></span>' + ICON.down + '</summary><ol>' + tocItems + '</ol></details>' : '';

        var body = renderBlocks(picked.blocks);
        if (!body.trim()) {
            body = '<p class="empty-state">Den här sidan är inte färdig ännu.<small>Originalsidan saknar text och bilder.</small></p>';
        }

        var prev = pos > 0 ? order[pos - 1] : null;
        var next = pos < order.length - 1 ? order[pos + 1] : null;
        var pager = hasToc ? '<nav class="pager" aria-label="Bläddra i ' + esc(place.name) + '">' +
            (prev ? '<a class="prev" href="#/' + prev + '"><span class="dir">← Föregående</span><span class="t">' + esc(pageTitle(prev)) + '</span></a>' : '') +
            (next ? '<a class="next" href="#/' + next + '"><span class="dir">Nästa →</span><span class="t">' + esc(pageTitle(next)) + '</span></a>' : '') +
            '</nav>' : '';

        var related = listed.filter(function (p) { return p.cat === place.cat && p.id !== place.id; });
        related = shuffleSeeded(related, place.id).slice(0, 4);
        var more = related.length ? '<section class="more"><div class="section-head"><h2 class="section-title">Fler platser</h2>' +
            '<a class="text-link" href="#/">Alla platser ' + ICON.arrow + '</a></div>' +
            '<div class="grid">' + related.map(function (p) { return placeCard(p, { text: false }); }).join('') + '</div></section>' : '';

        main.innerHTML = '<article class="view' + (hasToc ? ' has-toc-page' : '') + '">' +
            '<header class="article-head wrap">' + crumbs +
            '<h1 class="article-title' + (title.length > 34 ? ' long' : '') + '">' + esc(title) + '</h1>' + meta +
            disclosure + heroHtml + '</header>' +
            '<div class="wrap"><div class="article-layout' + (hasToc ? ' has-toc' : '') + '">' +
            (hasToc ? '<nav class="toc" aria-label="Sidor om ' + esc(place.name) + '"><p class="toc-title">' + esc(place.name) + '</p><ol>' + tocItems + '</ol></nav>' : '') +
            '<div class="article-main"><div class="prose">' + body + '</div>' + pager + more + '</div>' +
            '</div></div></article>';

        layoutSpreads();
        var cur = main.querySelector('.toc a[aria-current]');
        if (cur) {
            var toc = cur.closest('.toc');
            toc.scrollTop = cur.offsetTop - toc.clientHeight / 3;
        }
    }

    function shuffleSeeded(arr, seed) {
        var h = 0;
        for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
        var a = arr.slice();
        for (var j = a.length - 1; j > 0; j--) {
            h = (h * 1103515245 + 12345) | 0;
            var k = Math.abs(h) % (j + 1);
            var t = a[j]; a[j] = a[k]; a[k] = t;
        }
        return a;
    }

    /* Uppslag: på mobil flyttas bilderna in efter första stycket */
    var mqNarrow = window.matchMedia('(max-width: 899px)');

    function layoutSpreads() {
        main.querySelectorAll('.spread').forEach(function (sp) {
            var text = sp.querySelector(':scope > .spread-text');
            var media = sp.querySelector('.spread-media');
            if (!text || !media) return;
            if (mqNarrow.matches) {
                var kids = Array.prototype.filter.call(text.children, function (c) { return c !== media; });
                var anchor = null;
                if (kids.length >= 3) {
                    for (var i = 0; i < kids.length; i++) {
                        if (kids[i].tagName === 'P') { anchor = kids[i]; break; }
                    }
                }
                anchor = anchor || kids[kids.length - 1];
                if (anchor) anchor.after(media);
            } else if (media.parentNode !== sp) {
                sp.appendChild(media);
            }
        });
    }

    if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', layoutSpreads);
    else if (mqNarrow.addListener) mqNarrow.addListener(layoutSpreads);

    /* ------------------------------------------------------------------ */
    /* Om / 404                                                             */
    /* ------------------------------------------------------------------ */

    function renderAbout() {
        document.title = 'Om webbplatsen · ' + SITE;
        var st = IDX.stats;
        main.innerHTML = '<article class="view">' +
            '<header class="article-head wrap"><ol class="crumbs"><li><a href="#/">Start</a></li></ol>' +
            '<h1 class="article-title">Om webbplatsen</h1></header>' +
            '<div class="wrap"><div class="article-layout"><div class="article-main"><div class="prose">' +
            '<p class="lede">Södermalm i tid och rum är en webbplats om Södermalms gator, gränder, berg och människor, sammanställd av Bengt-Göran Jönsson i Olofström.</p>' +
            '<p>Här finns ' + st.places + ' platser fördelade på ' + st.pages + ' sidor och omkring ' + Math.floor(st.images / 100) * 100 + ' bilder: historiska kartor från 1600-talet och framåt, fotografier från sekelskiftet, vykort, målningar och nutidsbilder tagna längs samma gator.</p>' +
            '<h2>Så hittar du</h2>' +
            '<p>Börja på <a href="#/">startsidan</a> och välj en plats, eller filtrera på gator, gränder, berg eller stränder. Varje plats kan bestå av många sidor, som du bläddrar mellan med listan intill texten eller med knapparna längst ned. Sökfältet hittar gator, hus, personer och platser direkt. Tryck på en bild för att se den i full storlek.</p>' +
            '<p>Vissa sidor har klickbara kartor. Tryck på en siffra eller ett hus på kartan, eller välj i listan under den.</p>' +
            '<h2>Källor</h2>' +
            '<p>Texterna bygger till stor del på citat och sammanfattningar ur litteratur om Stockholm och Södermalm. Källan anges i texten där den är känd. Den fullständiga listan finns i <a href="#/innehall">källförteckningen</a>, och alla ämnen finns samlade i <a href="#/gatorbyggnplats">registret</a>.</p>' +
            '<h2>Den här utgåvan</h2>' +
            '<p>Webbplatsen har fått en ny form så att texterna går att läsa bekvämt på telefon, surfplatta och dator. Allt originalinnehåll, alla texter och bilder, finns kvar. Det har bara fått en tydligare struktur, där varje bild hålls ihop med sin bildtext och med texten den hör till.</p>' +
            '<h2>Kontakt</h2>' +
            '<p>Rättelser, tips och egna bilder tas tacksamt emot på <a href="mailto:bengtjn@gmail.com">bengtjn@gmail.com</a>.</p>' +
            '</div></div></div></div></article>';
    }

    function renderNotFound() {
        document.title = 'Sidan finns inte · ' + SITE;
        main.innerHTML = '<div class="view wrap article-head">' +
            '<h1 class="article-title">Sidan finns inte</h1>' +
            '<p class="empty-state">Länken kan vara gammal eller felstavad.<small><a class="text-link" href="#/">Till alla platser →</a></small></p></div>';
    }

    /* ------------------------------------------------------------------ */
    /* Sök                                                                  */
    /* ------------------------------------------------------------------ */

    var searchEl = document.getElementById('search');
    var searchInput = document.getElementById('searchInput');
    var searchResults = document.getElementById('searchResults');
    var searchIndex = null;
    var selIndex = -1;
    var lastFocus = null;

    function buildSearchIndex() {
        var items = [];
        places.forEach(function (p) {
            items.push({ kind: 'place', id: p.id, title: p.name, sub: CATS[p.cat] + ' · ' + plural(p.pages.length, 'sida', 'sidor'), thumb: p.img ? p.img.s : '', f: fold(p.name), fx: fold(p.ex || '') });
        });
        Object.keys(pageMeta).forEach(function (pid) {
            var p = placeOf(pid);
            if (!p || pid === p.main) return;
            var m = pageMeta[pid];
            items.push({ kind: 'page', id: pid, title: m[0], sub: p.name, ex: m[1], thumb: m[2] ? MEDIA + m[2] : '', f: fold(m[0]), fx: fold(p.name + ' ' + m[1] + ' ' + (m[3] || '')) });
        });
        return items;
    }

    function score(item, terms, whole) {
        var s = 0;
        for (var i = 0; i < terms.length; i++) {
            var t = terms[i];
            var ti = item.f.indexOf(t);
            if (ti === 0) s += 60;
            else if (ti > 0 && /[\s\-–(,.]/.test(item.f.charAt(ti - 1))) s += 40;
            else if (ti > 0) s += 22;
            else if (item.fx.indexOf(t) > -1) s += 6;
            else return 0;
        }
        if (item.f === whole) s += 80;
        if (item.kind === 'place') s += 15;
        return s;
    }

    function highlight(text, terms) {
        var f = fold(text);
        var marks = [];
        terms.forEach(function (t) {
            var i = f.indexOf(t);
            if (i > -1) marks.push([i, i + t.length]);
        });
        if (!marks.length) return esc(text);
        marks.sort(function (a, b) { return a[0] - b[0]; });
        var out = '', last = 0;
        marks.forEach(function (m) {
            if (m[0] < last) return;
            out += esc(text.slice(last, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>';
            last = m[1];
        });
        return out + esc(text.slice(last));
    }

    function runSearch() {
        var q = fold(searchInput.value.trim());
        selIndex = -1;
        if (!q) {
            var sug = IDX.featured.map(function (id) { return placeById[id]; }).filter(Boolean);
            searchResults.innerHTML = '<div class="sr-group">Förslag</div>' + sug.map(function (p) {
                return srItem('#/' + p.id, p.img ? p.img.s : '', esc(p.name), esc(CATS[p.cat]));
            }).join('');
            return;
        }
        if (!searchIndex) searchIndex = buildSearchIndex();
        var terms = q.split(/\s+/).filter(Boolean);
        var hits = [];
        searchIndex.forEach(function (it) {
            var s = score(it, terms, q);
            if (s) hits.push([s, it]);
        });
        hits.sort(function (a, b) { return b[0] - a[0] || a[1].title.localeCompare(b[1].title, 'sv'); });
        var pl = hits.filter(function (h) { return h[1].kind === 'place'; }).slice(0, 6);
        var pg = hits.filter(function (h) { return h[1].kind === 'page'; }).slice(0, 40);
        if (!pl.length && !pg.length) {
            searchResults.innerHTML = '<p class="sr-empty">Inga träffar på ”' + esc(searchInput.value.trim()) + '”.</p>';
            return;
        }
        var html = '';
        if (pl.length) {
            html += '<div class="sr-group">Platser</div>' + pl.map(function (h) {
                var it = h[1];
                return srItem('#/' + it.id, it.thumb, highlight(it.title, terms), esc(it.sub));
            }).join('');
        }
        if (pg.length) {
            html += '<div class="sr-group">Sidor</div>' + pg.map(function (h) {
                var it = h[1];
                return srItem('#/' + it.id, it.thumb, highlight(it.title, terms), esc(it.sub) + (it.ex ? ' · ' + esc(it.ex) : ''));
            }).join('');
        }
        searchResults.innerHTML = html;
    }

    function srItem(href, thumb, title, sub) {
        return '<a class="sr-item" role="option" href="' + href + '">' +
            '<span class="sr-thumb">' + (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy">' : '') + '</span>' +
            '<span class="sr-txt"><span class="sr-title">' + title + '</span><span class="sr-sub">' + sub + '</span></span></a>';
    }

    function openSearch() {
        lastFocus = document.activeElement;
        searchEl.hidden = false;
        document.body.classList.add('locked');
        searchInput.focus();
        searchInput.select();
        runSearch();
    }

    function closeSearch(silent) {
        if (searchEl.hidden) return;
        searchEl.hidden = true;
        document.body.classList.remove('locked');
        if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
    }

    searchInput.addEventListener('input', runSearch);
    searchInput.addEventListener('keydown', function (e) {
        var items = searchResults.querySelectorAll('.sr-item');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!items.length) return;
            selIndex = (selIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items.forEach(function (el, i) { el.setAttribute('aria-selected', i === selIndex); });
            items[selIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            var target = items[selIndex >= 0 ? selIndex : 0];
            if (target) { e.preventDefault(); linkNavigation = true; location.hash = target.getAttribute('href'); closeSearch(true); }
        }
    });
    searchResults.addEventListener('click', function (e) {
        var a = e.target.closest('.sr-item');
        if (a && a.getAttribute('href') === location.hash) closeSearch();
    });

    /* ------------------------------------------------------------------ */
    /* Bildvisning                                                          */
    /* ------------------------------------------------------------------ */

    var lb = document.getElementById('lightbox');
    var lbStage = document.getElementById('lbStage');
    var lbCount = document.getElementById('lbCount');
    var lbCaption = document.getElementById('lbCaption');
    var lbPrev = lb.querySelector('.lb-prev');
    var lbNext = lb.querySelector('.lb-next');
    var lbItems = [];
    var lbIndex = 0;
    var lbTrack = null;
    var lbFocus = null;
    var lbPushed = false;

    function openLightbox(items, index) {
        lbItems = items;
        lbIndex = index;
        lbFocus = document.activeElement;
        lbStage.innerHTML = '<div class="lb-track">' + items.map(function () {
            return '<div class="lb-slide"></div>';
        }).join('') + '</div>';
        lbTrack = lbStage.firstChild;
        lb.hidden = false;
        document.body.classList.add('locked');
        try {
            history.pushState({ lightbox: true }, '', location.href);
            lbPushed = true;
        } catch (e) { lbPushed = false; }
        showSlide(false);
        lb.querySelector('[data-action="lb-close"]').focus({ preventScroll: true });
    }

    function ensureSlide(i) {
        if (i < 0 || i >= lbItems.length) return;
        var slide = lbTrack.children[i];
        if (slide.firstChild) return;
        var it = lbItems[i];
        var im = new Image();
        im.alt = plainText(it.c);
        im.decoding = 'async';
        im.src = it.s;
        im.draggable = false;
        slide.appendChild(im);
    }

    function showSlide(animate) {
        var n = lbItems.length;
        lbTrack.style.transition = animate ? 'transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none';
        lbTrack.style.transform = 'translate3d(' + (-lbIndex * 100) + '%,0,0)';
        ensureSlide(lbIndex);
        ensureSlide(lbIndex + 1);
        ensureSlide(lbIndex - 1);
        resetZoom();
        lbCount.textContent = n > 1 ? (lbIndex + 1) + ' / ' + n : '';
        var c = lbItems[lbIndex].c;
        lbCaption.innerHTML = c ? '<div>' + c + '</div>' : '';
        lbPrev.disabled = lbIndex === 0;
        lbNext.disabled = lbIndex === n - 1;
    }

    function step(d) {
        var i = lbIndex + d;
        if (i < 0 || i >= lbItems.length) { showSlide(true); return; }
        lbIndex = i;
        showSlide(true);
    }

    function closeLightbox(fromPop) {
        if (lb.hidden) return;
        lb.hidden = true;
        lbStage.innerHTML = '';
        document.body.classList.remove('locked');
        if (lbPushed && !fromPop) {
            lbPushed = false;
            history.back();
        }
        lbPushed = false;
        if (lbFocus && lbFocus.focus) lbFocus.focus({ preventScroll: true });
    }

    window.addEventListener('popstate', function () {
        if (!lb.hidden) closeLightbox(true);
    });

    /* Zoom och svep */
    var zoom = { on: false, x: 0, y: 0, img: null };

    function resetZoom() {
        if (zoom.img) {
            zoom.img.style.transform = '';
            zoom.img.classList.remove('zoomed');
        }
        zoom = { on: false, x: 0, y: 0, img: null };
    }

    function toggleZoom(e) {
        var im = lbTrack && lbTrack.children[lbIndex].querySelector('img');
        if (!im) return;
        if (zoom.on) { resetZoom(); return; }
        var r = im.getBoundingClientRect();
        var scale = Math.max(2, Math.min(4, (im.naturalWidth || r.width * 2) / r.width));
        var ox = (e.clientX - (r.left + r.width / 2)) * (scale - 1);
        var oy = (e.clientY - (r.top + r.height / 2)) * (scale - 1);
        zoom = { on: true, x: -ox, y: -oy, img: im, scale: scale };
        im.classList.add('zoomed');
        im.style.transform = 'translate(' + zoom.x + 'px,' + zoom.y + 'px) scale(' + scale + ')';
    }

    var drag = null;
    var lastTap = 0;

    lbStage.addEventListener('pointerdown', function (e) {
        if (!e.isPrimary) { drag = null; return; }
        drag = { x: e.clientX, y: e.clientY, t: Date.now(), dx: 0, dy: 0, zx: zoom.x, zy: zoom.y, moved: false };
        lbStage.setPointerCapture && lbStage.setPointerCapture(e.pointerId);
    });

    lbStage.addEventListener('pointermove', function (e) {
        if (!drag || !e.isPrimary) return;
        drag.dx = e.clientX - drag.x;
        drag.dy = e.clientY - drag.y;
        if (Math.abs(drag.dx) > 6 || Math.abs(drag.dy) > 6) drag.moved = true;
        if (zoom.on) {
            zoom.x = drag.zx + drag.dx;
            zoom.y = drag.zy + drag.dy;
            zoom.img.style.transition = 'none';
            zoom.img.style.transform = 'translate(' + zoom.x + 'px,' + zoom.y + 'px) scale(' + zoom.scale + ')';
            return;
        }
        if (Math.abs(drag.dx) > Math.abs(drag.dy)) {
            var edge = (lbIndex === 0 && drag.dx > 0) || (lbIndex === lbItems.length - 1 && drag.dx < 0);
            var dx = edge ? drag.dx / 3 : drag.dx;
            lbTrack.style.transition = 'none';
            lbTrack.style.transform = 'translate3d(calc(' + (-lbIndex * 100) + '% + ' + dx + 'px),0,0)';
        } else if (drag.dy > 0) {
            lbTrack.style.transition = 'none';
            lbTrack.style.transform = 'translate3d(' + (-lbIndex * 100) + '%,' + drag.dy * 0.6 + 'px,0)';
            lb.style.backgroundColor = 'rgba(12,10,8,' + Math.max(0.4, 0.96 - drag.dy / 600) + ')';
        }
    });

    function endDrag(e) {
        if (!drag) return;
        var d = drag;
        drag = null;
        lb.style.backgroundColor = '';
        if (zoom.on) {
            if (zoom.img) zoom.img.style.transition = '';
            if (!d.moved) toggleZoom(e);
            return;
        }
        var dt = Date.now() - d.t;
        var vx = d.dx / Math.max(dt, 1);
        if (!d.moved) {
            var now = Date.now();
            if (e.target.tagName === 'IMG') {
                if (now - lastTap < 320 || e.pointerType === 'mouse') toggleZoom(e);
                lastTap = now;
            } else if (e.target.classList.contains('lb-slide')) {
                closeLightbox();
            }
            showSlide(false);
            return;
        }
        if (Math.abs(d.dy) > Math.abs(d.dx) && d.dy > 110) { closeLightbox(); return; }
        if (d.dx < -60 || vx < -0.5) step(1);
        else if (d.dx > 60 || vx > 0.5) step(-1);
        else showSlide(true);
    }

    lbStage.addEventListener('pointerup', endDrag);
    lbStage.addEventListener('pointercancel', function () { drag = null; lb.style.backgroundColor = ''; showSlide(true); });

    /* ------------------------------------------------------------------ */
    /* Globala händelser                                                    */
    /* ------------------------------------------------------------------ */

    document.addEventListener('click', function (e) {
        var t = e.target;
        var actionEl = t.closest('[data-action]');
        if (actionEl) {
            var act = actionEl.getAttribute('data-action');
            if (act === 'search') { openSearch(); return; }
            if (act === 'close-search') { closeSearch(); return; }
            if (act === 'theme') { toggleTheme(); return; }
            if (act === 'menu') { toggleMenu(); return; }
            if (act === 'lb-close') { closeLightbox(); return; }
            if (act === 'lb-prev') { step(-1); return; }
            if (act === 'lb-next') { step(1); return; }
            if (act === 'reveal') {
                var on = actionEl.getAttribute('aria-pressed') !== 'true';
                actionEl.setAttribute('aria-pressed', on);
                actionEl.closest('.map').classList.toggle('reveal', on);
                return;
            }
        }
        var lbImg = t.closest('img[data-lb]');
        if (lbImg) {
            e.preventDefault();
            openLightbox(gallery, parseInt(lbImg.getAttribute('data-lb'), 10));
            return;
        }
        var single = t.closest('[data-lb-src], a[data-lightbox]');
        if (single) {
            e.preventDefault();
            var src = single.getAttribute('data-lb-src') || single.getAttribute('href');
            openLightbox([{ s: src, c: esc(single.getAttribute('data-lb-c') || '') }], 0);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (!lb.hidden) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'ArrowLeft') step(-1);
            return;
        }
        if (!searchEl.hidden && e.key === 'Escape') { closeSearch(); return; }
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
            e.preventDefault();
            if (searchEl.hidden) openSearch(); else closeSearch();
        }
    });

    /* Kartans verktygstips */
    var tip = null;
    document.addEventListener('pointerover', function (e) {
        var hs = e.target.closest && e.target.closest('.hotspot');
        if (!hs || e.pointerType === 'touch') return;
        if (!tip) { tip = document.createElement('div'); tip.className = 'map-tip'; }
        tip.textContent = hs.getAttribute('data-tip');
        var frame = hs.parentNode;
        frame.appendChild(tip);
        tip.style.left = (hs.offsetLeft + hs.offsetWidth / 2) + 'px';
        tip.style.top = hs.offsetTop + 'px';
    });
    document.addEventListener('pointerout', function (e) {
        if (tip && e.target.closest && e.target.closest('.hotspot')) tip.remove();
    });

    /* Tema */
    function applyTheme(t) {
        if (t) document.documentElement.setAttribute('data-theme', t);
        else document.documentElement.removeAttribute('data-theme');
        var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
            if (t) m.setAttribute('content', dark ? '#15130f' : '#f6f1e7');
        });
    }

    function toggleTheme() {
        var cur = document.documentElement.getAttribute('data-theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        var next = cur === 'dark' ? 'light' : 'dark';
        store('soder.theme', next);
        applyTheme(next);
    }

    applyTheme(store('soder.theme'));

    /* Meny (mobil) */
    var menuBtn = document.querySelector('.menu-btn');
    var mobileNav = document.getElementById('mobileNav');

    function toggleMenu() {
        var open = mobileNav.hidden;
        mobileNav.hidden = !open;
        menuBtn.setAttribute('aria-expanded', open);
    }

    function closeMenu() {
        mobileNav.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
    }

    /* Toppfältets kantlinje vid scroll */
    var topbar = document.getElementById('topbar');
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            topbar.classList.toggle('scrolled', window.scrollY > 4);
            ticking = false;
        });
    }, { passive: true });

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('hashchange', route);
    route();
})();
