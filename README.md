# Arboga – Lediga tomter map

Embeddable Leaflet map for Arboga’s lediga tomter areas (Hällarna, Medåker, Södra Brattberget).

**Live embed URL (GitHub Pages):**  
https://redelefant-mr-e.github.io/arboga-lediga-tomter-map/embed.html

## Layout

- **Desktop (≥600px):** map with red dots + floating area cards  
- **Mobile (&lt;600px):** map with red dots only + full-width area list below the map

## Webflow embed

Add an **Embed** element (or Custom Code) and paste:

**Desktop-oriented iframe**

```html
<iframe
  src="https://redelefant-mr-e.github.io/arboga-lediga-tomter-map/embed.html"
  title="Karta över lediga tomter i Arboga"
  style="width:100%;height:600px;border:0;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

**Mobile-friendly iframe** (map + list needs more height)

```html
<iframe
  src="https://redelefant-mr-e.github.io/arboga-lediga-tomter-map/embed.html"
  title="Karta över lediga tomter i Arboga"
  style="width:100%;min-height:900px;height:100vh;border:0;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

Or use one taller height that works for both breakpoints (e.g. `min-height: 900px`).

## Local preview

```bash
python3 -m http.server 8765
# open http://127.0.0.1:8765/embed.html
```

## Files

| File | Role |
| --- | --- |
| `embed.html` | iframe entry |
| `index.html` | same preview |
| `lediga-tomter-map.js` / `.css` | map + markers + mobile list |
| `areas.json` | area names, coords, links |
| `fonts/` | Larken (Bold + Regular) |

## Note on fonts

Larken is included for brand fidelity. Confirm your license allows web embedding before keeping this repo public.
