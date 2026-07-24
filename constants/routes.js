/**
 * Application routes.
 *
 * Alternations are grouped deliberately. `/\/payment|gateway|checkout/i` parses
 * as `(\/payment)|(gateway)|(checkout)`, which matches the `/payments` page
 * itself - so waiting for a "gateway redirect" resolved immediately while still
 * on the payments page and the assertion passed without a redirect happening.
 */
export const ROUTES = Object.freeze({
  HOME: '/',
  PDP: /\/pd\/[^/]+\/[^/?]+/,
  REVIEW: /\/review(?:\?.*)?$/,
  PAYMENTS: /\/payments(?:\?.*)?$/,
  /** A third-party gateway: must not match the app's own /payments route. */
  PAYMENT_GATEWAY: /(?:gateway|checkout|razorpay|payu)/i,
  LENDER: /(?:lender|cardless)/i,
});
