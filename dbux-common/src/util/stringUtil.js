
export function makeStringSimpleRenderable(s) {
  return s.replace(/\s+/g, ' ');
}

export function renderValueSimple(obj) {
  return makeStringSimpleRenderable(JSON.stringify(obj));
}
