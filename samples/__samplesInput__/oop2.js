const rememberedObjects = [];

class Object {
  get name() {
    return this.constructor.name;
  }

  remember() {
    rememberedObjects.push(this);
  }
  
  saySomething() {
    console.log(this.name, 'smth');
  }
}

const x = 3;

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
o1.saySomething();
o2.saySomething();
o2.saySomething();

console.log(rememberedObjects);
