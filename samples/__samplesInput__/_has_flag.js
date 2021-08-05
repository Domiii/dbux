import process from 'process'; // eslint-disable-line node/prefer-global/process

function hasFlag(flag, argv = process.argv) {
  const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf('--');
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}

let flagForceColor;
if (hasFlag('no-color') ||
  hasFlag('no-colors') ||
  hasFlag('color=false') ||
  hasFlag('color=never')) {
  flagForceColor = 0;
} else if (hasFlag('color') ||
  hasFlag('colors') ||
  hasFlag('color=true') ||
  hasFlag('color=always')) {
  flagForceColor = 1;
}

console.log(flagForceColor);