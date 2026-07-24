import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { ROUTES } from '../constants/routes.js';
import { SELECTORS, API } from '../constants/selectors.js';
import { escapeRegExp } from '../utils/locator.js';

export class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.heroHeading = this.getLocator(SELECTORS.home.heroHeading);
    this.searchInput = this.getLocator(SELECTORS.home.searchInput);
  }

  async goto() {
    await super.goto(ROUTES.HOME);
    await expect(this.heroHeading).toBeVisible();
  }

  async verifyLoaded() {
    await expect(this.heroHeading).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  /**
   * Types into the header search box and waits for the suggestion API to answer.
   *
   * The dropdown is a typeahead backed by /api/search-service/search. It always
   * renders a default list, so "results appeared" is not evidence the query
   * matched - the returned hits have to be inspected.
   *
   * @param {string} term
   * @returns {Promise<string[]>} product names returned for the term
   */
  async searchProduct(term) {
    // The typeahead is debounced per keystroke, so several requests are in
    // flight. Match the one carrying the complete term, not just the first.
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => {
        if (!API.SEARCH.test(r.url()) || !r.ok()) return false;
        const query = new URL(r.url()).searchParams.get('q') ?? '';
        return query.toLowerCase() === term.toLowerCase();
      }),
      this.typeText(this.searchInput, term),
    ]);

    const body = await response.json().catch(() => null);
    const hits = body?.data?.hits ?? [];
    return hits.map((hit) => hit.name);
  }

  /**
   * Opens a product from the typeahead dropdown.
   *
   * Suggestion rows are <li> wrappers around a button whose accessible name
   * repeats the product name and brand, so the row is matched on text and the
   * button inside it is clicked.
   *
   * @param {string} productName
   * @param {string} brand required to pin the row exactly
   */
  async openProduct(productName, brand) {
    // A substring match on "Pixel 10" also hits the "Pixel 10a" and
    // "Pixel 10 Pro Fold" rows, and both sort above it. Row text concatenates
    // with no separator ("Pixel 10google"), so name+brand anchored end to end
    // is what identifies a single row.
    const rowText = brand
      ? new RegExp(`^${escapeRegExp(productName)}\\s*${escapeRegExp(brand)}$`, 'i')
      : new RegExp(`^${escapeRegExp(productName)}$`, 'i');

    const suggestion = this.getLocator(SELECTORS.home.suggestion)
      .filter({ hasText: rowText })
      .first();

    await expect(
      suggestion,
      `No search suggestion matched "${productName}". The staging catalogue may not stock it.`,
    ).toBeVisible();

    await Promise.all([
      this.page.waitForURL(ROUTES.PDP),
      suggestion.getByRole('button').first().click(),
    ]);
  }

  /**
   * Convenience for tests that only need to reach a PDP, bypassing the typeahead.
   * @param {string} path e.g. /pd/pixel-10/GOOSMMOBGV3OMK
   */
  async gotoProductDirect(path) {
    await super.goto(path);
  }
}
