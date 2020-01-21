import { newLogger } from 'dbux-common/src/log/logger';
import { initCodeDeco } from './codeDeco';

const { log, debug, warn, error: logError } = newLogger('CodeControl');

export function initCodeControl(context) {
  initCodeDeco(context);
}