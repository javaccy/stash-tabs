chrome.runtime.onStartup.addListener(() => {
  chrome.promise.storage.local.clear();
});

window.unstash = function (stashId, stash, shouldUpdateMessages) {
  deleteStash(stashId)
    .then(() => openStash(stash))
    .then(chromeWindow => {
      chrome.promise.storage.local.set(
        { [getStashNameStorageKey(chromeWindow.id)]: stash.name });
    });
  if (shouldUpdateMessages) {
    setMessageRead('openStash');
  }
};
