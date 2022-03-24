
const exercises = [];

function add(cfgs) {
  for (let { number, problemName, label, fname, bugLine, noTests, ...moreProps } of cfgs) {
    const name = `${problemName}/${fname}`;
    fname += '.js';
    const fpath = `${problemName}/${fname}`;
    const exercise = {
      number,
      name,
      label: `${problemName} - ${label}`,
      assets: [
        fpath
      ],
      testFilePaths: [fpath],
      ...moreProps
    };

    if (!noTests) {
      exercise.assets.push(`${problemName}/tests.js`);
    }

    if (bugLine) {
      exercise.bugLocations = [
        {
          fileName: fpath,
          line: bugLine
        }
      ];
    }
    exercises.push(exercise);
  }
}

add([
  /** ########################################
   * firstDuplicate
   *  ######################################*/
  {
    problemName: 'firstDuplicate',
    label: 'for loop bug',
    fname: 'for-bad',
    bugLine: 13
  },
  {
    problemName: 'firstDuplicate',
    label: 'Array.find bug',
    fname: 'find-bad',
    bugLine: 14
  },

  /** ########################################
   * largestNumbersInArrays
   *  ######################################*/
  {
    problemName: 'largestNumbersInArrays',
    label: 'for loop bug',
    fname: 'for-bad',
    bugLine: 12
  },
  {
    problemName: 'largestNumbersInArrays',
    label: 'Array.map bug',
    fname: 'map-bad',
    bugLine: 10
  },

  /** ########################################
   * adjacentElementsProduct
   *  ######################################*/
  {
    problemName: 'adjacentElementsProduct',
    label: 'for loop bug',
    fname: 'for-bad',
    bugLine: 10
  },
  {
    problemName: 'adjacentElementsProduct',
    label: 'Array.reduce bug',
    fname: 'reduce-bad',
    bugLine: 13
  },

  /** ########################################
   * findLongestWordLength
   *  ######################################*/
  {
    problemName: 'findLongestWordLength',
    label: 'for loop bug',
    fname: 'for-bad',
    bugLine: 12
  },
  {
    problemName: 'findLongestWordLength',
    label: 'Array.reduce bug',
    fname: 'reduce-bad',
    bugLine: 11
  },

  /** ########################################
   * fibonacci
   *  ######################################*/
  {
    problemName: 'fibonacci',
    label: 'baseline',
    fname: 'plain-good'
  },

  /** ########################################
   * ghostlyMatrix
   *  ######################################*/
  {
    problemName: 'ghostlyMatrix',
    label: 'for loop bug',
    fname: 'for-bad',
    bugLine: 11
  },
  {
    problemName: 'ghostlyMatrix',
    label: 'Array.reduce bug',
    fname: 'reduce-bad',
    bugLine: 23
  },


]);

module.exports = exercises;
