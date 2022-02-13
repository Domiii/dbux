/**
 * @file
 * NOTE: all events go through the EventEmitter class, which we have patched in order to
 *    keep track of event handler identity.
  ```js
  const EventEmitter = require('events');
  const { Writable } = require('stream');
  EventEmitter.prototype.on = () => 123;
  const myStream = new Writable();
  console.log(myStream instanceof EventEmitter, myStream.on() === 123);
  ```
 * @see https://nodejs.org/api/events.html
 */

import { EventEmitter } from 'events';

/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
export default function patchNodeEvents(runtimeMonitor) {
  // EventEmitter
}