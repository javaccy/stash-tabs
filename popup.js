'use strict';

// Makes sure MDL hides/shows placeholder when value is set programmatically.
let fixIsDirty = () => {
  for (let input of document.querySelectorAll('.mdl-textfield__input')) {
    input.parentElement.classList.toggle('is-dirty', !!input.value);
  }
};

let getStashEl = el => el.closest('.stash');

let init = ([highlightedTabs, windowTabs, stashes, messages]) => {
  let mode;
  if (windowTabs.length == 1) {
    mode = 'singleTab';
  } else {
    if (highlightedTabs.length > 1) {
      mode = 'selection';
    } else {
      mode = 'default';
    }
  }

  let originalStashName = chrome.extension.getBackgroundPage()
    .sessionStorage.getItem(
    getStashNameStorageKey(highlightedTabs[0].windowId));

  let stashNameTab;
  if (mode == 'singleTab' && originalStashName) {
    stashNameTab = originalStashName;
  } else {
    stashNameTab = highlightedTabs[0].title || '';
  }

  Vue.filter('tabs', numTabs => {
    return numTabs.toString() + (numTabs == 1 ? ' tab' : ' tabs');
  });

  Vue.filter('from-now', timestamp => {
    return moment(timestamp).fromNow();
  });

  let vm = new Vue({
    el: 'html',
    data: {
      mode: mode,
      highlightedTabsLenth: highlightedTabs.length,
      stashNameWindow: originalStashName,
      stashNameTab: stashNameTab,
      stathNameTabs: originalStashName,
      stashes: stashes,
      messages: messages,
      modifierKey: (navigator.platform.toLowerCase().indexOf('mac') >= 0) ?
        'Command' : 'Control',
      stashNamePlaceholder: stashNamePlaceholder,
      topUpTabsLabel: mode == 'selection' ?
        highlightedTabs.length.toString() + ' tabs' : 'current tab'
    },
    methods: {
      stashWindow: function () {
        saveStash(this.stashNameWindow, windowTabs);
      },
      stashTab: function () {
        saveStash(this.stashNameTab, highlightedTabs);
      },
      stashTabs: function () {
        saveStash(this.stathNameTabs, highlightedTabs);
      },
      topUp: function (stashId) {
        topUp(stashId, highlightedTabs);
      },
      unstash: function (stashId, stash) {
        // Have to call the function in the background page because the popup
        // closes too early.
        chrome.extension.getBackgroundPage().unstash(stashId, stash,
          !this.messages.openStash);
        // For better visual transition.
        window.close();
      },
      deleteStash: deleteStash,
      gotIt: function () {
        setMessageRead('welcome');
        setTimeout(() => {
          document.querySelector('.mdl-textfield__input').focus();
        }, 100);
      },
      isEmpty: _.isEmpty,
      handleFocus: function (event) {
        getStashEl(event.target).classList.add('focused');
      },
      handleBlur: function (event) {
        let stashOut = getStashEl(event.target);
        if (event.relatedTarget instanceof Element) {
          let stashIn = getStashEl(event.relatedTarget);
          if (stashIn === stashOut) return;
        }
        stashOut.classList.remove('focused');
      },
      up: function (event) {
        let nextStash;
        if (document.activeElement instanceof Element) {
          let stash = getStashEl(document.activeElement);
          if (stash) {
            let next = stash.previousElementSibling;
            if (next) {
              next.focus();
              event.preventDefault();
            }
            return;
          }
        }
        let first = document.getElementById('stash-list').lastElementChild;
        if (first && first !== document.activeElement) {
          first.focus();
          event.preventDefault();
        }
      },
      down: function (event) {
        let nextStash;
        if (document.activeElement instanceof Element) {
          let stash = getStashEl(document.activeElement);
          if (stash) {
            let next = stash.nextElementSibling;
            if (next) {
              next.focus();
              event.preventDefault();
            }
            return;
          }
        }
        let first = document.getElementById('stash-list').firstElementChild;
        if (first && first !== document.activeElement) {
          first.focus();
          event.preventDefault();
        }
      }
    },
    ready: fixIsDirty
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    Promise.all([getStashes(), getMessages()]).then(([stashes, messages]) => {
      vm.stashes = stashes;
      vm.messages = messages;
    });
  });

  // Workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=307912
  setTimeout(() => {
    document.body.style.width = '421px';
  }, 200)
};

Promise.all([
  chrome.promise.tabs.query({ currentWindow: true, highlighted: true }),
  chrome.promise.tabs.query({ currentWindow: true }),
  getStashes(),
  getMessages()
]).then(init);
