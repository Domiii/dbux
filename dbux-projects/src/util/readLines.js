const fs = require('fs');
const readline = require('readline');

export default async function readLines(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const fileReader = readline.createInterface({ input: fileStream });
  return await new Promise((r) => {
    const lines = [];
    fileReader.on('line', (l) => {
      lines.push(l);
    });

    fileReader.on('close', () => {
      r(lines);
    });
  });
}