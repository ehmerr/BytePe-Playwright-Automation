import { expect } from '@playwright/test';
import { SELECTORS } from '../constants/selectors.js';
import { TIMEOUTS } from '../constants/timeouts.js';
import { getLocator, labelledValue } from '../utils/locator.js';

/**
 * The buyback slider is a MUI Slider over a native <input type="range">
 * (min 0, max 21, step="any"), whose axis is labelled 3 - 24 months.
 *
 * Two behaviours were confirmed against staging and drive this implementation:
 *
 * 1. `locator.fill()` does not work. MUI recomputes its own state from the
 *    pointer geometry, so filling "21" lands on 10. Arrow keys are the only
 *    input that moves the handle one predictable step at a time.
 * 2. Moving the slider changes the *assured buyback* value only. The monthly
 *    subscription price is identical at every position - the slider previews
 *    buyback per month, as its own caption says, and does not re-term the plan.
 */
const SLIDER_MIN_INDEX = 0;
const SLIDER_MAX_INDEX = 21;
const MONTHS_AT_MIN_INDEX = 3;

const monthsToIndex = (months) => months - MONTHS_AT_MIN_INDEX;
const indexToMonths = (index) => index + MONTHS_AT_MIN_INDEX;

export class SubscriptionComponent {
  constructor(page) {
    this.page = page;
    this.planSection = getLocator(page, SELECTORS.pdp.planSection).first();
    this.subscriptionTab = getLocator(page, SELECTORS.pdp.subscriptionTab).first();
    this.upfrontTab = getLocator(page, SELECTORS.pdp.upfrontTab).first();
    this.durationSlider = getLocator(page, SELECTORS.pdp.durationSlider).first();
    this.subscribeButton = getLocator(page, SELECTORS.pdp.subscribe);
  }

  async verifySelected() {
    await expect(this.planSection).toBeVisible();
    await expect(this.subscribeButton).toBeVisible();
  }

  async selectSubscription() {
    await this.subscriptionTab.click();
    await this.verifySelected();
  }

  async selectUpfront() {
    await this.upfrontTab.click();
  }

  /** @returns {Promise<number>} current slider index (0-21) */
  async getSliderIndex() {
    return Number(await this.durationSlider.inputValue());
  }

  /** @returns {Promise<number>} the month the slider currently previews (3-24) */
  async getDuration() {
    return indexToMonths(await this.getSliderIndex());
  }

  /** @returns {Promise<string>} the buyback figure for the current position */
  async getBuybackValue() {
    const value = await labelledValue(
      this.page,
      SELECTORS.pdpValueLabels.assuredBuyback,
    ).textContent();
    return (value ?? '').trim();
  }

  /**
   * Walks the handle to a slider index using arrow keys.
   * @param {number} targetIndex 0-21
   */
  async setSliderIndex(targetIndex) {
    if (
      !Number.isInteger(targetIndex) ||
      targetIndex < SLIDER_MIN_INDEX ||
      targetIndex > SLIDER_MAX_INDEX
    ) {
      throw new Error(
        `Slider index must be an integer between ${SLIDER_MIN_INDEX} and ${SLIDER_MAX_INDEX}. Received: ${targetIndex}`,
      );
    }

    await expect(this.durationSlider).toBeVisible();
    await this.durationSlider.scrollIntoViewIfNeeded();

    // The PDP re-renders when /variant-pricing resolves, which detaches the
    // focused node and swallows the keypress. Focus is therefore re-taken on
    // every step, and a step that does not land is retried.
    //
    // The budget allows a handful of lost presses on top of the longest
    // possible walk while staying well inside the test timeout: a stuck slider
    // has to fail on the assertion below, not by exhausting the whole test.
    const maxAttempts = SLIDER_MAX_INDEX + 8;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const current = await this.getSliderIndex();
      if (current === targetIndex) return;

      await this.durationSlider.focus();
      await this.page.keyboard.press(current < targetIndex ? 'ArrowRight' : 'ArrowLeft');
      // Not a conditional assertion: this is the poll that waits for the step to
      // land. A lost press is expected and retried; the real assertion is below.
      // eslint-disable-next-line playwright/no-conditional-expect
      await expect(this.durationSlider)
        .not.toHaveValue(String(current), { timeout: TIMEOUTS.SLIDER_STEP })
        .catch(() => {}); // press lost to a re-render - the next iteration repeats it
    }

    expect(
      await this.getSliderIndex(),
      `Slider did not reach index ${targetIndex} within ${maxAttempts} steps.`,
    ).toBe(targetIndex);
  }

  /**
   * Previews the buyback value for a given month.
   * @param {number} months between 3 and 24
   */
  async setDuration(months) {
    if (
      !Number.isInteger(months) ||
      months < MONTHS_AT_MIN_INDEX ||
      months > indexToMonths(SLIDER_MAX_INDEX)
    ) {
      throw new Error(
        `Duration must be an integer between ${MONTHS_AT_MIN_INDEX} and ${indexToMonths(SLIDER_MAX_INDEX)} months. Received: ${months}`,
      );
    }
    await this.setSliderIndex(monthsToIndex(months));
  }
}
