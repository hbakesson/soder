const STREET_DATA = [
  {
    "id": "annalindhagen",
    "name": "Anna Lindhagens Täppa",
    "path": "sodermalm.one/annalindhagen/annalindhagen.html",
    "image": "sodermalm.one/annalindhagen/al1txt.jpg"
  },
  {
    "id": "ansgarieg",
    "name": "Ansgariegatan",
    "path": "sodermalm.one/ansgarieg/ansgarieg1.html",
    "image": "sodermalm.one/ansgarieg/nuansgariegnorrut.jpg"
  },
  {
    "id": "asoberget",
    "name": "Åsöberget",
    "path": "sodermalm.one/asoberget/asoberget.html",
    "image": "sodermalm.one/asoberget/nutidfrfafangan2.jpg"
  },
  {
    "id": "barnangen",
    "name": "Barnängen",
    "path": "sodermalm.one/barnangen/barnangen.html",
    "image": "sodermalm.one/barnangen/kartahillskaskolan.jpg"
  },
  {
    "id": "bastugatan",
    "name": "Bastugatan",
    "path": "sodermalm.one/bastugatan/bastugatan.html",
    "image": "sodermalm.one/bastugatan/bastugkartamap.jpg"
  },
  {
    "id": "bellmansgatannorr",
    "name": "Bellmansgatan (Norr)",
    "path": "sodermalm.one/bellmansgatannorr/bellmansgatannorr.html",
    "image": "sodermalm.one/bellmansgatannorr/bellmansg14.jpg"
  },
  {
    "id": "bellmansgatanshornsg",
    "name": "Bellmansgatan (Söder om Hornsgatan)",
    "path": "sodermalm.one/bellmansgatanshornsg/bellmansgatanshornsg.html",
    "image": "sodermalm.one/bellmansgatanshornsg/trapportillfredmg.jpg"
  },
  {
    "id": "bengtekenhjelmsgatan",
    "name": "Bengt Ekenhjelmsgatan",
    "path": "sodermalm.one/bengtekenhjelmsgatan/bengtekenhjelmsgatan.html",
    "image": "sodermalm.one/bengtekenhjelmsgatan/ekehjelmstorget.jpg"
  },
  {
    "id": "bergsprangargrand",
    "name": "Bergsprängargränd",
    "path": "sodermalm.one/bergsprangargrand/bergsprangargrand.html",
    "image": "sodermalm.one/bergsprangargrand/bespgvyvasterut.jpg"
  },
  {
    "id": "bjorngardsgatan",
    "name": "Björngårdsgatan",
    "path": "sodermalm.one/bjorngardsgatan/bjorngardsgatan.html",
    "image": "sodermalm.one/bjorngardsgatan/nurnbergshuset3.jpg"
  },
  {
    "id": "blecktornsgrand",
    "name": "Blecktornsgränd",
    "path": "sodermalm.one/blecktornsgrand/blecktornsgrand.html",
    "image": "sodermalm.one/blecktornsgrand/blecktornsgr2.jpg"
  },
  {
    "id": "bondegatan",
    "name": "Bondegatan",
    "path": "sodermalm.one/bondegatan/bondegatan.html",
    "image": "sodermalm.one/bondegatan/bondegslutflygbild.jpg"
  },
  {
    "id": "brannkyrkagost",
    "name": "Brännkyrkagatan (Öst)",
    "path": "sodermalm.one/brannkyrkagost/brannkyrkagost.html",
    "image": "sodermalm.one/brannkyrkagost/bkg8nutid2.jpg"
  },
  {
    "id": "brannkyrkagvast",
    "name": "Brännkyrkagatan (Väst)",
    "path": "sodermalm.one/brannkyrkagvast/brannkyrkagvast.html",
    "image": "sodermalm.one/brannkyrkagvast/brannkyrkagvast.jpg"
  },
  {
    "id": "danviken",
    "name": "Danviken",
    "path": "sodermalm.one/danviken/danviken.html",
    "image": "sodermalm.one/danviken/danviken5x.jpg"
  },
  {
    "id": "ekermanskamalmg",
    "name": "Ekermanska Malmgården",
    "path": "sodermalm.one/ekermanskamalmg/ekermanmalm.html",
    "image": "sodermalm.one/ekermanskamalmg/karta1731.jpg"
  },
  {
    "id": "ersta",
    "name": "Ersta",
    "path": "sodermalm.one/ersta/ersta.html",
    "image": "sodermalm.one/ersta/xersta36.jpg"
  },
  {
    "id": "fafangan",
    "name": "Fåfängan",
    "path": "sodermalm.one/fafangan/fafangan.html",
    "image": "sodermalm.one/fafangan/karta1885.jpg"
  },
  {
    "id": "fargargavljus",
    "name": "Färgargårdstorget",
    "path": "sodermalm.one/fargargavljus/fargargavljus.html",
    "image": "sodermalm.one/fargargavljus/utsiktfargargardenfrskanstull.jpg"
  },
  {
    "id": "fatburen",
    "name": "Fatburen",
    "path": "sodermalm.one/fatburen/fatburen.html",
    "image": "sodermalm.one/fatburen/pauli1764.jpg"
  },
  {
    "id": "fiskarroddargatan",
    "name": "Fiskargatan / Roddargatan",
    "path": "sodermalm.one/fiskarroddargatan/fiskarroddargatan.html",
    "image": "sodermalm.one/fiskarroddargatan/kartadrottningen.jpg"
  },
  {
    "id": "fjallgatan",
    "name": "Fjällgatan",
    "path": "sodermalm.one/fjallgatan/fjallgatan.html",
    "image": "sodermalm.one/fjallgatan/neuhausfjallg1870.jpg"
  },
  {
    "id": "fjallgatannorr",
    "name": "Fjällgatan (Norr)",
    "path": "sodermalm.one/fjallgatannorr/fjallgatannorr.html",
    "image": "sodermalm.one/fjallgatannorr/kartapilarnorr.jpg"
  },
  {
    "id": "fjallgatansoder",
    "name": "Fjällgatan (Söder)",
    "path": "sodermalm.one/fjallgatansoder/fjallgatansoder.html",
    "image": "sodermalm.one/fjallgatansoder/kartapilarsoder.jpg"
  },
  {
    "id": "folkungagatan",
    "name": "Folkungagatan",
    "path": "sodermalm.one/folkungagatan/folkungagatan.html",
    "image": "sodermalm.one/folkungagatan/folkung42_46frsoder.jpg"
  },
  {
    "id": "forensodermalm",
    "name": "Forensodermalm",
    "path": "sodermalm.one/forensodermalm/forensodermalm.html",
    "image": "sodermalm.one/forensodermalm/info2a.jpg"
  },
  {
    "id": "fredmansgatan",
    "name": "Fredmansgatan",
    "path": "sodermalm.one/fredmansgatan/fredmansgatan.html",
    "image": "sodermalm.one/fredmansgatan/trapportillbellmg2.jpg"
  },
  {
    "id": "gatorbyggnplats",
    "name": "Gatorbyggnplats",
    "path": "sodermalm.one/gatorbyggnplats/gbp.html",
    "image": "sodermalm.one/gatorbyggnplats/fafangan_2.jpg"
  },
  {
    "id": "glasbruksgatan",
    "name": "Glasbruksgatan",
    "path": "sodermalm.one/glasbruksgatan/glasbruksgatan.html",
    "image": "sodermalm.one/glasbruksgatan/stglbgfrstadshuset1896.jpg"
  },
  {
    "id": "gotgatan",
    "name": "Götgatan",
    "path": "sodermalm.one/gotgatan/9.html",
    "image": "sodermalm.one/gotgatan/skanstull_2.jpg"
  },
  {
    "id": "heleneborg",
    "name": "Heleneborg",
    "path": "sodermalm.one/heleneborg/heleneborg.html",
    "image": "sodermalm.one/heleneborg/nobelexpl.jpg"
  },
  {
    "id": "hogalid",
    "name": "Högalid",
    "path": "sodermalm.one/hogalid/hogalid.html",
    "image": "sodermalm.one/hogalid/killekarta1902x.jpg"
  },
  {
    "id": "hogbergsgost",
    "name": "Högbergsgatan (Öst)",
    "path": "sodermalm.one/hogbergsgost/hogbergsgost.htm",
    "image": "sodermalm.one/hogbergsgost/hgbg16gardmotoster.jpg"
  },
  {
    "id": "hogbergsgvast",
    "name": "Högbergsgatan (Väst)",
    "path": "sodermalm.one/hogbergsgvast/hogbergsgvast.html",
    "image": "sodermalm.one/hogbergsgvast/hgbg72_70.jpg"
  },
  {
    "id": "hornsgatan",
    "name": "Hornsgatan",
    "path": "sodermalm.one/hornsgatan/hornsgatan.htm",
    "image": "sodermalm.one/hornsgatan/hornsgnutid2005.jpg"
  },
  {
    "id": "hornsgatanostsoder",
    "name": "Hornsgatan (Öst/Söder)",
    "path": "sodermalm.one/hornsgatanostsoder/hornsgatanostsoder.htm",
    "image": "sodermalm.one/hornsgatanostsoder/lusthus2.jpg"
  },
  {
    "id": "josabeth",
    "name": "Josabeth",
    "path": "sodermalm.one/josabeth/josabeth.html",
    "image": "sodermalm.one/josabeth/renstiernasg3.jpg"
  },
  {
    "id": "katarina",
    "name": "Katarina",
    "path": "sodermalm.one/katarina/katarina.htm",
    "image": "sodermalm.one/katarina/bgkatarinax.jpg"
  },
  {
    "id": "katarinanordvast",
    "name": "Katarinanordvast",
    "path": "sodermalm.one/katarinanordvast/katarinanordvast.htm",
    "image": "sodermalm.one/katarinanordvast/mosebacketerrassen1840.jpg"
  },
  {
    "id": "kocksgatan",
    "name": "Kocksgatan",
    "path": "sodermalm.one/kocksgatan/kocksgatan.html",
    "image": "sodermalm.one/kocksgatan/kocksg27froster.jpg"
  },
  {
    "id": "kristallen",
    "name": "Kristallen",
    "path": "sodermalm.one/kristallen/kristallen.htm",
    "image": "sodermalm.one/kristallen/neuhaus.jpg"
  },
  {
    "id": "krukmakargatan",
    "name": "Krukmakargatan",
    "path": "sodermalm.one/krukmakargatan/krukmakargatan.html",
    "image": "sodermalm.one/krukmakargatan/zinkenkindborg1902.jpg"
  },
  {
    "id": "kvarngatan",
    "name": "Kvarngatan",
    "path": "sodermalm.one/kvarngatan/kvarngatan.html",
    "image": "sodermalm.one/kvarngatan/sodralatin.jpg"
  },
  {
    "id": "langholmen",
    "name": "Långholmen",
    "path": "sodermalm.one/langholmen/langholmen.html",
    "image": "sodermalm.one/langholmen/karta1802.jpg"
  },
  {
    "id": "liljeholmensstearin",
    "name": "Liljeholmensstearin",
    "path": "sodermalm.one/liljeholmensstearin/liljeholmensstearin.html",
    "image": "sodermalm.one/liljeholmensstearin/dalkullor.jpg"
  },
  {
    "id": "lillaersta",
    "name": "Lillaersta",
    "path": "sodermalm.one/lillaersta/lillaersta.html",
    "image": "sodermalm.one/lillaersta/renstiernasg3.jpg"
  },
  {
    "id": "lillaskinnarviksgrand",
    "name": "Lillaskinnarviks gränd",
    "path": "sodermalm.one/lillaskinnarviksgrand/lillaskinnarviksgrand.htm",
    "image": "sodermalm.one/lillaskinnarviksgrand/neuhaus1873.jpg"
  },
  {
    "id": "malmgardsvagen",
    "name": "Malmgards vägen",
    "path": "sodermalm.one/malmgardsvagen/nr55.html",
    "image": "sodermalm.one/malmgardsvagen/kartamalmgardsvag2.jpg"
  },
  {
    "id": "mariaberget",
    "name": "Mariaberget",
    "path": "sodermalm.one/mariaberget/mariaberget.html",
    "image": "sodermalm.one/mariaberget/bgmbvyxx.jpg"
  },
  {
    "id": "mariatrappgrand",
    "name": "Mariatrapp gränd",
    "path": "sodermalm.one/mariatrappgrand/mariatrappgrand.htm",
    "image": "sodermalm.one/mariatrappgrand/karta1885.jpg"
  },
  {
    "id": "mastermikael",
    "name": "Mastermikael",
    "path": "sodermalm.one/mastermikael/kartor.html",
    "image": "sodermalm.one/mastermikael/omra4enutid.jpg"
  },
  {
    "id": "masterparsgrand",
    "name": "Masterpars gränd",
    "path": "sodermalm.one/masterparsgrand/masterparsgrand.html",
    "image": "sodermalm.one/masterparsgrand/kartampgr.jpg"
  },
  {
    "id": "mejtens",
    "name": "Mejtens",
    "path": "sodermalm.one/mejtens/mejtens.html",
    "image": "sodermalm.one/mejtens/karta1885mejt.jpg"
  },
  {
    "id": "nytorget",
    "name": "Nytorget",
    "path": "sodermalm.one/nytorget/nytorget.html",
    "image": "sodermalm.one/nytorget/ntgt17nr.jpg"
  },
  {
    "id": "nytorgsgatan",
    "name": "Nytorgsgatan",
    "path": "sodermalm.one/nytorgsgatan/nytorgsgatan.html",
    "image": "sodermalm.one/nytorgsgatan/ateljeglasbruksg.jpg"
  },
  {
    "id": "ostgotagatan",
    "name": "Östgötagatan",
    "path": "sodermalm.one/ostgotagatan/ostgotagatan.html",
    "image": "sodermalm.one/ostgotagatan/katarinakronobr1796.jpg"
  },
  {
    "id": "pafogelstrom",
    "name": "Pafogelstrom",
    "path": "sodermalm.one/pafogelstrom/pafogelstrom.html",
    "image": "sodermalm.one/pafogelstrom/pafogelstr5.jpg"
  },
  {
    "id": "prastgardsgatan",
    "name": "Prastgards gatan",
    "path": "sodermalm.one/prastgardsgatan/prastgardsgatan.html",
    "image": "sodermalm.one/prastgardsgatan/karta1909.jpg"
  },
  {
    "id": "pryssgrand",
    "name": "Pryss gränd",
    "path": "sodermalm.one/pryssgrand/pryssgrand.htm",
    "image": "sodermalm.one/pryssgrand/pryssgrbastug.jpg"
  },
  {
    "id": "pustegrand",
    "name": "Puste gränd",
    "path": "sodermalm.one/pustegrand/pustegrand.htm",
    "image": "sodermalm.one/pustegrand/pustegr2.jpg"
  },
  {
    "id": "ragvaldsgatan",
    "name": "Ragvalds gatan",
    "path": "sodermalm.one/ragvaldsgatan/ragvaldsgatan.html",
    "image": "sodermalm.one/ragvaldsgatan/rgvgvykort.jpg"
  },
  {
    "id": "reimersholme",
    "name": "Reimersholme",
    "path": "sodermalm.one/reimersholme/reimersholme.html",
    "image": "sodermalm.one/reimersholme/locirk1.jpg"
  },
  {
    "id": "renstjernasgatan",
    "name": "Renstiernas Gata",
    "path": "sodermalm.one/renstjernasgatan/renstjernasgatan.html",
    "image": "sodermalm.one/renstjernasgatan/stadsgardshissen.jpg"
  },
  {
    "id": "rosenlund",
    "name": "Rosenlund",
    "path": "sodermalm.one/rosenlund/rosenlund.html",
    "image": "sodermalm.one/rosenlund/nutidskartamax.jpg"
  },
  {
    "id": "sickla",
    "name": "Sickla",
    "path": "sodermalm.one/sickla/sickla.html",
    "image": "sodermalm.one/sickla/sjovagar_2.jpg"
  },
  {
    "id": "sistastyv",
    "name": "Sistastyv",
    "path": "sodermalm.one/sistastyv/sistastyv.html",
    "image": "sodermalm.one/sistastyv/sistastyvtr.jpg"
  },
  {
    "id": "skanegatanostnytgt",
    "name": "Skånegatan",
    "path": "sodermalm.one/skanegatanostnytgt/skanegatan.html",
    "image": "sodermalm.one/skanegatanostnytgt/karta1885skanegat.jpg"
  },
  {
    "id": "skaraborgsgatan",
    "name": "Skaraborgs gatan",
    "path": "sodermalm.one/skaraborgsgatan/skaraborgsgatan.html",
    "image": "sodermalm.one/skaraborgsgatan/stur1.jpg"
  },
  {
    "id": "skinnarviksberget",
    "name": "Skinnarviks berget",
    "path": "sodermalm.one/skinnarviksberget/skinnarviksberget.html",
    "image": "sodermalm.one/skinnarviksberget/glundag12.jpg"
  },
  {
    "id": "slussen",
    "name": "Slussen",
    "path": "sodermalm.one/slussen/slussen.html",
    "image": "sodermalm.one/slussen/stockholm_panorama_1868.jpg"
  },
  {
    "id": "sodermannagatan",
    "name": "Södermannagatan",
    "path": "sodermalm.one/sodermannagatan/sodermannagatan.html",
    "image": "sodermalm.one/sodermannagatan/surbrunnen3_800.jpg"
  },
  {
    "id": "stadsgarden",
    "name": "Stadsgarden",
    "path": "sodermalm.one/stadsgarden/stadsgarden.html",
    "image": "sodermalm.one/stadsgarden/tranbodarnamed.jpg"
  },
  {
    "id": "stigberget",
    "name": "Stig berget",
    "path": "sodermalm.one/stigberget/stigberget.html",
    "image": "sodermalm.one/stigberget/katarinamgalge.jpg"
  },
  {
    "id": "stigbergsgatan",
    "name": "Stigbergs gatan",
    "path": "sodermalm.one/stigbergsgatan/stigbergsgatan.html",
    "image": "sodermalm.one/stigbergsgatan/stgbgosterut2.jpg"
  },
  {
    "id": "stpaulsgatan",
    "name": "Stpauls gatan",
    "path": "sodermalm.one/stpaulsgatan/stpaulsgatan.html",
    "image": "sodermalm.one/stpaulsgatan/angmanskaskolan.jpg"
  },
  {
    "id": "swedenborgsgatan",
    "name": "Swedenborgs gatan",
    "path": "sodermalm.one/swedenborgsgatan/swedenborgsgatan.html",
    "image": "sodermalm.one/swedenborgsgatan/swbgnorrut.jpg"
  },
  {
    "id": "tanto",
    "name": "Tanto",
    "path": "sodermalm.one/tanto/tanto.html",
    "image": "sodermalm.one/tanto/arstakarta.jpg"
  },
  {
    "id": "tavastgatan",
    "name": "Tavast gatan",
    "path": "sodermalm.one/tavastgatan/tavastgatan.html",
    "image": "sodermalm.one/tavastgatan/neuhaustavastgvast.jpg"
  },
  {
    "id": "tegelviken",
    "name": "Tegelviken",
    "path": "sodermalm.one/tegelviken/tegelviken.html",
    "image": "sodermalm.one/tegelviken/tegelvik2ad.jpg"
  },
  {
    "id": "timmermansgatan",
    "name": "Timmermans gatan",
    "path": "sodermalm.one/timmermansgatan/timmermansgatan.html",
    "image": "sodermalm.one/timmermansgatan/timmermansgatantecknad.jpg"
  },
  {
    "id": "tjarhovsgatan",
    "name": "Tjarhovs gatan",
    "path": "sodermalm.one/tjarhovsgatan/tjarhovsgatan.html",
    "image": "sodermalm.one/tjarhovsgatan/tjarhovsgatanbilder.jpg"
  },
  {
    "id": "tjarhovsgmellgotgrenstj",
    "name": "Tjarhovsgmellgotgrenstj",
    "path": "sodermalm.one/tjarhovsgmellgotgrenstj/tjarhovsgmellgotgrenstj.htm",
    "image": "sodermalm.one/tjarhovsgmellgotgrenstj/tjarhovsg16_18.jpg"
  },
  {
    "id": "torkelknutssonsgatan",
    "name": "Torkelknutssons gatan",
    "path": "sodermalm.one/torkelknutssonsgatan/torkelknutssonsgatan.html",
    "image": "sodermalm.one/torkelknutssonsgatan/obergskaritning1785.jpg"
  },
  {
    "id": "vastgotagatan",
    "name": "Vastgota gatan",
    "path": "sodermalm.one/vastgotagatan/vastgotagatan.html",
    "image": "sodermalm.one/vastgotagatan/karta1885_2.jpg"
  },
  {
    "id": "vitabergen",
    "name": "Vita Bergen",
    "path": "sodermalm.one/vitabergen/vitabergen.html",
    "image": "sodermalm.one/vitabergen/kartavb1674.jpg"
  },
  {
    "id": "wollmaryxkullsgatan",
    "name": "Wollmar Yxkullsgatan",
    "path": "sodermalm.one/wollmaryxkullsgatan/wollmaryxkullsgatan.html",
    "image": "sodermalm.one/wollmaryxkullsgatan/kartmontage2text.jpg"
  }
];