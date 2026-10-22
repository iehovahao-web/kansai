# Japanese New Year asset provenance

Prepared: 2026-10-23 (Asia/Tokyo)

This manifest covers only the local New Year review package. `NEWYEAR-SHA256SUMS.txt` records the exact shipped files.

## Original site artwork

The following transparent SVG illustrations were drawn specifically for this site. Their paths, gradients, highlights, and composition are original; no third-party artwork is embedded. They may be distributed as part of this site.

| Local file | Original treatment |
|---|---|
| `newyear-hatsuhinode.svg` | First sunrise over Mount Fuji, gold clouds, and seigaiha waves |
| `newyear-mizuhiki.svg` | Red-and-gold ceremonial mizuhiki cords with plum blossoms |
| `newyear-kadomatsu.svg` | Pine, bamboo, plum blossoms, and woven-straw kadomatsu |
| `newyear-fan.svg` | Gold folding fan with red plum blossoms and ceremonial cord |
| `newyear-kagamimochi.svg` | Kagami mochi, daruma, and gold folding-screen still life |

## Firework audio — CC0 1.0

| Local file | Source page | Author | Source archive | License | Local treatment |
|---|---|---|---|---|---|
| `newyear-firework-burst-cc0.m4a` | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | https://opengameart.org/sites/default/files/25-CC0-bang-sfx.zip | CC0 1.0, stated on the source page | `firework-pack/fw_04.ogg`, attenuated 7 dB, conservatively limited, and encoded to 48 kHz stereo AAC/M4A |

The local recording is 2.384063 seconds and contains no synthesized layers. It plays only after the visitor explicitly enables New Year sound, and only in response to a visible firework burst.

CC0 legal text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

## Firework renderer reference

The local Canvas renderer was informed by the general rocket-and-particle model used by `fireworks-js` (MIT License): https://github.com/crashmax-dev/fireworks-js. The site implementation uses its own drawing, protected-content zones, Japanese shell patterns, pacing, reduced-motion scene, and event synchronization.
