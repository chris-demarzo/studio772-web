# Studio 772

The business website for Studio 772 — a productized service building
clear, fast, mobile-first lead-generation websites for local service
businesses around Port St. Lucie and the Treasure Coast, Florida.

## Stack

- Astro 7, static output, zero client-side JavaScript
- TypeScript for config and tests
- Hand-written CSS with a documented token system (`src/styles/global.css`)
- Self-hosted variable fonts (Inter, Space Grotesk) via Fontsource
- Node test runner + html-validate + Playwright browser tests
- GitHub Actions verification, Cloudflare Pages-compatible output

## Changing business details

All business identity lives in **`src/site.config.ts`** — name, owner,
tagline, service area, and contact email. Rename the business or swap the
contact address by editing that one file.

The production URL (canonical links, sitemap, robots.txt, Open Graph URLs)
lives in **`astro.config.mjs`** as the `site` value. Update it once when a
custom domain is connected.

> **Before launch:** set a real address in `SITE.email` and flip
> `SITE.emailPending` to `false` to remove the placeholder notice on the
> contact page.

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:4321`.

## Quality checks

```bash
npm run verify
```

Runs, in order: Astro diagnostics, a production build, structural tests
(metadata, landmarks, internal-link integrity, copy-honesty guards),
HTML validation of the built output, and Playwright browser tests
(desktop + mobile) against the production build served by `astro preview`.

To run browser tests alone, build first: `npm run build && npm run test:browser`.

## Deployment (Cloudflare Pages)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `22` |

Security headers and cache policy ship in `public/_headers`. Note that the
Content-Security-Policy assumes no inline styles or scripts; the Astro
config sets `inlineStylesheets: 'never'` to guarantee this — keep the two
in sync if either changes.

## Content map

| Page | File |
|---|---|
| Home | `src/pages/index.astro` |
| Services & pricing | `src/pages/services.astro` |
| Process | `src/pages/process.astro` |
| About | `src/pages/about.astro` |
| Contact | `src/pages/contact.astro` |
| Privacy | `src/pages/privacy.astro` |
| 404 | `src/pages/404.astro` |

Open decisions and standing assumptions are tracked in
[`docs/DECISIONS.md`](docs/DECISIONS.md).
