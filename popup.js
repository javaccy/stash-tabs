'use strict';

function init() {
  let stashesDiv = document.getElementById("stash-list");

  let newStashNameInput = document.getElementById('new-stash-name');

  let renderStashes = function () {
    getStashes().then(stashes => {
      stashesDiv.innerHTML = '';
      let sortedStashIds = _.orderBy(Object.keys(stashes),
        stashId => stashes[stashId].timestamp, ['desc']);
      for (let stashId of sortedStashIds) {
        let stash = stashes[stashId];
        let stashDiv = document.createElement('div');

        let title = document.createElement('a');
        title.innerText = stash.name + ' (' + stash.tabs.length + ' ' +
          (stash.tabs.length == 1 ? 'tab' : 'tabs')  + ')';
        title.href = '';
        title.onclick = (e) => {
          openStash(stash);
          e.preventDefault();
        };
        stashDiv.appendChild(title);

        let renameButton = document.createElement('button');
        renameButton.innerText = 'Rename';
        renameButton.onclick = (e) => {
          chrome.extension.getBackgroundPage().renameStashPrompt(stashId,
            stash.name);
        };
        stashDiv.appendChild(renameButton);

        let topUpButton = document.createElement('button');
        topUpButton.innerText = 'Top up';
        topUpButton.onclick = (e) => {
          topUp(stashId);
        };
        stashDiv.appendChild(topUpButton);

        let deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = (e) => {
          deleteStash(stashId);
        };
        stashDiv.appendChild(deleteButton);

        let openAndDeleteButton = document.createElement('button');
        openAndDeleteButton.innerText = 'Open & delete';
        openAndDeleteButton.onclick = (e) => {
          deleteStash(stashId).then(() => openStash(stash));
        };
        stashDiv.appendChild(openAndDeleteButton);

        stashesDiv.appendChild(stashDiv);
      }
    });
  };

  newStashNameInput.onkeypress = function (e) {
    if (e.keyCode == '13') {
      // Enter pressed
      saveStash(newStashNameInput.value).then(() => {
        newStashNameInput.value = '';
      });
    }
  };

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if ('stashes' in changes) {
      renderStashes();
    }
  });

  renderStashes();
}

// Kick things off.
document.addEventListener('DOMContentLoaded', init);
