# Stash Tabs (a Chrome extension)

Stash away the tabs you don't need at the moment and reopen them later. A lightweight take on the problem of too many tabs.

Bookmarks are great; but what about links that you don't want to store permanently — do you have to keep them open, even as the number of tabs gets out of control? Stash Tabs is here to help.

## Features

Compared to bookmarking + closing windows, this extension offers the following advantages:

- Saving and closing is one operation.

- Chrome lets you select several tabs by Shift- or Cmd/Ctrl-clicking tab handles. By taking advantage of this feature, the extension lets you stash only some of the tabs in a window (but you can still stash the entire window if you want to).

- Stashes are stored in an easily accessible list, with more recent ones on top, and with an indication of how long ago the stash was created.

- Stashes do not accumulate over time because unstashing automatically removes the stash from your list. You either have the window open, or you have it stashed, but not both.

- You can unstash a set of tabs to a new winow, modify it, then restash it (the extension will prefill the stash name that you typed originally).

As with bookmarks, if you use multiple desktops, stashes will be synced between them.

## Contributing

You're very welcome to contribute code or feedback. For starters, take a look at the list of suggested features here https://github.com/ivan7237d/stash-tabs/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement and get in touch via comments or by filing new issues.

## File Structure

- `popup.html/js/css` — popup window, created/destroyed each time popup is opened.
- `background.html/js` — background page that is always present.
- `main.js` — logic not specific to the popup or the background page.
- `lib/...` — library files (`moment.min.js`: 2.14.1).
