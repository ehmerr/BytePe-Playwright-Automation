import { expect, test } from '../fixtures/testFixtures.js';
import { PRODUCTS } from '../fixtures/products.js';
import { PINCODES } from '../fixtures/pincodes.js';
import { CARDS } from '../fixtures/cards.js';

const PRODUCT = PRODUCTS.PIXEL_10;

/**
 * Anonymous coverage: everything reachable without an account.
 */
test.describe('E-commerce regression @regression', () => {
  test.skip(!process.env.BASE_URL, 'Set BASE_URL to run against the e-commerce application.');

  test('PDP supports storage, color and pincode selection', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);

    await pdp.selectStorage(PRODUCT.storage);
    await pdp.selectColor(PRODUCT.color);
    expect(await pdp.getSelectedColor()).toBe(PRODUCT.color);

    await pdp.changePincode(PINCODES.BENGALURU);
    await pdp.verifySubscriptionSelected();
  });

  test('buyback value responds to the duration slider', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);

    await pdp.setSubscriptionDuration(6);
    const shortTerm = {
      buyback: await pdp.getBuybackValue(),
      monthly: (await pdp.getSubscriptionPricing()).monthlyPrice,
    };

    await pdp.setSubscriptionDuration(24);
    const longTerm = {
      buyback: await pdp.getBuybackValue(),
      monthly: (await pdp.getSubscriptionPricing()).monthlyPrice,
    };

    // Buyback decreases the longer the device is kept.
    expect(longTerm.buyback).not.toBe(shortTerm.buyback);
    // The monthly price is deliberately invariant: the slider previews buyback,
    // it does not re-term the plan. Asserting otherwise would be a false failure.
    expect(longTerm.monthly).toBe(shortTerm.monthly);
  });

  test('upfront and subscription plans expose different actions', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);

    // Subscription is the default plan.
    await pdp.verifySubscriptionSelected();

    // Each selection asserts its own outcome inside the page object: upfront
    // swaps Subscribe for Add to Cart / Buy Now, and switching back reverses it.
    await pdp.selectUpfront();
    await pdp.selectSubscription();
    await pdp.verifySubscriptionSelected();
  });

  test('pricing block reports monthly, buyback and discount', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);

    const pricing = await pdp.getSubscriptionPricing();
    expect(pricing.monthlyPrice).toMatch(/₹[\d,]+\/mo/);
    expect(pricing.buybackValue).toMatch(/₹[\d,]+/);
    expect(pricing.totalDiscount).toMatch(/₹[\d,]+/);
  });

  test('BytePe Secure is offered on the subscription plan', async ({ home, pdp }) => {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);
    await pdp.verifyBytePeSecureIncluded();
  });
});

/**
 * Checkout coverage: review, coupons, addresses and payments.
 *
 * Every one of these journeys begins by clicking Subscribe, which raises an OTP
 * wall for anonymous sessions ("Enter mobile number to continue"). They cannot
 * pass without a signed-in storage state, so the suite skips rather than
 * reporting failures that are really a missing precondition.
 *
 * To enable: capture an authenticated session into `.auth/user.json` and point
 * STORAGE_STATE at it. See README "Authenticated coverage".
 */
test.describe('Checkout journey @regression @authenticated', () => {
  test.skip(
    !process.env.BASE_URL || !process.env.STORAGE_STATE,
    'Requires an authenticated session. Set STORAGE_STATE to a signed-in storage state file.',
  );

  test.use({ storageState: process.env.STORAGE_STATE });

  async function openReview(home, pdp) {
    await home.gotoProductDirect(PRODUCT.path);
    await pdp.verifyOpened(PRODUCT.name);
    await pdp.changePincode(PINCODES.NOIDA);

    const outcome = await pdp.clickSubscribe();
    expect(outcome, 'Session was not authenticated - Subscribe raised the OTP wall.').toBe('review');
  }

  test('review page opens from the PDP', async ({ home, pdp, review }) => {
    await openReview(home, pdp);
    await review.verifyOpened();
  });

  test('review supports address changes and replacing coupons', async ({ home, pdp, review }) => {
    await openReview(home, pdp);
    await review.verifyProductReadOnly();
    await review.verifyOrderSummaryVisible();
  });

  test('review continues to payments', async ({ home, pdp, review, payment }) => {
    await openReview(home, pdp);
    await review.clickContinue();
    await payment.verifyOpened();
  });

  /**
   * Retained from the original suite. The payment-page locators behind these
   * are the ONLY ones in the framework still unverified against a real screen,
   * because the page sits behind the OTP wall. Expect to correct them the first
   * time this block runs with a real session.
   */
  test('subscription credit card EMI redirects to gateway', async ({ home, pdp, review, payment }) => {
    await openReview(home, pdp);
    await review.clickContinue();
    await payment.verifyDefaultCCEMI();
    await payment.enterCardDetails(CARDS.VISA_EMI);
    await payment.clickPayNow();
  });

  test('cardless EMI redirects to lender', async ({ home, pdp, review, payment }) => {
    await openReview(home, pdp);
    await review.clickContinue();
    await payment.selectCardlessEMI();
    await payment.proceedWithCardlessEmi();
  });

  test('upfront EMI selection is exclusive', async ({ home, pdp, review, payment }) => {
    await openReview(home, pdp);
    await review.clickContinue();
    await payment.selectUpfrontEMI();
  });

  test('full payment supports UPI and redirects to gateway', async ({ home, pdp, review, payment }) => {
    await openReview(home, pdp);
    await review.clickContinue();
    await payment.selectPayFullAmount('UPI');
    await payment.proceedToPay();
  });
});
