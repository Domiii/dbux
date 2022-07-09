var i = 2;

loop: while(--i) {
  continue loop;
}

console.log('done');