# Contributing

## Getting set up

```bash
npm ci
npx playwright install
cp .env.example .env   # then set BASE_URL to the environment you can reach
```

Without `BASE_URL` every spec skips itself. That is deliberate — it stops the
suite from silently running against the placeholder host — but it also means a
"green" run with no `.env` proves nothing. Check the run summary for skips.

## Before opening a pull request

```bash
npm run lint
npm run format:check
npm run test:chromium
```

`npm run test:list` is a cheap import check, not a test run. Any change that
touches a locator needs a real run against a live environment; the DOM is the
only source of truth here, and several locators in this repo exist specifically
because the obvious version did not work.

## The layout

| Directory     | Holds                                                        |
| ------------- | ------------------------------------------------------------ |
| `tests/`      | specs — orchestration and assertions on returned values only |
| `pages/`      | page objects, one per screen, exposing business actions      |
| `components/` | reusable regions shared across screens                       |
| `constants/`  | the selector contract, routes, and timeouts                  |
| `fixtures/`   | Playwright fixtures and scenario data                        |
| `utils/`      | locator building, API, logging, waiting                      |

## Conventions that are load-bearing

**Tests never build locators.** A spec calls `pdp.selectStorage('256GB')`; it
never reaches for `page.getByRole(...)`. If a test needs a new locator, the
locator belongs in `constants/selectors.js` and the behaviour belongs in a page
object method.

**Selectors are declarative config, not strings.** Entries in
`constants/selectors.js` are objects consumed by `getLocator()` in
`utils/locator.js` — `{ type, value, options, filterText, visibleOnly, first,
nth }`. Add a new type to `getLocator` rather than dropping a raw CSS string
into a page object.

**Assertions live in `verify*` methods.** A page object that performs an action
also asserts its outcome. This is why specs look assertion-light; the ESLint
rule `playwright/expect-expect` is configured with the list of these methods, so
**a new `verify*` method must be added to `assertFunctionNames` in
`eslint.config.js`** or its callers will warn.

**Read values relative to their label.** `/₹[\d,]+/` matches 17 nodes on a PDP.
Use `labelledValue(page, 'Assured buyback')`, not a currency regex.

**Use `typeText()`, not `fill()`, on MUI inputs.** WebKit does not fire the React
`onChange` handlers for a value set in one synthetic event, so the typeahead
never fires and the pincode Check button stays disabled.

**Prefer web-first assertions over sleeps.** `expect(locator).toBeVisible()`
polls. `waitForTimeout` does not belong in new code.

## Adding a page object

1. Add the screen's selectors as a new group in `constants/selectors.js`, with a
   comment noting whether they are verified against a live DOM or not.
2. Create `pages/YourPage.js` extending `BasePage`, building locators in the
   constructor via `getLocator`.
3. Expose business actions plus a `verifyOpened()`.
4. Register it in `fixtures/testFixtures.js` so specs receive it as a fixture.
5. Add the new `verify*` names to `eslint.config.js`.

## Writing a test

Tag it. `@smoke` for the fast signal, `@regression` for the full journey,
`@authenticated` for anything past the OTP wall — the authenticated block also
needs a `test.skip` guard on `STORAGE_STATE`, or CI will report a missing
precondition as a failure.

## Flakes

Before adding a retry, establish whether it is the test or the environment.
Staging is shared and contended; a test that fails under parallel workers and
passes 3/3 serially is contention, and the fix is not a longer timeout. Run:

```bash
npx playwright test --workers=1 --repeat-each=3 --grep "your test"
```

If it is genuinely the app re-rendering underneath the test, poll for the
settled state rather than sleeping past it.
