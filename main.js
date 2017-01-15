'use strict';

// See https://github.com/tfoxy/chrome-promise
chrome.promise = new ChromePromise();

const stashNamePlaceholder = 'Untitled stash';

const getRandomString = function (length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/** Converts Chrome API's array of tabs to a serializable representation. */
const transformTabsForStorage = (tabs) => tabs.map(tab =>
  ({
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl
  })
);

/** Used to store stash names in local storage. */
const getStashNameStorageKey = windowId => 'stashName_' + windowId;

/** Used to store data on stashes in sync storage. */
const getStashStorageKey = stashId => 'stash_' + stashId;

/** Used to store a tab in the stash in sync storage. */
const getTabStorageKey = (stashId, tabIndex) => 'tab_' + stashId + '_' + tabIndex;

const getStashes = async function () {
  const items = await chrome.promise.storage.sync.get(null);
  const stashes = {};
  for (let key in items) {
    const stashMatches = key.match(/^stash_(.*)/);
    if (stashMatches) {
      _.merge(stashes, { [stashMatches[1]]: items[key] });
    }
    const tabMatches = key.match(/^tab_(.*)_(\d*)/);
    if (tabMatches) {
      _.set(stashes, [tabMatches[1], 'tabs', parseInt(tabMatches[2], 10)], items[key]);
    }
  }
  return stashes;
};

const getMessages = async function () {
  const items = await chrome.promise.storage.sync.get('messages');
  return items['messages'] || {};
};

const setStashes = async function (stashes) {
  // We have to store tabs as individual items because of size limits of sync
  // API for a single item.

  const itemsToStore = {}, itemsToRemove = [];
  for (let stashId in stashes) {
    const stash = stashes[stashId];
    itemsToStore[getStashStorageKey(stashId)] = _.omit(stash, 'tabs');
    stash.tabs.forEach((tab, tabIndex) => {
      itemsToStore[getTabStorageKey(stashId, tabIndex)] = tab;
    });
  }
  const currentItems = await chrome.promise.storage.sync.get(null);
  for (let key in currentItems) {
    if (key.startsWith('stash_') || key.startsWith('tab_')) {
      if (!(key in itemsToStore)) {
        itemsToRemove.push(key);
      } else if (_.isEqual(currentItems[key], itemsToStore[key])) {
        delete itemsToStore[key];
      }
    }
  }

  let removePromise, setPromise;
  if (itemsToRemove) {
    removePromise = chrome.promise.storage.sync.remove(itemsToRemove);
  }
  if (!_.isEmpty(itemsToStore)) {
    setPromise = chrome.promise.storage.sync.set(itemsToStore);
  }
  await Promise.all([removePromise, setPromise]);
};

const setMessageRead = async function (name) {
  const messages = await getMessages();
  messages[name] = true;
  await chrome.promise.storage.sync.set({ messages: messages });
};

const saveStash = async function (name, tabs, activeTabIndex) {
  const stashes = await getStashes();
  stashes[getRandomString(10)] = {
    name: name.trim(),
    timestamp: (new Date()).toISOString(),
    tabs: transformTabsForStorage(tabs),
    activeTabIndex: activeTabIndex
  };
  await setStashes(stashes);
  await chrome.promise.tabs.remove(tabs.map(tab => tab.id));
};

const openStash = async function (stash) {
  const window = await chrome.promise.windows.create(
    { url: stash.tabs.map(tab => tab.url) });
  const activeTabIndex = ('activeTabIndex' in stash) ? stash.activeTabIndex :
    (window.tabs.length - 1);
  await chrome.promise.tabs.update(window.tabs[activeTabIndex].id,
    { active: true });
  return window;
};

const deleteStash = async function (stashId) {
  const stashes = await getStashes();
  delete stashes[stashId];
  await setStashes(stashes);
};

const topUp = async function (stashId, tabs) {
  const stashes = await getStashes();
  if (!(stashId in stashes)) {
    return;
  };
  stashes[stashId].tabs = stashes[stashId].tabs.concat(
    transformTabsForStorage(tabs));
  stashes[stashId].timestamp = (new Date()).toISOString();
  await setStashes(stashes);
  await chrome.promise.tabs.remove(tabs.map(tab => tab.id));
};

const getOriginalStashName = async function () {
  const currentWindow = await chrome.promise.windows.getCurrent();
  const stashNameStorageKey = getStashNameStorageKey(currentWindow.id);
  const items = await chrome.promise.storage.local.get(stashNameStorageKey);
  return items[stashNameStorageKey];
};
