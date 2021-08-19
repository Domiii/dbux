import fs from 'fs';
import path from 'path';

// const inFile = process.argv[2];
// const outFile = process.argv[3];

/**
 * @file Workaround (conversion script) to address lack of proper mocha JSON output.
 *
 * @see https://gist.github.com/Domiii/ff89e1427ee51193721abdbb08842e58
 * @see https://stackoverflow.com/questions/41380137/list-all-mocha-tests-without-executing-them/68829700#68829700
 */
export default function convertTestList(inFile, outFile) {
  inFile = path.resolve(inFile);
  outFile ||= path.resolve(path.dirname(inFile), 'testList.json');

  if (!inFile) {
    throw new Error(`First argument must be a file containing test output from a dry-run with the JSON formatter.`);
  }

  console.log(`Reading inFile ${inFile}...`);

  const text = fs.readFileSync(inFile).toString();
  // console.debug('[input]', text.length, text.substring(0, 300));

  const jsonObjectStrings = extractJsonObjects(text) || [];


  const jsonObjects = jsonObjectStrings.map((s) => {
    try {
      const obj = JSON.parse(s);
      return [null, obj];
    }
    catch (err) {
      return [err, null, s];
    }
  });

  const objects = jsonObjects.filter(([, obj]) => !!obj);
  // const nObj = objects.length;
  const parseErrors = jsonObjects.filter(([err]) => !!err);
  const nErr = parseErrors.length;
  console.log(`Found ${jsonObjects.length} JSON objects in file with ${nErr} parse errors.\nWriting results to file "${outFile}"...`);

  const finalJsonOutput = `[\n${objects
    .map(([, obj]) => JSON.stringify(obj, null, 2))
    .join(',\n')}
]`;
  for (const [, obj] of jsonObjects) {
    if (!obj) {
      continue;
    }
    fs.writeFileSync(outFile, finalJsonOutput);
  }

  console.log('  Finished writing file.');

  if (nErr) {
    const errorString = parseErrors.map(([err, , s], i) => `${i + 1}. ${err.message} (${s.substring(0, 100)})`)
      .join('\n ');
    console.error(`\n\nSome of the results could not be converted - ${nErr} parse error(s) encountered:\n ${errorString}`);
  }
};


// ###########################################################################
// utilities
// ###########################################################################

/**
 * 
 * @return {Array.<String>}
 */
function extractJsonObjects(s) {
  const re = /(\n\{(?:.|\n)*?\n\})/g;
  return s.match(re);
  // (() => {
  //   var text = '\n{a\n}\n{\n\nb\n}';
  //   console.log(text.match(re));
  // })();
}