# Sachman Singh — personal site

An over-engineered, award-style single-page site. Vanilla **TypeScript** + **Vite**,
**Lenis** smooth scroll, **GSAP/ScrollTrigger** animation, **Three.js** 3D section.
No UI framework.

## Run

```bash
npm install
npm run dev        # local dev
npm run typecheck  # tsc --noEmit
npm run build      # static output -> /dist
npm run preview    # serve the production build
```

## Deploy (Vercel)

Static build. Push to GitHub, import to Vercel — `vercel.json` already sets
`framework: vite`, build `npm run build`, output `dist`. Add the domain in the
Vercel dashboard.

## Structure

```
index.html              # all section markup + cursor + preloader
src/
  main.ts               # boot: smooth scroll, cursor, sections, preloader, deferred 3D
  styles/               # tokens.css (design tokens), base.css, sections.css
  lib/                  # cursor, smoothScroll, reveal (hero centerpiece), scrollFx, three-hero
  sections/             # preloader, hero, about, things, projects, contact
public/assets/          # hero + section imagery
```

## Hero identities

The hero cursor-reveal cycles between two riding-themed identities:

- **Ride Mode** (red) — `face-ride.jpg` ↔ `helmet-ride.jpg`
- **Road Mode** (lime) — `face-road.jpg` ↔ `gear-road.jpg`

To add the **fighter** identity later: drop `face-fight.jpg` and
`helmet-fight.jpg` into `public/assets/`, then add a third entry to the
`IDENTITIES` array in `src/lib/reveal.ts` with `accent: '#c8ff00'`.

## TODO before launch

1. **Projects** — real links + screenshots in `src/sections/projects.ts`
   (cards without a `link` show a "TODO · link" badge).
2. **Contact** — set `email` and `instagram` in `src/sections/contact.ts`
   (currently placeholder links flagged "TODO").
3. **3D model** *(optional)* — drop a `model.glb` into `public/assets/`; it
   loads automatically (centered + scaled). Without it, a procedural
   wireframe icosahedron renders instead.

## Accessibility

Honors `prefers-reduced-motion`: skips the preloader animation, disables Lenis,
jumps scroll-ins to final state, freezes the reveal auto-demo, and renders a
static 3D frame.
