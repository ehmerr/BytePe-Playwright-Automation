import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { ROUTES } from '../constants/routes.js';
import { SELECTORS } from '../constants/selectors.js';
import { EMIComponent } from '../components/EMIComponent.js';
import { OrderSummaryComponent } from '../components/OrderSummaryComponent.js';

export class PaymentPage extends BasePage {
  constructor(page) {
    super(page);
    this.emi = new EMIComponent(page);
    this.orderSummary = new OrderSummaryComponent(page);
    this.subscription = this.getLocator(SELECTORS.payment.subscription);
    this.upfront = this.getLocator(SELECTORS.payment.upfront);
    this.creditCardEmi = this.getLocator(SELECTORS.payment.creditCardEmi);
    this.cardlessEmi = this.getLocator(SELECTORS.payment.cardlessEmi);
    this.upfrontEmi = this.getLocator(SELECTORS.payment.upfrontEmi);
    this.payFullAmount = this.getLocator(SELECTORS.payment.payFullAmount);
    this.proceedButton = this.getLocator(SELECTORS.payment.proceed);
  }

  async verifyOpened() { await expect(this.subscription).toBeVisible(); }

  async verifyDefaultCCEMI() {
    await expect(this.subscription).toBeVisible();
    await this.emi.verifyCardFormVisible();
  }

  async selectCreditCardEMI() {
    await this.click(this.creditCardEmi);
    await this.emi.verifyCardFormVisible();
  }

  async selectCardlessEMI() {
    await this.click(this.cardlessEmi);
  }

  async selectUpfrontEMI() {
    await this.click(this.upfront);
    await this.click(this.upfrontEmi);
  }

  async selectPayFullAmount(method) {
    await this.click(this.upfront);
    await this.click(this.payFullAmount);
    await this.click(this.getLocator(SELECTORS.payment.paymentMethod, { hasText: method }));
  }

  async enterCardDetails(card) { await this.emi.enterCardDetails(card); }

  async clickPayNow() {
    await this.performAndWaitForURL(
      ROUTES.PAYMENT_GATEWAY, () => this.emi.payNowButton.click(),
    );
  }

  async proceedWithCardlessEmi() {
    await this.performAndWaitForURL(
      ROUTES.LENDER, () => this.proceedButton.click(),
    );
  }

  async proceedToPay() {
    await this.performAndWaitForURL(
      ROUTES.PAYMENT_GATEWAY, () => this.proceedButton.click(),
    );
  }
}
