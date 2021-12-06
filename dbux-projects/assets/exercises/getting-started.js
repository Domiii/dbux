
const exercises = [];

function add(cfgs) {
  for (const { number, problemName, label, fname, bugLine } of cfgs) {
    const fpath = `${problemName}/${fname}`;
    exercises.push({
      number,
      label: `${problemName} - ${label}`,
      assets: [
        fpath,
        `${problemName}/tests.js`
      ],
      bugLocations: [
        {
          fileName: fpath,
          line: bugLine
        }
      ]
    });
  }
}

add([
  /** ########################################
   * firstDuplicate
   *  ######################################*/
  {
    problemName: 'firstDuplicate',
    label: 'for loop bug',
    fname: 'for-bad.js',
    bugLine: 10
  },
  {
    problemName: 'firstDuplicate',
    label: 'Array.find bug',
    fname: 'find-bad.js',
    bugLine: 14
  },

  /** ########################################
   * largestNumbersInArrays
   *  ######################################*/
  {
    problemName: 'largestNumbersInArrays',
    label: 'for loop bug',
    fname: 'for-bad.js',
    bugLine: 12
  },
  {
    problemName: 'largestNumbersInArrays',
    label: 'Array.map bug',
    fname: 'map-bad.js',
    bugLine: 10
  },


]);

module.exports = exercises;
