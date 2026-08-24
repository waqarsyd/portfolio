# Portfolio

My personal portfolio site — **[waqarsyd.github.io/portfolio](https://waqarsyd.github.io/portfolio/)**

One page of plain HTML, CSS and JavaScript. No build step, no package manager, nothing to
install: clone it and open `index.html`, or copy the files to any static host. Every asset
path is relative, so the same files work from a subpath, from a domain root, or straight off
disk over `file://`.

## Layout

| File | Role |
| --- | --- |
| `portfolio.js` | All content — one config object, one key per section |
| `render.js` | Builds the page from that config |
| `script.js` | Behaviour: theme, header, scroll reveals, dialog, contact form |
| `styles.css` | The single stylesheet |
| `index.html` | Shell only — `<head>`, an empty `#root`, and a `<noscript>` fallback |

Assets live in `fonts/`, `images/` and `lottie/`. Changing what the site says means editing
`portfolio.js` and nothing else; each section carries a `display` flag, so switching one off
is a one-line edit.

The page makes two CDN requests — Font Awesome for the icons and Twemoji for the emoji — and
both degrade to plain text offline. Everything else is served from this repository.
