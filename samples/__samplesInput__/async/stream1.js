const fs = require('fs');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * @see https://nodejs.org/api/stream.html#stream_writable_streams
 */
function writeData(callback = () => { }) {
  var writer = fs.createWriteStream('./test-data.json');
  let i = 5;
  const data = 'hi\n';
  const encoding = 'utf8';
  _writeChunk();
  function _writeChunk() {
    let noDrainNeeded = true;
    i--;
    if (i === 0) {
      writer.write(data, encoding, callback);
    } else {
      /** @see https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback */
      noDrainNeeded = writer.write(data, encoding, _writeChunk);
    }
    if (!noDrainNeeded) {
      writer.once('drain', _writeChunk);
    }
  }
}


(async function main() {
  writeData();
})();