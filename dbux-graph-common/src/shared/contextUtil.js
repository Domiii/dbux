import EmptyObject from '@dbux/common/src/util/EmptyObject';
import ThemeMode from './ThemeMode';

/**
 * Generate a unique value between 0 and 359, for any `i`
 */
export function getStructuredRandomAngle(i, start = 0) {
  let color = start;
  let base = 180;
  while (i !== 0) {
    color += (i % 2) * base;
    i = Math.floor(i / 2);
    base /= 2;
  }
  return color;
}

/**
 * Generate pseudo-random color. Attempts to maximize distance between neighboring input seeds.
 * 
 * @param {number} i input seed
 */
export function makeStructuredRandomColor(themeMode, i, { start = 0, sat, bland = false, highContrastMode = false } = EmptyObject) {
  const hue = getStructuredRandomAngle(i, start);
  let saturation = sat || (bland ? 5 : 35);
  let lightness = ThemeMode.is.Dark(themeMode) ? 30 : 65;

  if (highContrastMode) {
    saturation = 80;
    lightness = 80;
  }

  return `hsl(${hue},${saturation}%,${lightness}%)`;
}