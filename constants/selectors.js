/**
 * Application selectors for stage-web.bytepe.com.
 *
 * Everything down to and including `auth` has been verified against the live
 * DOM. The `review`, `address`, `coupon`, `orderSummary` and `payment` groups
 * sit behind the OTP wall and are marked unverified where they begin.
 *
 * Two constraints shape the strategy:
 *
 * 1. The app ships no meaningful `data-testid` attributes. The only test ids
 *    present belong to MUI icons (`SearchIcon`, `MenuIcon`), so role/text
 *    locators are the stable contract.
 * 2. The header is rendered twice (a mobile and a desktop variant, both in the
 *    DOM at all times) and each renders two search inputs. Anything in the
 *    header therefore needs `visibleOnly` plus `first` to stay unambiguous.
 *
 * Prices are deliberately NOT matched with bare currency regexes: `/₹[\d,]+/`
 * matches 17 nodes on a PDP. Values are read relative to their label instead —
 * see `labelledValue` in the page objects.
 */
export const SELECTORS = Object.freeze({
  home: {
    heroHeading: { type: 'role', value: 'heading', options: { level: 1, name: /BytePe/i } },
    // 4 in the DOM, 2 visible - take the first visible one.
    searchInput: {
      type: 'placeholder',
      value: 'Search for Products, brands...',
      visibleOnly: true,
      first: true,
    },
    suggestion: { type: 'role', value: 'listitem' },
  },

  pdp: {
    // PDP titles render as <h6>, e.g. "googlePixel 10".
    productTitle: { type: 'role', value: 'heading', options: { level: 6 }, first: true },
    planSection: { type: 'text', value: 'Choose your plan', options: { exact: true } },
    // "Subscription" also exists as a nav link, so scope to the plan card paragraph.
    subscriptionTab: { type: 'css', value: 'p', filterText: /^Subscription$/ },
    upfrontTab: { type: 'text', value: 'Buy Upfront', options: { exact: true } },
    // Storage variants are MUI Chips: divs carrying role="button". WebKit does
    // not expose that role, so PDPPage.selectStorage builds that locator
    // directly and falls back to matching the capacity text.

    // Matches only a populated label. The page renders duplicate layout
    // variants, and Firefox resolves `.first()` to one whose color name never
    // fills in - requiring the name here skips the placeholder copies.
    colorLabel: { type: 'text', value: /^Color\s*-\s*\S+/, visibleOnly: true },
    // Any color label, populated or not - used to reach the swatch row.
    colorRow: { type: 'text', value: /^Color\s*-/, visibleOnly: true },
    pincodeInput: { type: 'placeholder', value: 'Enter Pincode' },
    pincodeCheck: { type: 'role', value: 'button', options: { name: 'Check', exact: true } },
    // Native <input type=range>, min 0 / max 21. Month = value + 3.
    durationSlider: { type: 'css', value: 'input[type="range"]' },
    subscribe: { type: 'role', value: 'button', options: { name: 'Subscribe', exact: true } },
    buyNow: { type: 'role', value: 'button', options: { name: 'Buy Now', exact: true } },
    addToCart: { type: 'role', value: 'button', options: { name: 'Add to Cart', exact: true } },
    cardlessEmi: { type: 'text', value: 'Cardless EMI', options: { exact: true } },
    secureInsurance: { type: 'text', value: 'BytePe Secure', options: { exact: true } },
  },

  /** Labels whose adjacent paragraph holds the value we assert on. */
  pdpValueLabels: {
    monthlySubscription: 'Monthly Subscription',
    assuredBuyback: 'Assured buyback',
    totalDiscount: 'Total Discount',
  },

  auth: {
    // Any action past the PDP triggers this OTP wall.
    mobileWall: { type: 'text', value: /Enter mobile number to continue/i, first: true },
  },

  /**
   * Everything below sits behind the OTP wall and is therefore UNVERIFIED
   * against a real screen. Entries carry `first` so an over-broad guess fails
   * on a readable assertion rather than a strict-mode violation.
   */
  review: {
    productTitle: { type: 'role', value: 'heading', options: { level: 6 }, first: true },
    /** The panel holding product details - used to assert it is read-only. */
    productDetails: { type: 'css', value: 'main, [class*="review" i]', first: true },
    changeAddress: { type: 'role', value: 'button', options: { name: /change address/i } },
    continue: { type: 'role', value: 'button', options: { name: /^continue$/i } },
  },

  address: {
    drawer: { type: 'role', value: 'dialog' },
    addressOption: { type: 'role', value: 'button' },
    save: { type: 'role', value: 'button', options: { name: /save address/i } },
  },

  coupon: {
    input: { type: 'placeholder', value: /coupon/i, first: true },
    apply: { type: 'role', value: 'button', options: { name: /^apply$/i }, first: true },
    remove: { type: 'role', value: 'button', options: { name: /^remove$/i }, first: true },
    appliedCode: { type: 'text', value: /^[A-Z0-9]{4,}$/, first: true },
  },

  orderSummary: {
    container: { type: 'text', value: /order summary/i, first: true },
    total: { type: 'text', value: /^Total/, first: true },
    savings: { type: 'text', value: /Savings/, first: true },
    interest: { type: 'text', value: /Interest/, first: true },
  },

  payment: {
    subscription: { type: 'css', value: 'p', filterText: /^Subscription$/, first: true },
    upfront: { type: 'text', value: 'Buy Upfront', options: { exact: true }, first: true },
    creditCardEmi: { type: 'text', value: 'Credit Card EMI', options: { exact: true }, first: true },
    cardlessEmi: { type: 'text', value: 'Cardless EMI', options: { exact: true }, first: true },
    upfrontEmi: { type: 'text', value: 'Upfront EMI', options: { exact: true }, first: true },
    payFullAmount: { type: 'text', value: 'Pay Full Amount', options: { exact: true }, first: true },
    cardNumber: { type: 'placeholder', value: /card number/i, first: true },
    cardExpiry: { type: 'placeholder', value: /MM\s*\/\s*YY/i, first: true },
    cardCvv: { type: 'placeholder', value: /cvv/i, first: true },
    // Narrow enough not to collide with a plain "Name" field.
    cardholderName: { type: 'placeholder', value: /(card ?holder|name on card)/i, first: true },
    payNow: { type: 'role', value: 'button', options: { name: /pay now/i }, first: true },
    proceed: { type: 'role', value: 'button', options: { name: /proceed/i }, first: true },
    paymentMethod: { type: 'role', value: 'button' },
  },
});

/** Backend endpoints the UI depends on - used for deterministic waits. */
export const API = Object.freeze({
  SEARCH: /\/api\/search-service\/search/,
  PINCODE: /\/api\/pincodes\/info\//,
  VARIANT_PRICING: /\/api\/apps\/variant-pricing\//,
  COUPON: /coupon/i,
});
