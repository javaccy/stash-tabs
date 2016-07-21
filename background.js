window.renameStashPrompt = function (stashId, currentName) {
  let newName = prompt('Enter new name:', currentName);
  if (newName !== null) {
    return renameStash(stashId, newName);
  }
};
