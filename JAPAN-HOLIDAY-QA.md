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
6. Reduced-motion mode removes floating holiday motifs and fireflies and stops
   lantern/yokai animation. Data Saver reduces ornament counts.
7. `?season=off` suppresses all seasonal treatment locally.
8. Automatic dates are verified against the exact 2026/2027 tables in
   `assets/seasonal/JAPAN-HOLIDAY-SOURCES.md`.

