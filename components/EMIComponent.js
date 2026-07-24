import { expect } from '@playwright/test';
import { SELECTORS } from '../constants/selectors.js';
import { getLocator } from '../utils/locator.js';

export class EMIComponent {
  constructor(page) {
    this.page = page;
    this.cardNumber = getLocator(page, SELECTORS.payment.cardNumber);
    this.expiry = getLocator(page, SELECTORS.payment.cardExpiry);
    this.cvv = getLocator(page, SELECTORS.payment.cardCvv);
    this.cardholderName = getLocator(page, SELECTORS.payment.cardholderName);
    this.payNowButton = getLocator(page, SELECTORS.payment.payNow);
  }

  async enterCardDetails({ number, expiry, cvv, holderName }) {
    await this.cardNumber.fill(number);
    await this.expiry.fill(expiry);
    await this.cvv.fill(cvv);
    await this.cardholderName.fill(holderName);
  }

  async verifyCardFormVisible() {
    await expect(this.cardNumber).toBeVisible();
    await expect(this.payNowButton).toBeVisible();
  }
}
