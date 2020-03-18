const allObjects = [];

class Object {
  remember() {
    allObjects.push(this);
  }

  saySomething() {
    console.log(this, 'say something');
  }
}

const o1 = new Object();
const o2 = new Object();

o1.remember();
o2.remember();

o1.saySomething();
o1.saySomething();
o2.saySomething();
o1.saySomething();
o2.saySomething();
o2.saySomething();
o2.saySomething();
o2.saySomething();
