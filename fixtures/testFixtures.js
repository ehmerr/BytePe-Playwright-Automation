import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage.js';
import { PDPPage } from '../pages/PDPPage.js';
import { ReviewPage } from '../pages/ReviewPage.js';
import { PaymentPage } from '../pages/PaymentPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

export const test = base.extend({
  home: async ({ page }, use) => use(new HomePage(page)),
  pdp: async ({ page }, use) => use(new PDPPage(page)),
  review: async ({ page }, use) => use(new ReviewPage(page)),
  payment: async ({ page }, use) => use(new PaymentPage(page)),
  api: async ({ request }, use) => use(new ApiHelper(request)),
});

export { expect } from '@playwright/test';
