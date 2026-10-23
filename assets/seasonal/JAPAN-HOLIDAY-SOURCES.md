# Japan national-holiday and Obon source record

Last checked: 2026-10-23 (Asia/Tokyo)

## Official national-holiday data

Primary source: Cabinet Office, Government of Japan, **「国民の祝日」について**
https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html

Machine-readable source: Cabinet Office, **「昭和30年（1955年）から令和9年
（2027年）国民の祝日」** (Shift_JIS / CP932 CSV)<br>
https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv

Current statute: e-Gov, **国民の祝日に関する法律（昭和23年法律第178号）**<br>
https://laws.e-gov.go.jp/law/323AC1000000178

The Cabinet Office page currently publishes the complete 2026 and 2027 lists.
It also says the 2028 list will be posted in February 2027. The CSV does not
carry a publication timestamp, so this record gives the site's verification
date above rather than inventing one. The National Astronomical Observatory of
Japan formally announces the following year's spring and autumn equinox dates
in the official gazette each February.

`scripts/sync-japan-holidays.py` decodes the official CSV and deterministically
builds `assets/data/japan-holidays-official.json`. A GitHub Actions workflow
checks the source every week and can also be run manually. It validates that
each published year contains all 16 Article 2 national holidays and commits
only when the generated JSON actually changes. The public page reads this
local, version-controlled JSON; visitors do not make a live request to a
government server.

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

The site preserves the Cabinet Office distinction between a `国民の祝日` and
a statutory `休日`. January 1 keeps the existing New Year artwork but the date
line identifies the official holiday name `元日`; Article 3(2) and 3(3) days
are labelled `祝日法による休日` instead of being called national holidays.

The official CSV calls both Article 3 categories simply `休日`. During import,
the generator distinguishes them from the surrounding Article 2 dates:

- Article 3(2): the nearest later date that is not itself a national holiday
  after a national holiday fell on Sunday (`substitute` / 振替休日).
- Article 3(3): a non-national-holiday date immediately between two national
  holidays (`citizens` / 国民の休日).

## Future-year fallback and limits

For a year covered by the checked-in Cabinet Office JSON, the official list is
authoritative, including the absence of a holiday on any other date. For a
later, not-yet-published year, the browser calculates a provisional fallback
from the current law: fixed dates, Happy Monday rules, the current Emperor's
birthday, approximate equinox dates, Article 3(2) substitute days, and Article
3(3) bridge days. As soon as the official CSV adds that year, the weekly sync
replaces every provisional result with the official dates automatically.

The fallback is intentionally not represented as an official calendar.
Equinoxes are estimates until the February proclamation, and the Diet can pass
special legislation that moves or creates dates. The 2019 imperial succession
holidays and the 2020/2021 Olympic holiday moves are examples that a generic
rule engine cannot predict. The current-law calculator therefore applies only
to future years (2022–2150 in the implementation); historical dates always
belong to the official CSV. A future legal change may require a code update,
while a normal annual Cabinet Office date publication requires no manual edit.

## Obon scope

Obon is a customary observance and **is not a national holiday**. Its timing
varies by region and community. For this Kansai-focused site, the automatic
window is the commonly observed August 13–16 period. The caption says
`国民の祝日ではありません` so visitors do not mistake it for an official
holiday. The local-only `?season=obon` entry point can show the treatment on
any date for review; it does not change the production calendar.

## Asset and interaction policy

- Visuals use original local transparent WebP illustrations plus code-native HTML/CSS motion, light, and atmospheric layers. No image or audio is fetched from a visitor’s browser.
- The full-screen layers and all descendants use `pointer-events: none`.
- `prefers-reduced-motion`, `prefers-reduced-transparency`, forced colors,
  print, narrow screens, and data-saver mode receive reduced treatments.
