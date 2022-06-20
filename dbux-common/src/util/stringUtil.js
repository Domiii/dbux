import truncate from 'lodash/truncate';


export function makeStringSimpleRenderable(s) {
  return s.replace(/\s+/g, ' ');
}

export function renderValueSimple(obj) {
  return makeStringSimpleRenderable(JSON.stringify(obj));
}


const DefaultMaxLength = 100;
const DefaultTruncateCfg = { length: DefaultMaxLength };
const ShortMaxLength = 30;
const ShortTruncateCfg = { length: ShortMaxLength };

/**
 * @param {string} s 
 */
export function truncateStringDefault(s, cfg = DefaultTruncateCfg) {
  return truncate(s.replace(/\s+/g, ' '), cfg);
}
/**
 * @param {string} s 
 */
export function truncateStringShort(s, cfg = ShortTruncateCfg) {
  return truncate(s.replace(/\s+/g, ' '), cfg);
}
