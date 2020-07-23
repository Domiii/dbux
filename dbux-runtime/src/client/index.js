import { logInternalError } from '@dbux/common/src/log/logger';
import Client from './Client';


/**
 * @type {Client}
 */
let client;

export function getDefaultClient() {
  return client;
}

export function initClient() {
  if (client) {
    logInternalError('initClient called more than once');
  }
  client = new Client();
  return client;
}