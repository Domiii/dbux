function ouch(x) {
  throw new Error('ouch! ' + x);
}

function main1(x) {
  console.log('[main1]', 'start', x);
  ouch(x);
  console.log('[main1]', 'end');
}

function main2() {
  console.log('[main2]', 'start');
  return ouch();
}

try {
  main1(1);
}
catch (err) { }

try {
  main2();
}
catch (err) { }

/**
 * TODO: test...
 * 
 * -> body-less lambda expression
 */