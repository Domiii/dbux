import ThemeMode from './ThemeMode';

/**
 * Generate a unique value between 0 and 359, for any `i`
 */
function getUniqueAngle(i) {
  let color = 0;
  let base = 180;
  while (i !== 0) {
    color += (i % 2) * base;
    i = Math.floor(i / 2);
    base /= 2;
  }
  return color;
}

export function getStaticContextColor(themeMode, staticContextId) {
  return `hsl(${getUniqueAngle(staticContextId)},35%,${ThemeMode.is.Dark(themeMode) ? 30 : 95}%)`;
}