import { newLogger } from '@dbux/common/src/log/logger';
import Client from './Client';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Client');

/**
 * @type {Client}
 */
let client;

export function getDefaultClient() {
  return client;
}

export function initClient() {
  if (client) {
    logError('initClient called more than once');
  }
  client = new Client();
  return client;
}