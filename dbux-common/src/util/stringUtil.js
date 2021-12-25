import truncate from 'lodash/truncate';


export function makeStringSimpleRenderable(s) {
  return s.replace(/\s+/g, ' ');
}

export function renderValueSimple(obj) {
  return makeStringSimpleRenderable(JSON.stringify(obj));
}


const ShortenMaxLength = 100;
const ShortenCfg = { length: ShortenMaxLength };

/**
 * @param {string} s 
 */
export function makeShortString(s, cfg = ShortenCfg) {
  return truncate(s.replace(/\s+/g, ' '), cfg);
}
