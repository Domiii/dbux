const { queue } = require('./lib');

const createTask = () => {
  return {
    doIt: () => {
      return new Promise((r) => setTimeout(r, 2000));
    }
  };
};

const createQueueAndProcess = async () => {
  const q = queue(async (task, callback) => {
    await task.doIt();
    callback();
    console.log("task done");
  });

  //Comment the empty array push line below
  // and see the issue go away
  q.push([]);
  q.push([createTask()]);

  await q.drain();
  console.log("all tasks completed");
};

createQueueAndProcess();
