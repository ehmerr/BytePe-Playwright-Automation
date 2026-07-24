/**
 * Builds a Playwright locator from a selector config in constants/selectors.js.
 *
 * Supported config keys:
 *   type        - placeholder | text | role | label | title | alt | testid | css
 *   value       - the string/RegExp passed to the matching Playwright method
 *   options     - forwarded to the Playwright method (name, level, exact, ...)
 *   filterText  - narrows the match with .filter({ hasText })
 *   visibleOnly - drops nodes that are in the DOM but not rendered
 *   first       - resolves to .first() (use when duplication is expected)
 *   nth         - resolves to .nth(n)
 *
 * `visibleOnly` matters here because the site renders its header twice (mobile
 * and desktop variants coexist in the DOM), so header locators would otherwise
 * be ambiguous under Playwright's strict mode.
 *
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} root
 * @param {Object} selector
 * @param {Object} [extraOptions] extra role options, plus optional hasText
 * @returns {import('@playwright/test').Locator}
 */
export function getLocator(root, selector, extraOptions = {}) {
  if (!selector || !selector.type) {
    throw new Error(`Invalid selector: must have a "type" property. Received: ${JSON.stringify(selector)}`);
  }

  const { hasText, ...roleOptions } = extraOptions;
  const options = selector.options || {};
  let locator;

  switch (selector.type) {
    case 'placeholder':
      locator = root.getByPlaceholder(selector.value, options);
      break;
    case 'text':
      locator = root.getByText(selector.value, options);
      break;
    case 'role':
      locator = root.getByRole(selector.value, { ...options, ...roleOptions });
      break;
    case 'label':
      locator = root.getByLabel(selector.value, options);
      break;
    case 'title':
      locator = root.getByTitle(selector.value, options);
      break;
    case 'alt':
      locator = root.getByAltText(selector.value, options);
      break;
    case 'testid':
      locator = root.getByTestId(selector.value);
      break;
    case 'css':
      locator = root.locator(selector.value);
      break;
    default:
      throw new Error(`Unknown selector type: ${selector.type}`);
  }

  if (selector.filterText) locator = locator.filter({ hasText: selector.filterText });
  if (hasText) locator = locator.filter({ hasText });
  if (selector.visibleOnly) locator = locator.locator('visible=true');
  if (typeof selector.nth === 'number') locator = locator.nth(selector.nth);
  else if (selector.first) locator = locator.first();

  return locator;
}

/**
 * Reads the value paragraph that follows a label, e.g. "Assured buyback" -> "₹35,617".
 *
 * The PDP has no test ids and 17 nodes match a bare `/₹[\d,]+/`, so values are
 * anchored to their visible label instead of matched by shape.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} label exact label text
 * @returns {import('@playwright/test').Locator}
 */
export function labelledValue(page, label) {
  return page
    .getByText(label, { exact: true })
    .first()
    .locator('xpath=following::p[1]');
}

/**
 * Escapes a value for safe interpolation into a RegExp.
 * Product names carry brackets and dots ("Phone (4b)", "1.5L"), which would
 * otherwise be interpreted as regex syntax.
 * @param {string} value
 * @returns {string}
 */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
