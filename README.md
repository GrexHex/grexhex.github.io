# Portfolio

A very small, dependency-free static portfolio. Black and white only, one system font for UI text (the ASCII sphere alone keeps monospace so its characters align), all visible copy lowercase, no decorative divider lines and no hover previews. All names, copy, email, socials and artwork are placeholders.

## Preview locally

```sh
cd portfolio
python3 -m http.server 4173
```

Open <http://localhost:4173/>. You can also open `index.html` directly, but a local server is recommended so relative paths behave normally.

## File map

```text
portfolio/
├── index.html              black home with one interactive ASCII sphere
├── works.html              plain list of projects, no hover preview
├── about.html              short introduction
├── contact.html            email + social links
├── project-one.html        case study
├── project-two.html        case study
├── project-three.html      case study
└── assets/
    ├── css/style.css       all layout and monochrome styling
    ├── js/site.js          nav, ASCII sphere animation + toggle, email copy
    ├── img/project-*.svg   placeholder artwork
    └── favicon.svg         site icon
```

No build step and no package install. Every piece of text uses the single system font stack in `--font`, except the ASCII sphere, which uses `--mono` so the characters line up.

## Where to replace content

- **Name:** search for `your name` in all HTML files. It appears in page titles, the fixed bar and the navigation overlay.
- **Home (`index.html`):** the `<pre data-ascii-orb>` inside the `.home__orb` button contains only a pre-JS fallback. Change the live character ramp, spin and lighting in `assets/js/site.js`; the same file handles the transform toggle.
- **Work (`works.html`):** edit each `.work__name` and the row `href`. There is no hover preview; the artwork lives on the project pages.
- **Case studies:** edit `.project__title`, `.project__lede`, the image `src`/`alt`, the two `.project__body p` paragraphs, and the `.project__next a` on each page.
- **About (`about.html`):** edit `.about__title`, `.about__intro`, `.about__body` and `.about__signoff`.
- **Contact (`contact.html`):** edit `.contact__title`, the `data-copy-email` value, the button text/`aria-label`, and the three `.contact__links` URLs.
- **Email:** change `hello@yourdomain.com` in `contact.html`; clicking the address copies it to the clipboard. There is no `mailto:` link in the nav overlay.
- **Socials:** replace the `github.com/yourname`, `linkedin.com/in/yourname` and `x.com/yourname` URLs in `contact.html`.
- **Artwork / favicon:** replace the files in `assets/img/` (keep the referenced names or update the `src` on each project page) and `assets/favicon.svg`.
- **SEO:** each page's `<title>` and `<meta name="description">` in its `<head>`.

## Design tweaks

- **Tokens:** `assets/css/style.css` → `:root` (`--paper`, `--ink`, `--font`, `--mono`, `--inset`, `--ease`).
- **ASCII scene:** `assets/js/site.js`, inside the `[data-ascii-orb]` block — `ramp`, `spin`, `radius`, `lightX` / `lightY` / `lightZ`, and the `morph` values that shape the transformed sphere.
- **Motion:** the movement is the slow ASCII turn, the sphere transform, the menu roll and the nav curtain. `prefers-reduced-motion` stops transitions and applies the sphere transform instantly.

## Behaviour notes

- The home ASCII sphere is a button: click/tap it, or focus it with Tab and press Enter or Space, to transform it; activate it again to restore it.
- The nav overlay is keyboard accessible: Escape closes it, focus moves in on open and returns to the trigger on close, and Tab is trapped while it is open.
- Layout adapts to tablet and mobile widths.
- Everything stays black and white and lowercase; keep new copy lowercase too, or the CSS will display it that way regardless.
