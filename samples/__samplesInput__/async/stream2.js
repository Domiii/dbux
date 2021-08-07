const fs = require('fs');

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
    i--;
    f();
    if (i === 0) {
      // done!
      writer.write(data, encoding, callback);
    } else {
      // more to come
      /** @see https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback */
      writer.write(data, encoding, _writeChunk);
    }
  }
}

async function f() {
  await 0;
  await 0;
}


(async function main() {
  writeData();
})();