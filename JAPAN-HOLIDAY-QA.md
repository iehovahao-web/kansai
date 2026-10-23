# Japan holiday / Obon local QA

These entry points only accept forced themes on `file:`, `localhost`,
`127.0.0.1`, or `::1`. Query parameters cannot force a theme on the public
site.

## Core previews

- `/?season=obon#top`
- `/?season=japanholiday&holiday=marine#top`
- `/?season=japanholiday&holiday=mountain#top`
- `/?season=japanholiday&holiday=children#top`
- `/?season=japanholiday&holiday=culture#top`
- `/?season=off#seasonal-guides` (formal-page Sakura / autumn leaves / fireworks link group)

## Every supported national-holiday treatment

Use `/?season=japanholiday&holiday=KEY#top` where `KEY` is one of:

`comingage`, `foundation`, `emperor`, `vernal`, `showa`, `constitution`,
`greenery`, `children`, `marine`, `mountain`, `respect`, `autumnal`, `sports`,
`culture`, `labor`, `substitute`, `citizens`.

Convenience aliases include `adult`, `spring`, `green`, `child`, `sea`,
`aged`, `autumn`, `labour`, and `bridge`.

## Acceptance checks

1. The caption shows English, official Japanese, and Traditional Chinese names.
2. National holidays say `日本の国民の祝日`; statutory days off say
   `祝日法による休日`; Obon explicitly says it is not a national holiday.
3. January 1 keeps the New Year treatment and identifies the official holiday
   as `元日 · 日本の国民の祝日`.
4. Links, buttons, players, navigation, and scrolling remain operable through
   every decorative region. Holiday and Obon decoration nodes compute to
   `pointer-events: none`.
5. Mobile layout remains vertical and the lower-edge decoration stays above the
   fixed mobile bar.
6. Reduced-motion mode removes the holiday atmospheric particles and fireflies, stops the subject animation, and stops lantern/yokai animation. Data Saver reduces particle counts.
7. `?season=off` suppresses all seasonal treatment locally.
8. Automatic dates are verified against the exact 2026/2027 Cabinet Office
   table in `assets/data/japan-holidays-official.json`; both Article 3 holiday
   categories keep their distinct labels.
9. A year present in the official JSON never mixes in calculated dates. A
   later year uses the current-law fallback until the weekly sync imports the
   newly published official year.
10. Non-New-Year statutory holidays inside Jan 1–7 take priority over the extended New Year visual window; January 1 itself remains New Year.
11. Each of the 17 holiday treatments loads its own local transparent WebP asset; the old kanji rain and geometric horizon are absent.
12. The formal seasonal guide shows three separately tracked links: JNTO Sakura, JNTO autumn leaves, and the Kansai-wide fireworks calendar.
13. `node scripts/test-japan-holidays.mjs` validates the official 2026/2027
    tables, Shift_JIS import determinism, and fixed/Happy Monday/equinox/
    substitute/bridge fallback rules (including selected 2050 dates).
