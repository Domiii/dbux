import { isMac } from './platformUtil';

export function isMouseEventPlatformModifierKey(evt) {
  if (isMac()) {
    return evt.metaKey;
  }
  else {
    return evt.ctrlKey;
  }
}