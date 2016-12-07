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

let getStashes = async function () {
  let items = await chrome.promise.storage.sync.get(null);
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
};

let getMessages = async function () {
  let items = await chrome.promise.storage.sync.get('messages');
  return items['messages'] || {};
};

let setStashes = async function (stashes) {
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
  let currentItems = await chrome.promise.storage.sync.get(null)
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
  await Promise.all([removePromise, setPromise]);
};

let setMessageRead = async function (name) {
  let messages = await getMessages();
  messages[name] = true;
  await chrome.promise.storage.sync.set({ messages: messages });
};

let saveStash = async function (name, tabs, activeTabIndex) {
  let stashes = await getStashes();
  stashes[getRandomString(10)] = {
    name: name.trim(),
    timestamp: (new Date()).toISOString(),
    tabs: transformTabsForStorage(tabs),
    activeTabIndex: activeTabIndex
  };
  await setStashes(stashes);
  await chrome.promise.tabs.remove(tabs.map(tab => tab.id));
};

let openStash = async function (stash) {
  let window = await chrome.promise.windows.create(
    { url: stash.tabs.map(tab => tab.url) });
  let activeTabIndex = ('activeTabIndex' in stash) ? stash.activeTabIndex :
    (window.tabs.length - 1);
  await chrome.promise.tabs.update(window.tabs[activeTabIndex].id,
    { active: true });
  return window;
};

let deleteStash = async function (stashId) {
  let stashes = await getStashes();
  delete stashes[stashId];
  await setStashes(stashes);
};

let topUp = async function (stashId, tabs) {
  let stashes = await getStashes();
  if (!(stashId in stashes)) return;
  stashes[stashId].tabs = stashes[stashId].tabs.concat(
    transformTabsForStorage(tabs));
  stashes[stashId].timestamp = (new Date()).toISOString();
  await setStashes(stashes);
  await chrome.promise.tabs.remove(tabs.map(tab => tab.id));
};

let getOriginalStashName = async function () {
  let currentWindow = await chrome.promise.windows.getCurrent();
  let stashNameStorageKey = getStashNameStorageKey(currentWindow.id);
  let items = await chrome.promise.storage.local.get(stashNameStorageKey);
  return items[stashNameStorageKey];
};