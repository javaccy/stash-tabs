// Prompt is displayed by the background page because if the popup page displays
// it, the prompt gets immediately closed (attempt to diplay prompt closes the
// popup and this in turn dismisses the prompt).
window.renameStashPrompt = function (stashId, currentName) {
  let newName = prompt('Enter new name:', currentName);
  if (newName !== null) {
    return renameStash(stashId, newName);
  }
};
