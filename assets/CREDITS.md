# Asset credits

All files in this folder come from **Poly Haven** (https://polyhaven.com) and are licensed **CC0 1.0** (public domain). They are free for any use, commercial included, and need no attribution. Downloaded on 2026-11-25.

## Sky maps (`hdri/`, 2K HDR)
| File | Used as |
|---|---|
| rolling_hills | Countryside |
| spruit_sunrise | Golden hour |
| farmland_overcast | Overcast |
| forest_slope | Forest |
| snowy_field | Winter |
| rogland_clear_night | Night |

The web host only serves common file types, so the configurator loads `*.hdr.b64.txt`: the same HDR file, base64 encoded. The `.hdr` originals are kept for reference.

Regenerate after replacing an HDR (Git Bash, inside `hdri/`):
```bash
for f in *.hdr; do base64 -w 0 "$f" > "$f.b64.txt"; done
```

## PBR texture sets (`tex/`: colour `diff`, OpenGL normal `nor_gl`, roughness `rough`)
| Set | Real size | Used for |
|---|---|---|
| corrugated_iron_02 (2K) | 2.7 m | Steel cladding and roof relief/sheen. The catalog colour or print stays as the colour |
| japanese_cedar_planks (2K) | 1.13 m | WPC embossed / flat cladding, carved timber |
| stacked_stone_wall | 2 m | Cultured stone, carved stone panels |
| red_brick_03 | 1 m | Carved brick panels |
| marble_01 | 1.5 m | Marble walls and worktops |
| laminate_floor_02 | 1.7 m | PVC / SPC plank floors |
| herringbone_parquet | 3.4 m | Fishbone SPC floor |
| wood_floor_deck | 1.8 m | WPC terrace decking |
| concrete_floor_02 | 2 m | Concrete pad, concrete finishes |
| aerial_grass_rock (2K) | 15 m | Ground (grass) |
| forrest_ground_01 | 2 m | Ground (forest) |
| snow_02 | 2 m | Ground (winter) |
