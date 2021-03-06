# Stash Tabs (a Chrome extension)

Close the tabs you don't need at the moment without losing them. A lightweight solution to the problem of too many tabs.

## Features

- Chrome lets you select several tabs by Shift- or Cmd/Ctrl-clicking tab handles. By taking advantage of this feature, the extension lets you cherry-pick the tabs to stash.

- You can unstash a set of tabs to a new winow, maybe modify it, then restash it (the extension will prefill the stash name that you typed originally).

- Stashes do not accumulate over time because unstashing automatically removes the stash from your list. You either have the window open, or you have it stashed, but not both.

- As with bookmarks, if you use multiple desktops under the same Google account, stashes will be synced across those desktops.

- Keyboard support (Shift+Cmd+S to open popup on Mac, Shift+Ctrl+S on Windows or Linux, select stashes with arrow keys).

## Contributing

You're very welcome to contribute code or feedback. For starters, take a look at the [list of suggested features](https://github.com/ivan7237d/stash-tabs/issues?utf8=%E2%9C%93&q=is%3Aissue%20label%3Adiscussion) and get in touch via comments, via [Twitter](https://twitter.com/ivan7237d), or by filing new issues.

## File Structure

- `popup.html/js/css` — popup window, created/destroyed each time popup is opened.
- `background.html/js` — background page that is always present.
- `main.js` — logic not specific to the popup or the background page.
- `lib/...` — library files (`moment.min.js`: 2.14.1).
