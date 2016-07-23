'use strict';

// See https://github.com/tfoxy/chrome-promise
chrome.promise = new ChromePromise();

let getRandomString = function (length) {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

let transformTabsForStorage = (tabs) => tabs.map(tab =>
  ({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  })
);

let getStashes = function () {
  return chrome.promise.storage.sync.get({ stashes: {} })
    .then(results => results.stashes);
};

let setStashes = stashes => chrome.promise.storage.sync.set({ stashes: stashes });

let sanitizeName = name => (name.trim() || 'Untitled stash')

let saveStash = function (name, tabsPromise) {
  let stashesPromise = getStashes();

  let savePromise = Promise.all([tabsPromise, stashesPromise])
    .then(([tabs, stashes]) => {
      stashes[getRandomString(10)] = {
        name: sanitizeName(name),
        timestamp: (new Date()).toISOString(),
        tabs: transformTabsForStorage(tabs)
      };
      return setStashes(stashes);
    });

  return Promise.all([tabsPromise, savePromise])
    .then(([tabs, savePromiseValue]) => {
      return chrome.promise.tabs.remove(tabs.map(tab => tab.id));
    });
};

let openStash = function (stash) {
  return chrome.promise.windows.create({ url: stash.tabs.map(tab => tab.url) });
};

let deleteStash = function (stashId) {
  return getStashes()
    .then(stashes => {
      delete stashes[stashId];
      return setStashes(stashes);
    });
};

let topUp = function (stashId, tabsPromise) {
  let savePromise = tabsPromise.then(tabs => {
    getStashes()
      .then(stashes => {
        if (!(stashId in stashes)) return;
        stashes[stashId].tabs = stashes[stashId].tabs.concat(
          transformTabsForStorage(tabs));
        return setStashes(stashes);
      });
  });

  return Promise.all([tabsPromise, savePromise])
    .then(([tabs, savePromiseValue]) => {
      return chrome.promise.tabs.remove(tabs.map(tab => tab.id));
    });
};

let renameStash = function (stashId, newName) {
  getStashes().then(stashes => {
    if (!(stashId in stashes)) return;
    stashes[stashId].name = sanitizeName(newName);
    return setStashes(stashes);
  });
};
