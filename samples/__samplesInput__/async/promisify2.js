new Promise(r => {
  setTimeout(r, 100);
}).then(() => {
  console.log('done');
});