import { expect, test } from '../fixtures/testFixtures.js';
import { PRODUCTS } from '../fixtures/products.js';
import { PINCODES } from '../fixtures/pincodes.js';

const PRODUCT = PRODUCTS.PIXEL_10;

test.describe('E-commerce smoke @smoke', () => {
  test.skip(!process.env.BASE_URL, 'Set BASE_URL to run against the e-commerce application.');

  test('homepage loads', async ({ home }) => {
    await home.goto();
    await home.verifyLoaded();
  });

  test('search returns the product in the suggestion API', async ({ home }) => {
    await home.goto();
    const names = await home.searchProduct(PRODUCT.searchTerm);

    // The typeahead always renders a default list, so assert on the payload:
    // a rendered dropdown is not evidence that the query matched anything.
    expect(
      names.some((name) => new RegExp(PRODUCT.name, 'i').test(name)),
      `Search for "${PRODUCT.searchTerm}" returned: ${names.join(', ') || '(nothing)'}`,
    ).toBe(true);
  });

  test('search opens product PDP with subscription selected', async ({ home, pdp }) => {
    await home.goto();
    await home.searchProduct(PRODUCT.searchTerm);
    await home.openProduct(PRODUCT.name, PRODUCT.brand);
    await pdp.verifyOpened(PRODUCT.name);
    await pdp.verifySubscriptionSelected();
  });

  test('PDP exposes storage, color, pincode and duration controls', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);

    await pdp.selectStorage(PRODUCT.storage);
    expect(await pdp.getSelectedColor()).toBeTruthy();
    await pdp.changePincode(PINCODES.NOIDA);

    await pdp.setSubscriptionDuration(24);
    expect(await pdp.getSubscriptionDuration()).toBe(24);
  });

  test('subscribing prompts for login on an anonymous session', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);
    await pdp.changePincode(PINCODES.NOIDA);

    // Documents the current gate: checkout is unreachable without an OTP login.
    // The authenticated journey lives in regression.spec.js behind storageState.
    expect(await pdp.clickSubscribe()).toBe('login');
  });
});
