/**
 * Single source of truth for business identity.
 *
 * To rename the business, change contact details, or adjust the service
 * area, edit this file only — every page reads from it.
 *
 * The production URL lives in astro.config.mjs (the `site` value).
 */
export const SITE = {
  /** Business name shown in the header, footer, and page titles. */
  name: 'Studio 772',

  /** The person behind the business. */
  owner: 'Chris DeMarzo',

  /** Short positioning line used in the footer and meta descriptions. */
  tagline: 'Clear, fast websites for local service businesses',

  /** Geographic focus, written the way it should appear in copy. */
  serviceArea: 'Port St. Lucie & the Treasure Coast, Florida',

  /**
   * CONTACT BOUNDARY — real inbox on iCloud+ custom domain,
   * verified round-trip (send + reply) on 2026-07-17.
   */
  email: 'chris@studio772.com',
  emailPending: false,
} as const;
