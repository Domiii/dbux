const ValidCodes = new Set([]);
let currentCode = '';

/**
 * @param {string} code 
 * @returns {boolean}
 */
export function isValidCode(code) {
  return ValidCodes.has(code);
}

export function activateWorkshopSession(code) {
  if (isValidCode(code)) {
    currentCode = code;
  }
  else {
    throw new Error('Invalid workshop code');
  }
}

export function isWorkshopSessionActive() {
  return !!currentCode;
}

export function getCurrentWorkshopCode() {
  return currentCode;
}
