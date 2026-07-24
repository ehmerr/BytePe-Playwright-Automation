/**
 * Products that exist in the stage-web.bytepe.com catalogue.
 *
 * The previous IPHONE_17 fixture had no counterpart on staging: the search
 * service answers `q=iPhone` with a fuzzy match on a Nike shoe named "air",
 * so every test keyed to it failed on a locator that could never resolve.
 * Verify a product still exists before relying on it:
 *   curl 'https://stage-web.bytepe.com/api/search-service/search?q=<term>'
 */
export const PRODUCTS = Object.freeze({
  PIXEL_10: {
    /** Search term typed into the header typeahead. */
    searchTerm: 'Pixel 10',
    /** Substring expected in the PDP <h6>, which renders as "googlePixel 10". */
    name: 'Pixel 10',
    /** Needed to disambiguate the suggestion row - see HomePage.openProduct. */
    brand: 'google',
    /** Direct PDP path - use to bypass search when testing the PDP itself. */
    path: '/pd/pixel-10/GOOSMMOBGV3OMK',
    storage: '256GB',
    color: 'Obsidian',
    duration: 24,
  },
});
