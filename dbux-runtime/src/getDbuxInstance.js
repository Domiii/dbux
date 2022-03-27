/**
 * We use this file to avoid circular references by trying to import `index.js` directly.
 */

let dbuxInstance;

export default function getDbuxInstance() {
  return dbuxInstance;
}

export function _setDbuxInstance(_dbuxInstance) {
  dbuxInstance = _dbuxInstance;
}