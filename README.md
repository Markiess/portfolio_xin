# Leon Vasari Filmography

A static, bilingual film archive with a draggable 3D VHS shelf. Open `index.html` directly, or run `python -m http.server 8174 --bind 127.0.0.1` from the project root and visit http://127.0.0.1:8174/.

| Path | Responsibility |
| --- | --- |
| `index.html` | Page structure, catalogue and detail dialogs, and the ink mask |
| `styles/` | Responsive layout, tape geometry and local font declarations |
| `scripts/films.js` | Titles, dates, metadata and synopses |
| `scripts/artwork-data.js`, `scripts/artwork.js` | Original sprite sheets, crop coordinates and local fallback artwork |
| `scripts/shelf.js` | Film selection, drag, wheel, hover and cursor input |
| `scripts/tape-renderer.js` | Shelf geometry and 3D tape transforms |
| `scripts/shelf-labels.js` | Caption transitions and decade controls |
| `scripts/detail.js` | Detail sheet transitions, poster reveal and screening availability |
| `scripts/main.js` | Startup, frame scheduling, catalogue and keyboard navigation |
| `assets/` | Sleeve artwork, paper grain, WOFF2 fonts and font licences |

The scripts load in dependency order with `defer`. No package installation or build step is required. The local sleeve atlas renders immediately and each original sheet replaces its corresponding artwork once decoded.
