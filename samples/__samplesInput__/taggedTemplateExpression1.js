function f(strings, ...args) {
  console.log('[tte]', strings, ...args);
  return 'hi';
}

f`a ${1} b ${2}`;