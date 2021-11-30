
function obj2String(obj) {
  console.log('obj', obj);

  let s = JSON.stringify(obj);
  s = s?.replace(/\s+/g, ' ');
  console.log('  ', s);
}

obj2String(['hi']);
obj2String(null);
