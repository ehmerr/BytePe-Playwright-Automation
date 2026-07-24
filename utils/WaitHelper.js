import { expect } from '@playwright/test';
import { TIMEOUTS } from '../constants/timeouts.js';

export class WaitHelper {
  static async forVisible(locator, timeout = TIMEOUTS.UI) {
    await expect(locator).toBeVisible({ timeout });
  }

  static async forResponse(page, urlOrPredicate, timeout = TIMEOUTS.API) {
    return page.waitForResponse(urlOrPredicate, { timeout });
  }

  static async forUrl(page, url, timeout = TIMEOUTS.NAVIGATION) {
    await page.waitForURL(url, { timeout });
  }
}
