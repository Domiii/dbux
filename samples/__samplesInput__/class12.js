var a, b, ba, bb;

class A { 
  x = ({ a = 3, b: { ba = 4, bb = 5 } = {} } = {});
}

console.log(new A().x, a, ba, bb);