export function isMac() {
  return navigator.platform.toLowerCase().startsWith('mac');
}

export function getPlatformModifierKeyString() {
  return isMac() ? '⌘' : 'CTRL';
}
