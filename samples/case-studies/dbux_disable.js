function log(...args) {
  console.log(...args);
}

const delay = 200;

let i = 0;
let timer;
function runTask(n) {
  return new Promise(r => {
    const task = () => {
      log(++i);
      if (i < n) {
        setTimeout(task, delay);
      }
      else {
        r();
      }
    };

    setTimeout(task, delay);
  });
}


runTask(3).
  then(() => {
    __dbux__.incDisabled();
    return runTask(6);
  }).
  then(() => {
    __dbux__.decDisabled();
    return runTask(9);
  });

