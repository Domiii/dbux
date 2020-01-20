import { initCodeDeco } from './codeDeco';

const log = (...args) => console.log('[dbux-code][codeControl]', ...args)

export { navToCode } from './codeNav.js'

export function initCodeControl() {
  initCodeDeco();
  log('Sucessfully "initCodeControl".')
}