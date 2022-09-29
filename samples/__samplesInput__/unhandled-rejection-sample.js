process.on("unhandledRejection", (e) => {
  console.warn(`UNHANDLED PROMISE REJECTION`, e);
});

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
var p = sleep()
  .then(() => { return Promise.reject(new Error()); });

sleep(800)
  .then(() => p.catch((err) => console.error('CAUGHT', err)));
