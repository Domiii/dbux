
function a(cb1, cb2) {
  setTimeout(() => {
    cb1(cb2);
  }, 2000);
  console.log('a');
}

function b(cb) {
  cb();
  console.log('b');
}

function c() {
  console.log('c');
}

a(b, c);
