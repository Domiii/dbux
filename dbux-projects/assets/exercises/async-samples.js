
const exercises = [];

function add(cfgs) {
  for (let { number, problemName, label, fname, ...moreProps } of cfgs) {
    const name = `${problemName}/${fname}`;
    // const fpath = `${problemName}/${fname}.js`;
    const fpath = `${fname}.js`;
    const exercise = {
      number,
      name,
      label: `${problemName} - ${label}`,
      // assets: [
      //   fpath
      // ],
      testFilePaths: [fpath],
      ...moreProps
    };
    exercises.push(exercise);
  }
}

add([
  /** ########################################
   * ts-async-generator
   *  ######################################*/
  {
    problemName: 'ts-async-generator',
    label: 'ts-async-generator1',
    fname: 'ts-async-generator1'
  }
]);

module.exports = exercises;
