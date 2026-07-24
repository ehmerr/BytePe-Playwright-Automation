export const TIMEOUTS = Object.freeze({
  /** Ordinary UI transitions already on screen. */
  UI: 10_000,
  /** A single backend round trip. */
  API: 15_000,
  /** Full page navigation. */
  NAVIGATION: 30_000,
  /**
   * PDP variant data (color name, pricing, buyback). It arrives from
   * /api/apps/variant-pricing after the initial render, is re-fetched whenever
   * the variant changes, and is the slowest thing the tests wait on when
   * several workers share the staging environment.
   */
  VARIANT: 30_000,
  /** A single keyboard step on the buyback slider. */
  SLIDER_STEP: 2_000,
});
