# BytePe Playwright Automation Framework

JavaScript Playwright framework for the e-commerce purchase journey against
`stage-web.bytepe.com`: search, PDP configuration, review, and payments.

## Setup

```bash
npm install
npx playwright install
npm test
```

`BASE_URL` is read from `.env`. Tests skip when it is unset, so the suite never
runs against the placeholder configuration by accident.

- `npm run test:smoke` - smoke coverage
- `npm run test:regression` - full journey suite
- `npm run test:chromium` - chromium only, the fastest signal
- `npm run test:webkit` - WebKit, which is opt-in (see Browser support)

## Structure

- `pages/` business-focused POMs. Tests never consume raw locators.
- `components/` reusable regions: coupons, EMI, address drawer, order summary.
- `fixtures/` test fixtures and scenario data.
- `constants/selectors.js` the single selector contract.
- `utils/` API, waiting, logging, and test-data helpers.

## What the application forces on the tests

The app ships no usable `data-testid` attributes, so the contract is built from
role and text locators. Four behaviours are load-bearing and worth knowing
before changing anything:

1. **The header renders twice.** A mobile and a desktop variant are both in the
   DOM, each with its own search input, and the visible ones overlap. Header
   locators use `visibleOnly` + `first`, and inputs are focused rather than
   clicked - a click hit-tests onto the other header's input and never lands.
2. **`fill()` is not enough for MUI inputs.** WebKit does not run the React
   `onChange` handlers when a value is set in one synthetic event, so the search
   typeahead never fires and the pincode Check button stays disabled. Use
   `BasePage.typeText()`, which sends real key events.
3. **Prices cannot be matched by shape.** A bare `/₹[\d,]+/` matches 17 nodes on
   a PDP. Values are read relative to their label via `labelledValue()`.
4. **The buyback slider only moves buyback.** It is a MUI Slider that ignores
   `fill()` - only arrow keys step it predictably - and the monthly price is
   identical at every position. The slider previews buyback per month; it does
   not re-term the plan. Asserting that the monthly price changes is a false
   failure.

## Test data

Products must exist in the staging catalogue. The previous `IPHONE_17` fixture
did not: the search service answers `q=iPhone` with a fuzzy match on a Nike shoe
named "air", so every test keyed to it failed on a locator that could never
resolve. Verify before relying on a product:

```bash
curl 'https://stage-web.bytepe.com/api/search-service/search?q=pixel%2010'
```

Card and user details in `fixtures/` are synthetic. Replace them with
non-production credentials from the target environment.

## Authenticated coverage

Everything past the PDP is gated. Clicking Subscribe on an anonymous session
raises an OTP wall ("Enter mobile number to continue"), so review, coupons,
addresses and payments are unreachable without a signed-in session.

Those tests live in the `@authenticated` describe block and skip unless
`STORAGE_STATE` points at a signed-in storage state:

```bash
STORAGE_STATE=.auth/user.json npm run test:regression
```

To produce that file, sign in once with a test mobile number and save the
session:

```bash
npx playwright codegen --save-storage=.auth/user.json https://stage-web.bytepe.com
```

The OTP step needs either a test number with a fixed code or manual entry during
capture. Storage states expire - regenerate when the block starts failing at
`openReview`.

The payment-page locators are the only ones in the framework still unverified
against a real screen, because that page sits behind the wall. Expect to correct
them the first time the block runs with a real session.

## Browser support

Chromium and Firefox are green and are what `npm test` runs. WebKit is defined
as a project but excluded from the default scripts: it has app-level rendering
differences on the PDP and is substantially slower. Run it deliberately:

```bash
npm run test:webkit
```

## Known findings not fixed here

- **Staging contention.** Several workers against the one staging environment
  occasionally exceed the variant-data timeout. `retries` covers it; the same
  tests pass 3/3 when run serially.
- **Unused utilities.** `utils/WaitHelper.js`, `utils/Logger.js` and
  `utils/TestDataHelper.js` are not imported anywhere, and neither are
  `fixtures/coupons.js` and `fixtures/users.js` now that the coupon and address
  journeys sit behind the OTP wall. They were left in place rather than deleted
  - `WaitHelper` in particular duplicates what web-first assertions already do
  and would be the first thing to remove.
- **`utils/ApiHelper.js`** is wired into the `api` fixture but no test uses it.
