const fs = require('fs');
const readline = require('readline');

export default async function getFirstLine(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const fileReader = readline.createInterface({ input: fileStream });
  const firstLine = await new Promise((r) => {
    fileReader.on('line', (l) => {
      fileReader.close();
      r(l);
    });
  });
  fileStream.close();
  return firstLine;
}