
function instrumentAll(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && v.prototype) {
      if (v.prototype.addEventListener) {
        console.log(k, v);
      }
    }
  }
}

instrumentAll(window);