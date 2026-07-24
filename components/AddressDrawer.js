import { expect } from '@playwright/test';
import { SELECTORS } from '../constants/selectors.js';
import { getLocator } from '../utils/locator.js';

export class AddressDrawer {
  constructor(page) {
    this.page = page;
    this.drawer = getLocator(page, SELECTORS.address.drawer);
    this.saveButton = getLocator(page, SELECTORS.address.save);
  }

  async selectAddress(label) {
    await expect(this.drawer).toBeVisible();
    await getLocator(this.page, SELECTORS.address.addressOption, { hasText: label }).click();
    await this.saveButton.click();
    await expect(this.drawer).toBeHidden();
  }
}
