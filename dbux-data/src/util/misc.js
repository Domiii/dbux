
export function locToString(loc) {
  return `${loc.start.line}:${loc.start.column}`;
}

export function deleteCachedLocRange(locObj) {
  delete locObj._range;
  delete locObj.start._pos;
  delete locObj.end._pos;
  return locObj;
}

