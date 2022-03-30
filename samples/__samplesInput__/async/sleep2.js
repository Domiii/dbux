import sleep from '../util/sleep';


(async function () {
  for (let i = 0; i < 20; ++i) {
    await sleep(i);
  }
})();