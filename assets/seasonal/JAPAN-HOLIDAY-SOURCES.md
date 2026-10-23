# Japan national-holiday and Obon source record

Last checked: 2026-10-23 (Asia/Tokyo)

## Official national-holiday data

Primary source: Cabinet Office, Government of Japan, **「国民の祝日」について**  
https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html

The page explicitly publishes the 2026 and 2027 dates used by this site. The
site keeps these two years as a literal allow-list so the movable equinox and
statutory substitute/bridge holidays are not guessed.

### 2026 (Reiwa 8)

| Date | Official Japanese name | Site key |
|---|---|---|
| 2026-01-01 | 元日 | Existing New Year treatment |
| 2026-01-12 | 成人の日 | `comingage` |
| 2026-02-11 | 建国記念の日 | `foundation` |
| 2026-02-23 | 天皇誕生日 | `emperor` |
| 2026-03-20 | 春分の日 | `vernal` |
| 2026-04-29 | 昭和の日 | `showa` |
| 2026-05-03 | 憲法記念日 | `constitution` |
| 2026-05-04 | みどりの日 | `greenery` |
| 2026-05-05 | こどもの日 | `children` |
| 2026-05-06 | 休日（祝日法第3条第2項） | `substitute` |
| 2026-07-20 | 海の日 | `marine` |
| 2026-08-11 | 山の日 | `mountain` |
| 2026-09-21 | 敬老の日 | `respect` |
| 2026-09-22 | 休日（祝日法第3条第3項） | `citizens` |
| 2026-09-23 | 秋分の日 | `autumnal` |
| 2026-10-12 | スポーツの日 | `sports` |
| 2026-11-03 | 文化の日 | `culture` |
| 2026-11-23 | 勤労感謝の日 | `labor` |

### 2027 (Reiwa 9)

| Date | Official Japanese name | Site key |
|---|---|---|
| 2027-01-01 | 元日 | Existing New Year treatment |
| 2027-01-11 | 成人の日 | `comingage` |
| 2027-02-11 | 建国記念の日 | `foundation` |
| 2027-02-23 | 天皇誕生日 | `emperor` |
| 2027-03-21 | 春分の日 | `vernal` |
| 2027-03-22 | 休日（祝日法第3条第2項） | `substitute` |
| 2027-04-29 | 昭和の日 | `showa` |
| 2027-05-03 | 憲法記念日 | `constitution` |
| 2027-05-04 | みどりの日 | `greenery` |
| 2027-05-05 | こどもの日 | `children` |
| 2027-07-19 | 海の日 | `marine` |
| 2027-08-11 | 山の日 | `mountain` |
| 2027-09-20 | 敬老の日 | `respect` |
| 2027-09-23 | 秋分の日 | `autumnal` |
| 2027-10-11 | スポーツの日 | `sports` |
| 2027-11-03 | 文化の日 | `culture` |
| 2027-11-23 | 勤労感謝の日 | `labor` |

The Cabinet Office states that 2028 dates will be published in February 2027.
Before extending automatic display past 2027, copy the newly published list
instead of predicting equinox or statutory holiday dates.

The site preserves the Cabinet Office distinction between a `国民の祝日` and
a statutory `休日`. January 1 keeps the existing New Year artwork but the date
line identifies the official holiday name `元日`; Article 3(2) and 3(3) days
are labelled `祝日法による休日` instead of being called national holidays.

## Obon scope

Obon is a customary observance and **is not a national holiday**. Its timing
varies by region and community. For this Kansai-focused site, the automatic
window is the commonly observed August 13–16 period. The caption says
`国民の祝日ではありません` so visitors do not mistake it for an official
holiday. The local-only `?season=obon` entry point can show the treatment on
any date for review; it does not change the production calendar.

## Asset and interaction policy

- Visuals are original code-native HTML/CSS, Unicode, and gradients; no remote
  image or audio is fetched.
- The full-screen layers and all descendants use `pointer-events: none`.
- `prefers-reduced-motion`, `prefers-reduced-transparency`, forced colors,
  print, narrow screens, and data-saver mode receive reduced treatments.

