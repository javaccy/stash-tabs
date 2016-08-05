window.unstash = function (stashId, stash, shouldUpdateMessages) {
  deleteStash(stashId)
    .then(() => openStash(stash))
    .then(chromeWindow => {
      // We can't use popup's sessionStorage because of this issue:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=42599
      window.sessionStorage.setItem(
        getStashNameStorageKey(chromeWindow.id), stash.name);
    });
  if (shouldUpdateMessages) {
    setMessageRead('openStash');
  }
};
