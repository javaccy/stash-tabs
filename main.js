'use strict';

// See https://github.com/tfoxy/chrome-promise
chrome.promise = new ChromePromise();

const stashNamePlaceholder = 'Untitled stash';

let getRandomString = function (length) {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Converts Chrome API's array of tabs to a serializable representation.
let transformTabsForStorage = (tabs) => tabs.map(tab =>
  ({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  })
);

// Used to store stash names in local storage.
let getStashNameStorageKey = windowId => 'stashName_' + windowId;

// Used to store data on stashes in sync storage.
let getStashStorageKey = stashId => 'stash_' + stashId;

// Used to store a tab in the stash in sync storage.
let getTabStorageKey = (stashId, tabIndex) => 'tab_' + stashId + '_' + tabIndex;

let getStashes = function () {
  return chrome.promise.storage.sync.get(null)
    .then(items => {
      // 'stashes' is a legacy key, around Sep 2016 this line should be removed.
      if ('stashes' in items)
        return items.stashes;
      let stashes = {};
      for (let key in items) {
        let stashMatches = key.match(/^stash_(.*)/);
        if (stashMatches)
          _.merge(stashes, { [stashMatches[1]]: items[key] });
        let tabMatches = key.match(/^tab_(.*)_(\d*)/);
        if (tabMatches)
          _.set(stashes, [tabMatches[1], 'tabs', parseInt(tabMatches[2], 10)], items[key]);
      }
      return stashes;
    });
};

let getMessages = function () {
  return chrome.promise.storage.sync.get('messages')
    .then(items => items['messages'] || {});
};

let setStashes = function (stashes) {
  // We have to store tabs as individual items because of size limits of sync
  // API for a single item.

  let itemsToStore = {}, itemsToRemove = [];
  for (let stashId in stashes) {
    let stash = stashes[stashId];
    itemsToStore[getStashStorageKey(stashId)] = _.omit(stash, 'tabs');
    stash.tabs.forEach((tab, tabIndex) => {
      itemsToStore[getTabStorageKey(stashId, tabIndex)] = tab;
    });
  }
  return chrome.promise.storage.sync.get(null)
    .then(currentItems => {
      // 'stashes' is a legacy key, around Sep 2016 this line should be removed.
      if ('stashes' in currentItems) itemsToRemove.push('stashes');
      for (let key in currentItems) {
        if (key.startsWith('stash_') || key.startsWith('tab_')) {
          if (!(key in itemsToStore))
            itemsToRemove.push(key)
          else if (_.isEqual(currentItems[key], itemsToStore[key]))
            delete itemsToStore[key];
        }
      }

      let removePromise, setPromise;
      if (itemsToRemove)
        removePromise = chrome.promise.storage.sync.remove(itemsToRemove);
      if (!_.isEmpty(itemsToStore))
        setPromise = chrome.promise.storage.sync.set(itemsToStore);
      return Promise.all([removePromise, setPromise]);
    })
};

let setMessageRead = function (name) {
  return getMessages().then(messages => {
    messages[name] = true;
    return chrome.promise.storage.sync.set({ messages: messages });
  });
};

let saveStash = function (name, tabs, activeTabIndex) {
  getStashes()
    .then(stashes => {
      stashes[getRandomString(10)] = {
        name: name.trim(),
        timestamp: (new Date()).toISOString(),
        tabs: transformTabsForStorage(tabs),
        activeTabIndex: activeTabIndex
      };
      return setStashes(stashes);
    })
    .then(() => {
      return chrome.promise.tabs.remove(tabs.map(tab => tab.id));
    });
};

let openStash = function (stash) {
  let windowPromise = chrome.promise.windows.create(
    { url: stash.tabs.map(tab => tab.url) });
  return windowPromise
    .then(window => {
      let activeTabIndex = ('activeTabIndex' in stash) ? stash.activeTabIndex :
        (window.tabs.length - 1);
      return chrome.promise.tabs.update(window.tabs[activeTabIndex].id,
          { active: true });
    })
    .then(() => {
      return windowPromise;
    });
};

let deleteStash = function (stashId) {
  return getStashes()
    .then(stashes => {
      delete stashes[stashId];
      return setStashes(stashes);
    });
};

let topUp = function (stashId, tabs) {
  getStashes()
    .then(stashes => {
      if (!(stashId in stashes)) return;
      stashes[stashId].tabs = stashes[stashId].tabs.concat(
        transformTabsForStorage(tabs));
      stashes[stashId].timestamp = (new Date()).toISOString();
      return setStashes(stashes);
    })
    .then(() => {
      return chrome.promise.tabs.remove(tabs.map(tab => tab.id));
    });
};
