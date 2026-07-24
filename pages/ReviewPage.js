import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { ROUTES } from '../constants/routes.js';
import { SELECTORS } from '../constants/selectors.js';
import { AddressDrawer } from '../components/AddressDrawer.js';
import { CouponComponent } from '../components/CouponComponent.js';
import { OrderSummaryComponent } from '../components/OrderSummaryComponent.js';

/**
 * The review step. Reachable only with an authenticated session - see the
 * `@authenticated` block in regression.spec.js. These locators are unverified
 * against a real screen.
 */
export class ReviewPage extends BasePage {
  constructor(page) {
    super(page);
    this.addressDrawer = new AddressDrawer(page);
    this.coupon = new CouponComponent(page);
    this.orderSummary = new OrderSummaryComponent(page);
    this.productTitle = this.getLocator(SELECTORS.review.productTitle);
    this.productDetails = this.getLocator(SELECTORS.review.productDetails);
    this.changeAddressButton = this.getLocator(SELECTORS.review.changeAddress);
    this.continueButton = this.getLocator(SELECTORS.review.continue);
  }

  async verifyOpened() {
    await expect(this.page).toHaveURL(ROUTES.REVIEW);
    await expect(this.productTitle).toBeVisible();
  }

  /**
   * The review step must present the order as read-only.
   *
   * This previously scoped the search to the product heading, and a heading can
   * never contain form controls - so the assertion passed unconditionally and
   * tested nothing. It now scopes to the surrounding panel.
   */
  async verifyProductReadOnly() {
    await expect(this.productDetails).toBeVisible();
    await expect(
      this.productDetails.locator('input:not([type="hidden"]), select, textarea'),
    ).toHaveCount(0);
  }

  async changeAddress(addressLabel) {
    await this.click(this.changeAddressButton);
    await this.addressDrawer.selectAddress(addressLabel);
  }

  async applyCoupon(code) {
    await this.coupon.apply(code);
  }
  async removeCoupon() {
    await this.coupon.remove();
  }
  async verifyOrderSummaryVisible() {
    await this.orderSummary.verifyVisible();
  }

  async clickContinue() {
    await this.performAndWaitForURL(ROUTES.PAYMENTS, () => this.continueButton.click());
  }
}
