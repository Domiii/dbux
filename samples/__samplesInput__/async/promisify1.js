new Promise(r => {
  setTimeout(() => {
    console.log(1);
    r();
  }, 100);
}).then(() => {
  console.log('done');
});
