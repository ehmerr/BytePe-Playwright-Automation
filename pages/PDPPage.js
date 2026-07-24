import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { SELECTORS, API } from '../constants/selectors.js';
import { ROUTES } from '../constants/routes.js';
import { TIMEOUTS } from '../constants/timeouts.js';
import { SubscriptionComponent } from '../components/SubscriptionComponent.js';
import { labelledValue } from '../utils/locator.js';

export class PDPPage extends BasePage {
  constructor(page) {
    super(page);
    this.subscription = new SubscriptionComponent(page);
    this.productTitle = this.getLocator(SELECTORS.pdp.productTitle);
    this.pincodeInput = this.getLocator(SELECTORS.pdp.pincodeInput);
    this.pincodeCheck = this.getLocator(SELECTORS.pdp.pincodeCheck);
    this.subscribeButton = this.getLocator(SELECTORS.pdp.subscribe);
    this.buyNowButton = this.getLocator(SELECTORS.pdp.buyNow);
    this.addToCartButton = this.getLocator(SELECTORS.pdp.addToCart);
    this.cardlessEmi = this.getLocator(SELECTORS.pdp.cardlessEmi);
    /** The color label once its name is populated. */
    this.colorLabel = this.getLocator(SELECTORS.pdp.colorLabel);
    /** The color label in any state - used to reach the swatch row. */
    this.colorRow = this.getLocator(SELECTORS.pdp.colorRow);
  }

  /**
   * @param {string} productName matched case-insensitively; the heading renders
   *   brand and model together, e.g. "googlePixel 10".
   */
  async verifyOpened(productName) {
    await expect(this.productTitle).toBeVisible();
    await expect(this.productTitle).toContainText(new RegExp(productName, 'i'));
    await this.waitForVariantReady();
  }

  /**
   * Blocks until the variant-dependent parts of the page are populated.
   *
   * The PDP renders its shell first and fills in color, pricing and buyback
   * once /api/apps/variant-pricing resolves. Reading through that gap yields a
   * bare "Color -" and empty prices, which is the single cause behind most of
   * the flakiness this suite used to show. Gate once here rather than granting
   * every individual read a long timeout.
   */
  async waitForVariantReady() {
    await expect(this.colorLabel.first()).toHaveText(/Color\s*-\s*\S+/, {
      timeout: TIMEOUTS.VARIANT,
    });
  }

  async verifySubscriptionSelected() { await this.subscription.verifySelected(); }

  async selectSubscription() {
    await this.subscription.selectSubscription();
    await expect(this.buyNowButton).toBeHidden();
  }

  /** Switching to upfront swaps Subscribe for Add to Cart / Buy Now. */
  async selectUpfront() {
    await this.subscription.selectUpfront();
    await expect(this.buyNowButton).toBeVisible();
    await expect(this.addToCartButton).toBeVisible();
    await expect(this.subscribeButton).toBeHidden();
  }

  /**
   * Storage variants render as chips labelled with the capacity, e.g. "256GB".
   * Single-variant products expose exactly one, already selected.
   * @param {string} storage
   */
  async selectStorage(storage) {
    // The control is a MUI Chip (a div carrying role="button"). WebKit does not
    // surface that role, so fall back to matching the capacity text itself.
    const option = this.page
      .getByRole('button', { name: storage, exact: true })
      .or(this.page.getByText(storage, { exact: true }))
      .first();

    await expect(
      option,
      `Storage option "${storage}" is not offered for this product.`,
    ).toBeVisible();
    await option.click();

    // Changing variant re-triggers the pricing fetch.
    await this.waitForVariantReady();
  }

  /**
   * Selects a color swatch.
   *
   * The swatches are MUI icon buttons carrying no accessible name, title or
   * aria-label - only a colored div - so they cannot be addressed by name.
   * Each is tried in turn and the "Color - <name>" label is what confirms the
   * result, which is also the only way to fail honestly when the color is not
   * offered.
   *
   * @param {string} color expected color name
   */
  async selectColor(color) {
    const wanted = color.toLowerCase();
    if ((await this.getSelectedColor()).toLowerCase() === wanted) return;

    const swatches = this.colorRow.first().locator('..').getByRole('button');
    const count = await swatches.count();

    for (let index = 0; index < count; index++) {
      await swatches.nth(index).click();
      await this.waitForVariantReady();
      if ((await this.getSelectedColor()).toLowerCase() === wanted) return;
    }

    throw new Error(
      `Color "${color}" is not offered for this product. Available swatches: ${count}.`,
    );
  }

  /**
   * Returns the currently selected color, e.g. "Obsidian".
   * Assumes the variant data has landed - call after `verifyOpened()`.
   */
  async getSelectedColor() {
    const label = this.colorLabel.first();
    await expect(label).toHaveText(/Color\s*-\s*\S+/, { timeout: TIMEOUTS.VARIANT });
    const text = (await label.textContent()) ?? '';
    return text.replace(/^\s*Color\s*-\s*/i, '').trim();
  }

  /**
   * The Check button stays disabled until the field holds a pincode, and the
   * lookup resolves through /api/pincodes/info/<pincode>.
   * @param {string} pincode
   */
  async changePincode(pincode) {
    await this.typeText(this.pincodeInput, pincode);
    await expect(this.pincodeCheck).toBeEnabled();
    await this.performAndWaitForResponse(
      (response) => API.PINCODE.test(response.url()),
      () => this.pincodeCheck.click(),
    );
  }

  /**
   * Previews the buyback value for a given month.
   * @param {number} months 3-24
   */
  async setSubscriptionDuration(months) {
    await this.subscription.setDuration(months);
  }

  /** @returns {Promise<number>} the month the buyback slider currently previews */
  async getSubscriptionDuration() {
    return this.subscription.getDuration();
  }

  /** @returns {Promise<string>} buyback figure for the current slider position */
  async getBuybackValue() {
    return this.subscription.getBuybackValue();
  }

  /**
   * Reads the pricing block by label rather than by currency shape - a bare
   * `/₹[\d,]+/` matches 17 nodes on this page.
   */
  async getSubscriptionPricing() {
    const { monthlySubscription, assuredBuyback, totalDiscount } = SELECTORS.pdpValueLabels;
    const monthly = labelledValue(this.page, monthlySubscription);
    await expect(monthly).toHaveText(/₹[\d,]+/, { timeout: TIMEOUTS.VARIANT });

    return {
      monthlyPrice: (await monthly.textContent())?.trim(),
      buybackValue: (await labelledValue(this.page, assuredBuyback).textContent())?.trim(),
      totalDiscount: (await labelledValue(this.page, totalDiscount).textContent())?.trim(),
    };
  }

  /** @param {boolean} eligible */
  async verifyCardlessEmiVisibility(eligible) {
    if (eligible) await expect(this.cardlessEmi).toBeVisible();
    else await expect(this.cardlessEmi).toBeHidden();
  }

  /**
   * BytePe Secure is offered at ₹1 against an ₹8,000 cover.
   * The block is part of the variant-rendered section, so it gates on the same
   * readiness signal rather than trusting the caller to have done so.
   */
  async verifyBytePeSecureIncluded() {
    await this.waitForVariantReady();
    const secure = this.getLocator(SELECTORS.pdp.secureInsurance).first();
    await expect(secure).toBeVisible({ timeout: TIMEOUTS.VARIANT });
    await expect(labelledValue(this.page, 'BytePe Secure')).toHaveText(/₹\s*1\b/);
  }

  /**
   * Subscribing is gated behind an OTP wall for anonymous sessions, so this
   * resolves to whichever arrives first: the review page, or the login prompt.
   * @returns {Promise<'review'|'login'>}
   */
  async clickSubscribe() {
    await this.click(this.subscribeButton);

    const loginWall = this.getLocator(SELECTORS.auth.mobileWall);
    await expect(async () => {
      const onReview = ROUTES.REVIEW.test(this.page.url());
      const needsLogin = await loginWall.isVisible().catch(() => false);
      expect(
        onReview || needsLogin,
        'Subscribe led to neither the review page nor the login prompt.',
      ).toBe(true);
    }).toPass({ timeout: TIMEOUTS.NAVIGATION });

    return ROUTES.REVIEW.test(this.page.url()) ? 'review' : 'login';
  }

  /** True when the anonymous-session OTP prompt is on screen. */
  async isLoginRequired() {
    return this.getLocator(SELECTORS.auth.mobileWall).isVisible().catch(() => false);
  }
}
