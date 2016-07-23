# Stash tabs

## File Structure

- `popup.html/js/css` — popup window, created/destroyed each time popup is opened.
- `background.html/js` — background page that is always present.
- `main.js` — logic not specific to the popup or the background page.
- `lib/...` — library files. `main.js` requires `chrome-promise` and `lodash`, `popup.js` requires `moment`.
  - `chrome-promise.js`: 1.0.6
  - `lodash.js`: 4.13.1
  - `moment.min.js`: 2.14.1
