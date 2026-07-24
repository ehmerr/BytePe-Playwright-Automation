import { expect } from '@playwright/test';
import { SELECTORS } from '../constants/selectors.js';
import { getLocator } from '../utils/locator.js';

export class OrderSummaryComponent {
  constructor(page) {
    this.page = page;
    this.container = getLocator(page, SELECTORS.orderSummary.container);
    this.total = getLocator(page, SELECTORS.orderSummary.total);
    this.savings = getLocator(page, SELECTORS.orderSummary.savings);
    this.interest = getLocator(page, SELECTORS.orderSummary.interest);
  }

  async verifyVisible() {
    await expect(this.container).toBeVisible();
  }
  async verifyTotal(expected) {
    await expect(this.total).toContainText(expected);
  }
  async verifySavings(expected) {
    await expect(this.savings).toContainText(expected);
  }
  async verifyInterest(expected) {
    await expect(this.interest).toContainText(expected);
  }
}
