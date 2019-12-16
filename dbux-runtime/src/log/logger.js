
const errors = [];

export function logError(...args) {
  const err = ['[DBUX INTERNAL ERROR]', ...args];
  errors.push(err);
  console.error(...err);
}

export function getErrors() {
  return errors;
}

export function getErrorCount() {
  return errors.length;
}

export function hasErrors() {
  return !!errors.length;
}

export function getLastError() {
  return errors[errors.length-1];
}