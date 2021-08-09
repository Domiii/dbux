var EE = require('events');

const emitter = process.__signal_exit_emitter__ = new EE();

console.warn('emitter', !!(emitter.setMaxListeners instanceof Function), emitter);