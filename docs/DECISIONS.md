# Decisions and open items

A running record of assumptions behind this site and decisions still open.
Update when anything here is resolved.

## Decided (2026-07-17)

| Decision | Choice | Notes |
|---|---|---|
| Business name | **Studio 772** (renamed 2026-07-17, was DeMarzo Web) | The 772 area code = the Treasure Coast; instantly local, modern-studio sound. Chosen after two candidate rounds with live RDAP domain checks and collision searches (Sailfish/Treasure Coast/Sandbar directions all had incumbent conflicts; Studio 772 came back clean). Centralized in `src/site.config.ts`. |
| Domain | studio772.com | **Purchased via Cloudflare Registrar and LIVE 2026-07-17.** Custom domain + www attached, TLS valid, canonical/sitemap/robots verified against production. Pages git integration reconnected after a disconnect (rebrand deploy required a trigger push). |
| Repo/directory | `studio772-web` | Renamed from `demarzo-web` after launch; Git history is preserved. The GitHub repository is `chris-demarzo/studio772-web`; confirm Cloudflare Pages continues to build from the renamed repository. |
| Niche & geography | Local service businesses, Port St. Lucie / Treasure Coast, FL | |
| Public pricing | Shown, with honest founding-client framing | Founding $1,200–$1,500; standard $1,800–$2,500; 50% deposit; two revision rounds. |
| Contact method | `mailto:` from `SITE.email` | Placeholder address until the business inbox exists. |
| Visual direction (superseded 2026-09-28) | Dark-first "proposal document, made visual" — deep blue-black, luminous teal, blueprint grid textures, ruler-tick underlines, Space Grotesk + Inter, mono spec accents | Zero client-side JS. Chosen 2026-07-17 over a light variant after side-by-side comparison; the light version is preserved on the `design/light` branch. |
| Run PSL framing (superseded 2026-09-28) | Owned demonstration project, explicitly labeled | Never described as client work; no invented metrics. |
| Refresh: "See it first" (2026-09-28) | Warm off-white + ink + hot orange; Bricolage Grotesque + DM Sans (self-hosted); homepage leads with the free one-page concept offer and a CSS-only concept switcher (fictional businesses, labeled). | Chosen by Chris from the 002 sketch round (option C) to be live before the Sep 28–Oct 11 email test. |
| Work page / Run PSL | Removed 2026-09-28; `/work/` 301s to `/`. About keeps one marathon-runner line. | Live Run PSL is the older plain version and its listings are stale; revisit if the volt version is updated and deployed. |

## Assumptions (unvalidated — revisit)

- **Pricing is a working hypothesis**, not validated market pricing. The
  site presents the numbers as *my* quoted ranges, which is honest, but the
  ranges themselves may need adjustment after real conversations.
- **Care plan pricing** is intentionally unnumbered on the site ("details
  with your quote") because no figure has been decided.

## Launch (2026-07-17)

All launch blockers closed in one day: name (Studio 772), domain
(studio772.com via Cloudflare Registrar), Pages custom domain + TLS,
git integration repaired, about page personalized, and a working
business inbox. The site is fully open for business.
- The "reply within one business day" commitment on the contact page is a
  service promise Chris must actually be able to keep.

## Open items (blockers before launch)

1. ~~**Business email**~~ — DONE 2026-07-17: chris@studio772.com live on
   iCloud+ custom domain (MX/SPF/DKIM verified in DNS), send + reply
   round-trip tested by Chris. `SITE.email` set, `emailPending` false.
   Reminder: Cloudflare Email Routing must stay OFF (MX conflict).
2. ~~**Domain**~~ — DONE 2026-07-17: studio772.com live end-to-end
   (registered, attached to Pages with www, TLS + headers + sitemap
   verified in production).
3. ~~**About-page personalization**~~ — done 2026-07-17: added "Who I am"
   (25+ years in PSL, insurance day job serving local businesses, marathon
   runner / Run PSL origin, 2021 AT thru-hike, family). All facts supplied
   by Chris; passes the copy-honesty gate.
4. ~~**Cloudflare Pages deploy**~~ — done 2026-07-17. Chris connected the
   Git integration and production was initially live at
   https://demarzo-web.pages.dev with security headers, sitemap, custom 404,
   and CSP verified against the live deployment. The GitHub repository was
   renamed to `studio772-web` post-launch; confirm the Pages integration and
   preview URL after the next deployment.

## Deferred by design (not gaps)

- Contact form with a backend/provider — mailto is the v1 boundary.
- Structured data (LocalBusiness JSON-LD) — deferred until there's a real
  business address and domain; publishing it without one would be
  premature or inaccurate.
- Analytics — none, and the privacy page promises to disclose before any
  are added.
- Color-scheme toggle — the v1 site uses one deliberate dark-first theme.
