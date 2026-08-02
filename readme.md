# Cosmic Portfolio — an immersive astrophysics one-pager

A production-ready personal portfolio for an astrophysics & data-science researcher.
The site opens on a scroll-driven cosmic journey: a persistent WebGL scene in which the
camera travels between four procedural galaxies — one per research milestone — connected
by a progressively drawn, luminous blue route. A gravitational-lensing distortion follows
the cursor. After the fourth milestone the journey releases into a calm, editorial
long-scroll portfolio (papers, posters, slides, reports, about, CV & links).

Built with **Next.js (App Router) · React · TypeScript (strict) · React Three Fiber ·
Three.js · drei · GSAP ScrollTrigger · Lenis · CSS Modules** — no template, no component
library, custom GLSL throughout.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run typecheck  # strict TypeScript, no emit
npm run lint       # next lint (eslint-config-next)
npm run test       # vitest — redshift conversion utility
npm run build      # production build
npm run start      # serve the production build
```

Requires Node 18.17+ (developed on Node 24).

---

## File tree

```
├── package.json
├── tsconfig.json                  # strict TS, @/* → src/*
├── next.config.mjs
├── vitest.config.ts
├── .eslintrc.json                 # next/core-web-vitals (+ R3F prop override)
├── public/
│   ├── og.svg                     # Open Graph placeholder — replace with a PNG
│   ├── images/                    # portrait + paper/poster/report previews
│   ├── cv-placeholder.pdf         # original placeholder
│   └── files/                     # portfolio PDFs, PPTX and current CV
└── src/
    ├── app/
    │   ├── layout.tsx             # fonts, metadata, OG, JSON-LD, skip link
    │   ├── page.tsx               # journey + portfolio sections + footer
    │   ├── cv/                    # interactive HTML CV + embedded PDF reader
    │   ├── paper/                 # paper overview, figures, findings and PDF link
    │   ├── globals.css            # palette, focus states, CSS fallback
    │   ├── icon.svg               # favicon
    │   ├── admin/                 # ★ password-protected content editor (no code)
    │   └── api/content/route.ts   # secured read/write API (disk or GitHub commit)
    ├── content/
    │   ├── content.json           # ★ ALL editable text and preview paths
    │   ├── cv.ts                  # structured CV timeline and skill groups
    │   ├── types.ts               # shared content types
    │   └── site.ts                # 3D layout (galaxies, camera) + content merge
    ├── lib/
    │   ├── redshift.ts            # poetic redshift scale (tested)
    │   ├── redshift.test.ts
    │   ├── getContent.ts          # request-time content loader
    │   ├── galaxyPainter.ts       # procedural 2D galaxy painter + textures
    │   ├── journeyStore.ts        # mutable scroll/pointer state (no re-renders)
    │   ├── scrollBus.ts           # shared Lenis handle
    │   └── useMediaFlags.ts       # mobile / tablet / reduced-motion detection
    └── components/
        ├── CosmicJourney.tsx      # orchestrator: desktop / mobile / reduced-motion
        ├── CosmicCanvas.tsx       # R3F canvas, WebGL detection, pointer tracking
        ├── HeroContent.tsx        # crisp HTML hero (name, headline, buttons)
        ├── MilestoneOverlay.tsx   # HTML labels projected over the 3D scene
        ├── MilestoneCard.tsx      # milestone block for mobile / static variants
        ├── MobileJourney.tsx      # vertical sequence + SVG route (no hijacking)
        ├── StaticJourney.tsx      # prefers-reduced-motion overview
        ├── GalaxyCanvasView.tsx   # 2D-canvas galaxy (reuses the painter)
        ├── RedshiftChip.tsx       # z ≈ 1.8 × 10⁻¹¹ chip + tooltip
        ├── SmoothScroll.tsx       # Lenis ↔ GSAP wiring
        ├── SectionNavigation.tsx  # compact sticky index (after the journey)
        ├── three/
        │   ├── GalaxyField.tsx        # instanced LSST-like background sources
        │   ├── MainGalaxy.tsx         # billboarded procedural milestone galaxy
        │   ├── GalaxyRoute.tsx        # Catmull-Rom tube, progressive reveal shader
        │   ├── CameraRig.tsx          # camera travel along curve of keyframes
        │   ├── CursorLensingEffect.tsx# GLSL gravitational-lensing post pass
        │   ├── ScreenProjector.tsx    # 3D → screen-space label anchors
        │   └── VisibilityGuard.tsx    # pauses rendering when tab is hidden
        ├── sections/              # Papers, Posters, Slides, Reports, About, Links
        └── styles/                # journey / sections / nav CSS Modules
```

---

## Editing the content — no code required (/admin)

**All text lives in [`src/content/content.json`](src/content/content.json)** and can be
edited two ways:

1. **The `/admin` editor** (made for non-coders). Open `http://localhost:3000/admin`
   (or `https://your-site/admin` once deployed), enter the admin password, edit the
   fields and click **Enregistrer**. No layout or animation can be broken from there —
   the editor only touches text.
2. Editing `src/content/content.json` directly in any text editor.

### Admin security

The editor is protected by the `ADMIN_PASSWORD` environment variable (see
[.env.local](.env.local) locally — **change the default password**, and set the same
variable in your host's dashboard in production). Without it the editor is disabled.
The API compares passwords in constant time and never stores them.

### Uploading files (poster PDFs, CV, slides…)

Every link field in /admin has a **Téléverser…** button: pick a file (PDF, PNG, JPG,
WEBP or SVG, 15 MB max) and the field is filled automatically with its public path.
Files land in `public/uploads/` — written to disk locally / on a VPS, committed to
GitHub on Vercel (note: Vercel's request limit caps uploads there at roughly 3 MB;
bigger files can be added to `public/uploads/` in the repo by hand).

### How saving works, per host

- **Local dev / VPS** — the JSON file is written to disk; the site picks it up within
  ~10 seconds (`revalidate = 10` on the home page).
- **Vercel** (read-only filesystem) — set `GITHUB_TOKEN` (fine-grained token with
  *Contents: read & write* on the site's repo only) in the Vercel project settings.
  The target repo and branch are auto-detected from Vercel's system variables
  (`VERCEL_GIT_REPO_OWNER`/`_SLUG`, `VERCEL_GIT_COMMIT_REF`); set `GITHUB_REPO`
  (`user/repo`) and/or `GITHUB_BRANCH` only to override. Saving then commits
  `content.json` to GitHub, which triggers an automatic redeploy — changes go live in
  1–2 minutes. There is also a **Télécharger le JSON** button as a manual fallback.

### What is editable

- `identity` — name, portrait, role, headline, intro, e-mail, GitHub URL, CV path,
  site URL.
- `milestones` — the four cosmic-journey events (title, dates, description, link).
  Their *count* is locked to four: the 3D layout (galaxy positions, camera keyframes,
  galaxy looks) is code-owned in [`src/content/site.ts`](src/content/site.ts).
- `papers`, `posters`, `slides`, `reports`, `about`, `externalLinks` — the portfolio
  sections, with add/remove supported in the editor. Paper, poster and report entries
  accept a preview image and accessible alternative text.

The poetic redshift chips need no configuration: the most recent milestone is the
"observer" (z ≈ 0) and older events sit at higher z, like real lookback time.

The current CV and research documents are served from `public/files/`; their links are
defined in `content.json`. The CV is also available as an interactive page at `/cv`,
with structured sections and the original PDF reader. The featured publication has an
editorial overview at `/paper`, with two figures and a direct PDF link. The remaining visual placeholder is `og.svg` (ideally swap it
for a 1200×630 PNG and update `openGraph.images` in `src/app/layout.tsx`).

## Adjusting the galaxy visuals

Galaxies are **fully procedural** — no image assets. Each milestone's `look` in
`site.ts` controls the painter in [`src/lib/galaxyPainter.ts`](src/lib/galaxyPainter.ts):

- `seed` — deterministic star placement; change it for a different pattern.
- `arms`, `tightness` — number and winding of the logarithmic spiral arms.
- `inclination`, `positionAngle` — orientation of the disc on the sky.
- `core`, `arm`, `knot` (RGB) + `knotFraction` — colour temperature and HII-like knots.
- `agnStrength` — optional compact active nucleus strength (`0` to `1`).

The same painter feeds both the WebGL textures (`createGalaxyTexture`) and the 2D
`<canvas>` fallbacks used on mobile and under reduced motion. To use real imagery
instead, replace the `map` of `MainGalaxy`'s material with a `TextureLoader` texture
pointing at a local file in `public/` (do not hotlink remote assets).

Clouds follow the true local tangent of each logarithmic arm, with a continuous soft
ridge, offset dust lanes, young stellar associations and a continuous low-brightness
inter-arm disc. Their steep stellar-luminosity distribution produces many faint stars and only a few bright
sources. The four milestones use distinct `4 / 3 / 4 / 3` arm structures; galaxy 03
hosts the optional unresolved quasar.

Background density, lensing radius and other per-device budgets are set in
`CosmicJourney.tsx` (`fieldCount`, `lensingRadiusPx`).

---

## How the scroll architecture works

- The journey section is `400vh` tall; its `position: sticky` viewport holds the HTML
  overlay while one fixed WebGL canvas sits behind both the journey and the portfolio.
  CSS does the pinning — GSAP never fights the scrollbar — and there is no background
  swap when the sections begin.
- A single ScrollTrigger maps scroll progress (0 → 1) into a shared **mutable store**
  ([`journeyStore.ts`](src/lib/journeyStore.ts)): `stage = progress × 3` is the fractional
  milestone index. Nothing re-renders per frame; the R3F loop and an overlay rAF loop read
  the store directly.
- **CameraRig** threads the four per-milestone camera positions and look-at targets into
  two Catmull-Rom curves. The stage fraction is smoothstep-eased inside each segment (the
  camera dwells at milestones) and both position and target are exponentially damped, so
  the scrub stays responsive without snapping. The camera genuinely travels — each stage
  has a different position in space, not a zoom level.
- **GalaxyRoute** builds one Catmull-Rom tube from the first galaxy centre, through the
  four galaxies and into an exit that meets the section index. The fragment shader
  clips the tube at `uReveal` (eased + damped from the stage), draws a fainter hint
  segment ahead of it, glows at the drawing head and animates a travelling pulse. At
  stage 1 only the segment leaving galaxy 01 is visible; each transition draws the next
  leg.
- **MilestoneOverlay** keeps all milestone text as real HTML: `ScreenProjector` projects
  each galaxy's world position into screen space every frame, and the overlay moves its
  labels with transforms. Labels fade with a triangular "focus" function of the stage;
  only the active label is interactive (`aria-current="step"`).
- A scrubbed GSAP timeline handles the hero: it recedes slightly during stage 1 and fades
  fully near the end. The galaxies and route dissolve at release, while the deep field
  and cursor lensing remain active behind the portfolio.
- The opening loader stays above the SSR fallback until the complete WebGL scene has
  rendered two frames, then fades away without exposing partially painted textures.
- **Lenis** provides the smooth scrolling, driven from GSAP's ticker and wired to
  `ScrollTrigger.update`, and is disabled under `prefers-reduced-motion`.

### Shader implementation notes

- **GalaxyField** — a single `THREE.Points` draw call (~1 700 desktop / 900 tablet
  sources). Each point carries size, axis ratio, position angle, brightness, colour,
  depth layer and a rare "spike" flag; the fragment shader rotates `gl_PointCoord`,
  squashes it by the axis ratio and evaluates an elliptical Gaussian (a simplified
  Sérsic profile), so the field reads as barely resolved survey sources rather than a
  starfield. The whole field is camera-attached, with a per-depth-layer drift driven by
  scroll only — nothing in the scene reacts to mouse movement except the lens.
- **CursorLensingEffect** — a custom post pass (no postprocessing library): the scene is
  rendered into a `WebGLRenderTarget`, then a fullscreen triangle bends UVs radially
  around the smoothed pointer: `warp = dir · smoothstep(R,0,r) · strength / (r + 0.08)`,
  with slight magnification and per-channel offsets for a whisper of chromatic
  separation. There is deliberately no visible ring or hint — just the effect. The pass
  only touches the canvas — HTML text above it is never distorted — and is not mounted
  at all on touch devices.
- **GalaxyRoute** — additive tube shader described above; brightness peaks at the tube
  core via the view-normal rim term, keeping the line thin and luminous without bloom.

### The one-year redshift scale

Each milestone shows `z ≈ …` computed in [`src/lib/redshift.ts`](src/lib/redshift.ts)
via the low-redshift approximation `z ≈ H0 · Δt` with `H0 = 70 km/s/Mpc`
(≈ 2.27 × 10⁻¹⁸ s⁻¹), so one year ≈ Δz of 7.2 × 10⁻¹¹. The chip's tooltip states that
this is a poetic visual mapping, not a measured cosmological redshift. The conversion is
covered by unit tests (`npm run test`).

---

## Responsive & accessibility behaviour

- **Desktop** — full camera journey, lensing, parallax, pinned sequence.
- **Tablet** — reduced particle count, smaller lensing radius.
- **Mobile / touch** — no pinning or scroll hijacking: a vertical sequence of full-width
  milestones with the blue route drawn progressively as an SVG, particle systems removed.
- **`prefers-reduced-motion`** — no 400vh pin, no camera travel, no lensing, no Lenis: a
  static overview of the four connected galaxies with every link preserved.
- **No WebGL** — a static CSS starscape replaces the canvas.
- Semantic sections and headings, skip-to-content link, visible focus states,
  `aria-current` on the active section and milestone, keyboard-accessible controls, and
  all portfolio text rendered as real HTML for SEO.

Performance: DPR capped at 1.5, instanced/batched geometry (one draw call for the whole
field), rendering paused on hidden tabs, the 3D bundle lazy-loaded with `next/dynamic`,
and GSAP/WebGL resources disposed on unmount.

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New Project** → import the repo. Vercel
   auto-detects Next.js; no build configuration needed.
3. In the project's **Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD` — the /admin password;
   - `GITHUB_REPO`, `GITHUB_TOKEN` (and optionally `GITHUB_BRANCH`) — so /admin can
     save by committing to GitHub (each save auto-redeploys the site).
4. Set your production domain, then update `identity.siteUrl` (via /admin) so metadata
   and Open Graph URLs are correct.

CLI alternative:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

### Other hosts

Any Node.js host works (`npm run build` then `npm run start`), e.g. a VPS with pm2
behind a reverse proxy — there /admin writes the JSON directly to disk and the site
updates within seconds, no redeploy needed. Purely static hosting (plain HTML/PHP
shared hosting) cannot run the API routes, so the /admin editor would not work there.
