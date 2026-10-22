# Kansai site metrics schema

## Runtime and counting rules

- Backend: `https://abacus.jasoncameron.dev`
- Namespace: `iehovahao-web.github.io-kansai`
- The backend script runs only at `https://iehovahao-web.github.io/kansai/` (including pages below that path).
- Any URL containing the `verify` query parameter is read-only: it may issue `/get` requests, but it never calls `/hit`, never records a visit, and never creates a detailed key.
- Load `site-metrics-backend.js` before `site-metrics.js`. The first script injects the production provider; the second owns the visible clock/counters and the device-local provider used only outside production.
- A page visit increments once on every normal page load or refresh. Verification URLs remain read-only. Each top-level media category increments at most once per browser tab session.
- A detailed key increments at most once per browser tab session. These are engagement counters, not authenticated people or guaranteed unique visitors.
- Audio/video counts qualify only after actual continuous playback reaches the existing 4–8 second threshold. Seeking does not create listening time.
- Seasonal ambience audio is excluded from music totals. Its on/off toggle has separate detail keys.
- A module view qualifies when at least 50% of its `h2` heading intersects the viewport. Using the heading avoids impossible percentage thresholds on very tall mobile sections.

## Visible totals

Only these three values appear in the page UI.

| Internal name | Abacus key | Meaning |
|---|---|---|
| `visits` | `site-visits` | One normal page load or refresh |
| `music` | `music-listeners` | One session with a qualified non-seasonal audio play |
| `video` | `video-viewers` | One session with a qualified feature-video play |

`site-visits` was initialized to **208** on 2026-10-23 at the owner's direction, using the 14-day GitHub repository Traffic snapshot as a one-time baseline. That snapshot is repository traffic, not recoverable historical GitHub Pages analytics. `music-listeners` and `video-viewers` started at zero because no historical media-event source existed.

## Detailed backend-only keys

### Section navigation and module exposure

- `section-link-food`, `section-link-sea`, `section-link-shopping`, `section-link-coupon`, `section-link-addresses`
- `module-food-view`, `module-sea-view`, `module-shopping-view`, `module-coupon-view`, `module-addresses-view`
- `navigation-brand-top`
- `navigation-header-food`, `navigation-header-sea`, `navigation-header-shopping`, `navigation-header-coupon`
- `navigation-hero-food`, `navigation-hero-addresses`
- `navigation-footer-addresses`, `navigation-footer-top`
- `navigation-mobile-addresses`

### Review-platform links

- `review-platform-kkday`, `review-platform-klook`, `review-platform-trip-com`

### Food and restaurant modules

- `food-kagonoya-map`, `food-kagonoya-site`, `food-kagonoya-image`, `food-kagonoya-copy`
- `food-aburiya-map`, `food-aburiya-site`, `food-aburiya-image`, `food-aburiya-copy`
- `food-daiko-sushi-map`, `food-daiko-sushi-site`, `food-daiko-sushi-image`, `food-daiko-sushi-copy`

### Sea / aquarium module

- `sea-suma-aquarium-map`, `sea-suma-aquarium-site`, `sea-suma-aquarium-media`, `sea-suma-aquarium-copy`

### Shopping and coupon modules

- `shopping-ora2-image`, `shopping-rishiri-image`, `shopping-kyushin-image`
- `coupon-download`, `coupon-download-main`, `coupon-download-dialog`, `coupon-download-mobile`
- `coupon-preview`, `coupon-tsuruha-locator`

### Address-list interactions

- `addresses-kagonoya-map`, `addresses-kagonoya-site`, `addresses-kagonoya-copy`
- `addresses-aburiya-map`, `addresses-aburiya-site`, `addresses-aburiya-copy`
- `addresses-daiko-sushi-map`, `addresses-daiko-sushi-site`, `addresses-daiko-sushi-copy`
- `addresses-suma-aquarium-map`, `addresses-suma-aquarium-site`, `addresses-suma-aquarium-copy`
- `addresses-tsuruha-locator`

### Audio and video

- `audio-osaka-track-01` through `audio-osaka-track-12`
- `audio-osaka-track-select-01` through `audio-osaka-track-select-12`
- `audio-delicious-in-progress`
- `video-jazz-impression`
- `video-yodogawa-light-never-sleeps`

### Meaningful media controls

- `control-osaka-previous`, `control-osaka-play-toggle`, `control-osaka-next`, `control-osaka-airplay`
- `control-delicious-rewind`, `control-delicious-play-toggle`, `control-delicious-forward`, `control-delicious-airplay`
- `control-video-jazz-play`, `control-video-yodogawa-play`

### Language and seasonal sound

- `language-zh`, `language-en`, `language-ja`, `language-ko`, `language-es`, `language-de`, `language-fr`, `language-it`, `language-ar`, `language-th`
- `seasonal-audio-halloween-on`, `seasonal-audio-halloween-off`
- `seasonal-audio-christmas-on`, `seasonal-audio-christmas-off`

Future seasonal themes must be added to the explicit allowlist before using the same `seasonal-audio-{theme}-{on|off}` convention.

## Read-only reporting

`metrics-keys.json` is the exact, machine-readable key catalog. It contains no administration secret. Run `node tools/read-metrics.mjs` from any directory to read all totals and detailed keys as JSON, or add `--totals-only` for the three public totals. The reporter uses only `/get`, treats a missing key as zero/not-yet-created, spaces requests 500 ms apart to stay below the observed service limit, and never calls `/hit`.

To pre-create a catalog key at zero, Abacus uses unauthenticated `GET /create/{namespace}/{key}?initializer=0` and returns HTTP 201 with `{ "key", "namespace", "admin_key", "value": 0 }`. The query parameter is named `initializer`. The `admin_key` is returned only once and must be stored outside this repository with private file permissions. A 409 response means the key already exists; its administration key cannot be recovered. Later `/set`, `/reset`, `/update`, and `/delete` calls are POST requests authenticated with `Authorization: Bearer {admin_key}`. The production page never calls these administration endpoints.

## Failure, security, and privacy behavior

- The provider uses CORS `GET /get/{namespace}/{key}` and `GET /hit/{namespace}/{key}`, with a 4.5-second timeout, omitted credentials, no referrer, no URL/query payload, and no personal fields.
- Successful global values are cached in the browser and rendered immediately on later loads, so a refresh does not replace the three totals with placeholders while the network request is pending. The authorized `208 / 0 / 0` baseline is the first-paint fallback before any cache exists. A successful response always replaces it with the current shared totals. Production never substitutes unrelated device-local totals. Local and non-production previews use the device-local provider.
- A failed remote increment is never followed by a device-local increment because the remote service may have accepted the request before its response was lost. This prevents a single action from being counted in two stores.
- Detailed backend-only events are best effort. They are not queued in local storage and do not block links, media, language switching, or seasonal controls.
- Abacus is a free third-party service. It currently allows CORS and reports a limit of 30 requests per 10 seconds per IP. It has no project SLA. The visitor's IP is visible to that service as with any HTTP request.
- Counter identifiers are public and `/hit` is unauthenticated. Someone who knows the namespace/key can inflate a count. These counters must not be used for billing, security decisions, audited reporting, or claims of exact unique visitors.
- A first `/hit` silently creates a missing detailed key. Such an implicitly created key has no administration secret, so it cannot be reset or deleted through Abacus; schema keys must remain stable and deliberate.
- Abacus documents a six-month expiry that is refreshed when a key is accessed. Long-term records therefore depend on continued access and the third-party service remaining available.
