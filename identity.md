# Visuell Identitet — Birgir Birgisson

> Extraherad genom analys av [birgir.se](https://www.birgir.se/) och samtliga undersidor  
> Senast uppdaterad: april 2026

---

## 1. Kärnidentitet

### Tagline
**Människa, teknik, förändring.**

### Positionering
Coach, AI-strateg och byggare som arbetar i gränslandet mellan det mänskliga och det digitala. Jungiansk psykologi som grund, teknik som verktyg, människan som utgångspunkt.

### Nyckelord
`Ansvar` · `Självinsikt` · `Långsiktighet` · `Djup framför bredd` · `System framför motivation` · `Transparens`

---

## 2. Tonalitet & Röst

### Skrivstil
| Egenskap | Beskrivning |
|---|---|
| **Tempo** | Lugnt, reflekterande, aldrig stressat |
| **Register** | Professionellt men personligt — aldrig akademiskt stelt, aldrig slarvigt informellt |
| **Perspektiv** | Första person singular ("Jag tror…", "Jag bygger…") — direkt och ägarskapstagande |
| **Längd** | Långa, genomtänkta artiklar (1500–3000 ord). Korta, slagkraftiga rubriker |
| **Struktur** | Numrerade sektioner (01, 02, 03), tydlig hierarki, generöst med whitespace |

### Röstprinciper
- **Ärlig snarare än säljande** — "Jag bygger hellre saker än säljer löften"
- **Reflekterande snarare än instruerande** — ställer frågor, väver in personlig erfarenhet
- **Tydlig med begränsningar** — "Jag vet inte exakt hur det här löftet ska formuleras"
- **Jungiansk referensram** — Skuggan, Persona, individuation används naturligt, aldrig påtvingat
- **Transparent om AI-användning** — "Delar av materialet är framtaget med hjälp av AI-verktyg"

### Ord och uttryck som används ofta
- "System slår motivation"
- "Djup snarare än bredd"
- "Verklig förändring"
- "Inte snabba svar"
- "Genomtänkt och hållbart"
- "Den som redan är redo att göra arbetet"

### Ord och uttryck som ALDRIG används
- "Quick fix", "hack", "motivationssnack"
- "Genombrott", "disruption", "game-changer"
- Överdrivna superlativ eller tomma löften
- Silicon Valley-jargong utan kritisk reflektion

---

## 3. Designspråk

### Övergripande stil
**Minimalistisk, mörk, skandinavisk.** Sidan andas lugn, rymd och trovärdighet. Inget skrikigt, inga distraktioner. Designen speglar personligheten: djup framför yta, substans framför effekter.

### Färgpalett

| Roll | Färg | Hex (uppskattning) | Användning |
|---|---|---|---|
| **Primär bakgrund** | Mörk, nästan svart | `#0A0A0A` – `#111111` | Body, sektioner |
| **Sekundär bakgrund** | Djupt mörkgrå | `#1A1A1A` – `#1C1C1C` | Kort, sektionsblock |
| **Primär text** | Varm ljusgrå / off-white | `#E8E8E8` – `#F0F0F0` | Brödtext, rubriker |
| **Sekundär text** | Dämpad grå | `#888888` – `#999999` | Datum, labels, metadata |
| **Accent** | Varm dämpat guld/amber | `#C8A96E` – `#D4A853` | CTA-knappar, nummering (01, 02, 03), hover |
| **Länkfärg** | Ljusare guld vid hover | `#E0C080` | Hover-state på länkar |

### Färgfilosofi
- **Mörkt tema som standard** — skapar fokus och lugn
- **Minimalt med färg** — accent används sparsamt och medvetet
- **Ingen regnbåge** — en enda accentfärg i guldtoner, aldrig flera
- **Hög kontrast** — ljus text mot mörk bakgrund, tydlig läsbarhet

---

## 4. Typografi

### Typsnittsval (baserat på sitens karaktär)

| Element | Typsnitt | Vikt | Storlek (ungefärlig) |
|---|---|---|---|
| **H1 (hero)** | Serif, troligen **Playfair Display** eller liknande | 700 (Bold) | 48–64px |
| **H2 (sektioner)** | Samma serif | 600–700 | 32–40px |
| **H3 (subsektioner)** | Samma serif eller sans-serif | 500–600 | 24–28px |
| **Brödtext** | Sans-serif, troligen **Inter** eller **DM Sans** | 400 | 16–18px |
| **Navigation** | Sans-serif | 400–500 | 14–16px |
| **Metadata/labels** | Sans-serif, versaler | 400 | 12–14px, `letter-spacing: 0.05em` |
| **Nummer (01, 02…)** | Sans-serif eller monospace | 300 | Stor, med accentfärg |

### Typografiska principer
- **Serif för rubriker** — ger karaktär, tyngd och tidlöshet
- **Sans-serif för brödtext** — ren läsbarhet
- **Generös radavstånd** — `line-height: 1.6–1.8` för brödtext
- **Korta rader** — maxbredd ca 680–720px för textinnehåll
- **Versaler med spacing** — för labels och sektionstitlar ("PERSPEKTIV", "JUST NU")

---

## 5. Layout & Struktur

### Sidstruktur
```
┌──────────────────────────────────────────┐
│  NAV: Logo (vänster) — Länkar (höger)    │
├──────────────────────────────────────────┤
│                                          │
│  HERO: Tagline + kort intro              │
│  CTA-knappar (2 st, sida vid sida)      │
│                                          │
├──────────────────────────────────────────┤
│  PERSPEKTIV: Tre punkter, lång text      │
├──────────────────────────────────────────┤
│  JUST NU: 01 / 02 / 03 — tre kort       │
├──────────────────────────────────────────┤
│  SKRIVET: Senaste 3 artiklarna           │
├──────────────────────────────────────────┤
│  KONTAKT: Kort CTA + e-post             │
├──────────────────────────────────────────┤
│  FOOTER: Sajten / Ekosystemet / ©       │
└──────────────────────────────────────────┘
```

### Layoutprinciper
- **Centrerad innehållskolumn** — max 1100–1200px bred
- **Generöst vertikalt space** — stora sektionsgap (80–120px)
- **Inga bilder på startsidan** — rent textdrivet, skapar fokus
- **Numrerade sektioner** — 01, 02, 03 med stor, dämpad nummering
- **Kort-layout** — artiklar och tjänster presenteras som distinkta kort
- **Sticky/fast navigation** — enkel, diskret

---

## 6. Komponenter & UI-element

### Knappar
| Typ | Stil |
|---|---|
| **Primär CTA** | Fylld bakgrund (accent/guld), mörk text, rundade hörn (`border-radius: 8px`), generös padding |
| **Sekundär CTA** | Outline/border, accentfärg, transparent bakgrund |
| **Hover** | Subtil ljusning, mjuk transition (`300ms ease`) |

### Navigation
- Ren, horisontell rad
- Logonamn till vänster (text, inte bild)
- Sidor till höger: Start · Om Birgir · Vad jag gör · Artiklar · Kontakt
- Diskret, smälter in i bakgrunden

### Artikelkort
- Datum (sekundärfärg, liten text)
- Rubrik (serif, fet)
- Ingress (brödtext, max 2–3 rader)
- Hela kortet är klickbart
- Subtil hover-effekt (liten upplyftning eller kantlinje)

### Footer
- Tre kolumner: Varumärke + tagline | Sajten (internlänkar) | Ekosystemet (externa)
- Copyright + "Byggt med omsorg i Sverige."
- Diskret, informativ, aldrig dominant

---

## 7. Bildspråk & Grafik

### Principer
- **Inga stockfoton** — sidan är nästan helt textdriven
- **Inga illustrationer** — rent typografiskt
- **Eventuella bilder** bör vara:
  - Svartvita eller dämpade toner
  - Autentiska, inte iscensatta
  - Minimalistiska i komposition
- **Ikoner** — inga eller extremt sparsamt

### Grafiska element
- Subtila avdelare (tunna linjer, 1px, `rgba(255,255,255,0.1)`)
- Sektionsnumrering som visuellt element (01, 02, 03 i stor stilgrad)
- Ingen bakgrundsdekor, inga mönster

---

## 8. Varumärkespersonlighet

### Om Birgir var en person i rummet:
- Lugn, uppmärksam, lyssnar mer än han pratar
- Klär sig enkelt men medvetet — mörka toner, inget flashigt
- Tar tid på sig att svara, men svaret har substans
- Säger "jag vet inte" när han inte vet
- Har alltid en bok med sig (Jung, förmodligen)
- Bygger saker med händerna, inte bara pratar om dem

### Arketyp (Jungianskt)
**Den Vise (The Sage)** med inslag av **Skaparen (The Creator)**  
Söker sanning och förståelse, bygger system som varar, värderar integritet över popularitet.

---

## 9. Tillämpning — Do's & Don'ts

### ✅ Do's
- Använd generöst med whitespace
- Skriv i första person med övertygelse
- Numrera sektioner och tjänster
- Håll färgpaletten stram — mörkt + ett guld
- Var transparent med AI-användning
- Referera till Jung, psykologi och system naturligt
- Avsluta med "Nästa steg" eller en öppen inbjudan

### ❌ Don'ts
- Använd aldrig neon, pastell eller "startup-färger"
- Skriv aldrig säljigt ("Boka nu!", "Begränsat erbjudande!")
- Använd aldrig stockfoton eller generiska ikoner
- Klä aldrig budskapet i buzzwords utan substans
- Lova aldrig "snabba resultat"
- Kopiera aldrig Silicon Valley-estetik (gradient-bakgrunder, 3D-illustrationer)

---

## 10. Digitalt ekosystem

| Kanal | URL | Roll |
|---|---|---|
| **Webb** | [birgir.se](https://www.birgir.se/) | Hem, artiklar, tjänster |
| **LinkedIn** | [linkedin.com/in/birgisson](https://www.linkedin.com/in/birgisson/) | Professionellt nätverk |
| **YouTube** | [@birgirbirgisson](https://www.youtube.com/@birgirbirgisson) | Video, experiment |
| **Facebook** | [Vibe Coding Sverige](https://www.facebook.com/groups/vibecodingsverige) | Community |
| **Veckobrev** | [nyhetsbrev.birgir.se](https://nyhetsbrev.birgir.se) | Direkt kontakt, reflektion |
| **X** | [@BiggiAgile](https://x.com/BiggiAgile) | Korta tankar |
| **Instagram** | [@biggiagile](https://www.instagram.com/biggiagile/) | Visuellt |
| **E-post** | info@birgir.se | Direktkontakt |
| **Telefon** | 0705-51 03 04 | Personlig kontakt |

---

*Detta dokument beskriver den visuella och kommunikativa identiteten extraherad från birgir.se. Det är avsett som referens vid all framtida design, skrivande och varumärkesbeslut.*
