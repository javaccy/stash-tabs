'use strict';

function init() {
  let stashesEl = document.getElementById("stash-list");

  let newStashNameInputTabs = document.getElementById('new-stash-name-tabs');
  let newStashNameInputWindow = document.getElementById('new-stash-name-window');
  let stashTabsButton = document.getElementById('stash-tabs');
  let stashWindowButton = document.getElementById('stash-window');
  let inputRowWindow = document.getElementById('input-row-window');
  let inputRowTabs = document.getElementById('input-row-tabs');
  let tip = document.getElementById('tip');

  let highlightedTabsPromise = chrome.promise.tabs.query(
    { currentWindow: true, highlighted: true });

  let windowTabsPromise = chrome.promise.tabs.query(
    { currentWindow: true });

  let renderStashes = function () {
    Promise.all([getStashes(), highlightedTabsPromise]).then(([stashes, highlightedTabs]) => {
      stashesEl.innerHTML = '';
      let sortedStashIds = _.orderBy(Object.keys(stashes),
        stashId => stashes[stashId].timestamp, ['desc']);
      for (let stashId of sortedStashIds) {
        let stash = stashes[stashId];
        let stashEl = document.createElement('stash');

        let titleRow = document.createElement('title-row');
        titleRow.innerText = stash.name + ' (' + stash.tabs.length + ' ' +
          (stash.tabs.length == 1 ? 'tab' : 'tabs') + ')';
        stashEl.appendChild(titleRow);

        let timeLabel = document.createElement('time-label');
        timeLabel.innerText = moment(stash.timestamp).fromNow();
        stashEl.appendChild(timeLabel);

        let buttonRow = document.createElement('button-row');

        let topUpButton = document.createElement('button');
        let caption = 'Add ';
        if (highlightedTabs.length == 1) {
          caption += 'this tab';
        } else {
          caption += highlightedTabs.length + ' tabs';
        }
        topUpButton.innerText = caption;
        topUpButton.onclick = (e) => {
          topUp(stashId, highlightedTabsPromise);
        };
        buttonRow.appendChild(topUpButton);

        let renameButton = document.createElement('button');
        renameButton.innerText = 'Rename';
        renameButton.onclick = (e) => {
          chrome.extension.getBackgroundPage().renameStashPrompt(stashId,
            stash.name);
        };
        buttonRow.appendChild(renameButton);

        let deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = (e) => {
          deleteStash(stashId);
        };
        buttonRow.appendChild(deleteButton);

        let openAndDeleteButton = document.createElement('button');
        openAndDeleteButton.innerText = 'Unstash';
        openAndDeleteButton.classList.add('primary');
        openAndDeleteButton.onclick = (e) => {
          deleteStash(stashId)
            .then(() => openStash(stash))
            .then(win => {
              // We can't use popup's sessionStorage because of this issue:
              // https://bugs.chromium.org/p/chromium/issues/detail?id=42599
              chrome.extension.getBackgroundPage().sessionStorage.setItem(
                getStashNameStorageKey(win.id), stash.name);
            });
        };
        buttonRow.appendChild(openAndDeleteButton);

        stashEl.appendChild(buttonRow);
        stashesEl.appendChild(stashEl);
      }
    });
  };

  let render = function () {
    Promise.all([highlightedTabsPromise, windowTabsPromise]).then(([highlightedTabs, windowTabs]) => {
      if (highlightedTabs.length > 1) {
        inputRowWindow.style.display = 'none';
        tip.style.display = 'none';
      } else {
        if (windowTabs.length == 1) {
          inputRowTabs.style.display = 'none';
        }
        let originalStashName = chrome.extension.getBackgroundPage()
          .sessionStorage.getItem(getStashNameStorageKey(highlightedTabs[0].windowId));
        if (originalStashName && originalStashName != tabNamePlaceholder) {
          newStashNameInputWindow.value = originalStashName;
        }
        let modifierKey = (navigator.platform.toLowerCase().indexOf('mac') >= 0) ? 'Cmd' : 'Ctrl';
        tip.innerText = 'Tip: select multiple tabs to stash by ' + modifierKey + '- or Shift-clicking tab handles.'
      }
      if (highlightedTabs.length > 1) {
        stashTabsButton.innerText = 'Stash ' + highlightedTabs.length + ' tabs';
      }
      if (highlightedTabs.length == 1) {
        newStashNameInputTabs.value = highlightedTabs[0].title || '';
      }
    });
    renderStashes();
  };

  let stashTabs = function () {
    saveStash(newStashNameInputTabs.value, highlightedTabsPromise).then(() => {
      newStashNameInputTabs.value = '';
    });
  };

  stashTabsButton.onclick = stashTabs;

  newStashNameInputTabs.onkeypress = function (e) {
    if (e.keyCode == '13') {
      // Enter pressed
      stashTabs();
    }
  };

  let stashWindow = function () {
    saveStash(newStashNameInputWindow.value, windowTabsPromise).then(() => {
      newStashNameInputWindow.value = '';
    });
  };

  stashWindowButton.onclick = stashWindow;

  newStashNameInputWindow.onkeypress = function (e) {
    if (e.keyCode == '13') {
      // Enter pressed
      stashWindow();
    }
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if ('stashes' in changes) {
      renderStashes();
    }
  });

  render();
}

// Kick things off.
document.addEventListener('DOMContentLoaded', init);
