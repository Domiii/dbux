new Promise(r =>{
  console.log('1234');
  r();
}).finally(() => {
  console.log('123');
})


new Promise((r, e) => {
  console.log(1);
  r();
}).then(() => {
  console.log(2);
}).then(() => {
  console.log(3);
}).finally(() => {
  console.log(4)
})