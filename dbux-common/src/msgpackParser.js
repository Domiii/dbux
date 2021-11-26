/**
 * TODO: move to own package
 * -> add `component-emitter`
 * 
 * @file Based on socket.io's own msgpack parser, but using a different library.
 * @see https://github.com/socketio/socket.io-msgpack-parser/blob/master/index.js
 * @see https://github.com/Domiii/dbux/issues/570
 */

/**
 * 
 */
// import { Encoder, Decoder } from '@msgpack/msgpack';
import {
  encode,
  decode,
  Encoder as MPEncoder,
  Decoder as MPDecoder,
  ExtensionCodec
} from '@msgpack/msgpack';
import Emitter from 'component-emitter';
import { newLogger } from '@dbux/common/src/log/logger';
import { startPrettyTimer } from '@dbux/common-node/src/util/timeUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('msgpack');

/** ###########################################################################
 * custom encoders
 *  #########################################################################*/

/**
 * @see https://github.com/msgpack/msgpack-javascript#handling-bigint-with-extensioncodec
 */
const CUSTOM_ENCODER = 0;

const extensionCodec = new ExtensionCodec();
extensionCodec.register({
  type: CUSTOM_ENCODER,
  encode: (input) => {
    const t = typeof input;
    switch (t) {
      case 'symbol':
        // convert to string
        return encode(input.toString());
      default:
        // don't return anything -> so the default mechanisms can take care of it

        // warn(`[ENCODE] unknown typeof "${t}" (auto-converting to string): ${JSON.stringify(input)}`);
        // return encode(input.toString());
        return undefined;
    }
  },
  decode: (data) => {
    return decode(data);
  },
});

const encoder = new MPEncoder(extensionCodec);
const decoder = new MPDecoder(extensionCodec);

/** ###########################################################################
 * parser implementation
 *  #########################################################################*/

exports.protocol = 5;

/**
 * Packet types (see https://github.com/socketio/socket.io-protocol)
 */

var PacketType = (exports.PacketType = {
  CONNECT: 0,
  DISCONNECT: 1,
  EVENT: 2,
  ACK: 3,
  CONNECT_ERROR: 4,
});

var isInteger =
  Number.isInteger ||
  function (value) {
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value
    );
  };

var isString = function (value) {
  return typeof value === 'string';
};

var isObject = function (value) {
  return Object.prototype.toString.call(value) === '[object Object]';
};

function Encoder() { }

function printTimer(what, timer, buffer) {
  if (buffer.length > 1e8) {
    timer.print(debug, `${what} (not small buffer): ${Math.round(buffer.length / 1000).toLocaleString('en-us')} kb`);
  }
}

Encoder.prototype.encode = function (packet) {
  // warn(`ENCODE`/* , packet */);

  const timer = startPrettyTimer();
  const encoded = [encoder.encode(packet)];
  // const s = timer.getFinalTimeSeconds();
  printTimer('ENCODE', timer, encoded[0]);

  return encoded;
};

function Decoder() { }

Emitter(Decoder.prototype);

Decoder.prototype.add = function (buffer) {
  // warn(`DECODING...`);
  let decoded;
  try {
    const timer = startPrettyTimer();
    decoded = decoder.decode(buffer);
    // const s = timer.getFinalTimeSeconds();
    printTimer('DECODE', timer, buffer);

    this.checkPacket(decoded);
    this.emit('decoded', decoded);
  }
  catch (err) {
    logError(`DECODE error - Result: ${JSON.stringify(decoded)}`, err);
  }
};

function exists(x) {
  return x !== null && x !== undefined;
}

function isDataValid(decoded) {
  switch (decoded.type) {
    case PacketType.CONNECT:
      return !exists(decoded.data) || isObject(decoded.data);
    case PacketType.DISCONNECT:
      return !exists(decoded.data);
    case PacketType.CONNECT_ERROR:
      return isString(decoded.data) || isObject(decoded.data);
    default:
      return Array.isArray(decoded.data);
  }
}

Decoder.prototype.checkPacket = function (decoded) {
  var isTypeValid =
    isInteger(decoded.type) &&
    decoded.type >= PacketType.CONNECT &&
    decoded.type <= PacketType.CONNECT_ERROR;
  if (!isTypeValid) {
    throw new Error('invalid packet type: ' + decoded.type);
  }

  if (!isString(decoded.nsp)) {
    throw new Error('invalid namespace');
  }

  if (!isDataValid(decoded)) {
    throw new Error('invalid payload');
  }

  var isAckValid = !exists(decoded.id) || isInteger(decoded.id);
  if (!isAckValid) {
    throw new Error('invalid packet id');
  }
};

Decoder.prototype.destroy = function () { };

export default {
  Encoder,
  Decoder
};
