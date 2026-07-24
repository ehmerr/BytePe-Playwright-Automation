import { expect } from '@playwright/test';
import { SELECTORS, API } from '../constants/selectors.js';
import { getLocator } from '../utils/locator.js';

/**
 * Coupon controls on the review step. Behind the OTP wall, so unverified
 * against a real screen.
 */
export class CouponComponent {
  constructor(page) {
    this.page = page;
    this.input = getLocator(page, SELECTORS.coupon.input);
    this.applyButton = getLocator(page, SELECTORS.coupon.apply);
    this.removeButton = getLocator(page, SELECTORS.coupon.remove);
    this.appliedCode = getLocator(page, SELECTORS.coupon.appliedCode);
  }

  async apply(code) {
    await this.input.fill(code);
    await Promise.all([
      this.page.waitForResponse((response) => API.COUPON.test(response.url()) && response.ok()),
      this.applyButton.click(),
    ]);
    await expect(this.appliedCode).toHaveText(code);
  }

  async remove() {
    await Promise.all([
      this.page.waitForResponse((response) => API.COUPON.test(response.url()) && response.ok()),
      this.removeButton.click(),
    ]);
    await expect(this.appliedCode).toBeHidden();
  }
}
