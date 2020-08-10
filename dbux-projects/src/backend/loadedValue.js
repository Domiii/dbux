export default function loadedValue(value) {
  // make sure given value is never NotLoaded (i.e. undefined)
  return value === undefined ? null : value;
}