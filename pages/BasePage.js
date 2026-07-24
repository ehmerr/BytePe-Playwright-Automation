import { expect } from '@playwright/test';
import { getLocator as getLocatorUtil } from '../utils/locator.js';

/**
 * Shared foundation for all page objects.
 * 
 * Concrete pages should expose business operations and keep selector details
 * private to the page object. This class centralizes reliable interactions so
 * tests do not need arbitrary waits or direct locator access.
 */
export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Get a Playwright locator from a selector object (from constants/selectors.js)
   * @param {Object} selector - selector object from SELECTORS
   * @param {Object} [extraOptions] - extra options to pass to the locator, e.g., { hasText: 'something' }
   * @returns {import('@playwright/test').Locator}
   */
  getLocator(selector, extraOptions = {}) {
    return getLocatorUtil(this.page, selector, extraOptions);
  }

  /**
   * Navigates to an application route and waits until the UI is ready to use.
   * @param {string} path
   */
  async goto(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.page.locator('body').waitFor({ state: 'visible' });
  }

  /**
   * Clicks only after the target becomes actionable.
   * @param {import('@playwright/test').Locator} locator
   */
  async click(locator) {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
    await locator.click();
  }

  /**
   * Replaces an input value only after the input becomes actionable.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} value
   */
  async fill(locator, value) {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
    await locator.fill(value);
  }

  /**
   * Types a value with real key events, one character at a time.
   *
   * `fill()` sets the value in a single synthetic event. WebKit does not run
   * the React onChange handlers these MUI inputs rely on when that happens, so
   * the search typeahead never fires its request and the pincode Check button
   * stays disabled. Use this for any input whose handler drives app behaviour.
   *
   * Deliberately focuses rather than clicks: the site renders its header twice
   * and the two search inputs overlap, so a click hit-tests onto the other
   * header's input and never lands.
   *
   * @param {import('@playwright/test').Locator} locator
   * @param {string} value
   */
  async typeText(locator, value) {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();

    // A re-render mid-sequence drops keystrokes, which leaves a short pincode
    // that never enables Check. Confirm the value landed and retype if not.
    for (let attempt = 0; attempt < 3; attempt++) {
      await locator.focus();
      await locator.fill('');
      await locator.pressSequentially(value, { delay: 30 });

      const landed = await locator
        .inputValue()
        .then((current) => current === value)
        .catch(() => false);
      if (landed) return;
    }

    await expect(locator).toHaveValue(value);
  }

  /**
   * Selects an option by its user-facing label.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} label
   */
  async selectByLabel(locator, label) {
    await expect(locator).toBeVisible();
    await locator.selectOption({ label });
  }

  /**
   * Waits for a route change and performs the action that triggers it.
   * @param {string|RegExp} url
   * @param {() => Promise<unknown>} action
   */
  async performAndWaitForURL(url, action) {
    await Promise.all([
      this.page.waitForURL(url),
      action(),
    ]);
  }

  /**
   * Waits for a matching API response and performs the action that triggers it.
   * @param {string|RegExp|((response: import('@playwright/test').Response) => boolean)} urlOrPredicate
   * @param {() => Promise<unknown>} action
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async performAndWaitForResponse(urlOrPredicate, action) {
    const [response] = await Promise.all([
      this.page.waitForResponse(urlOrPredicate),
      action(),
    ]);

    return response;
  }

  /**
   * Returns a locator scoped to the current page by its stable test id.
   * @param {string} testId
   */
  getByTestId(testId) {
    return this.page.getByTestId(testId);
  }

  /**
   * Checks that a user-facing status message is visible.
   * @param {string|RegExp} message
   */
  async expectStatusMessage(message) {
    await expect(this.page.getByRole('status')).toContainText(message);
  }
}
