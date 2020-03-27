function ouch() {
  throw new Error('ouch!');
}

function main1() {
  console.log('[main1]', 'start');
  ouch();
  console.log('[main1]', 'end');
}

function main2() {
  console.log('[main2]', 'start');
  return ouch();
}

try {
  main1();
}
catch (err) { }

try {
  main2();
}
catch (err) { }