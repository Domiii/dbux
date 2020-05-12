function renderMessage(msg) {
  console.log(msg);
}

class Animal {
  speak(msg) {
    renderMessage(`${this.constructor.name} says: ${msg}`);
  }
}

class Duck extends Animal {
  speak() {
    super.speak('quack quack');
  }
}

class Cow extends Animal {
  speak() {
    super.speak('mooo');
  }
}

class Dog extends Animal {
  speak() {
    super.speak('旺旺');
  }
}

const AnimalClasses = [
  Duck,
  Cow,
  Dog
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


function main() {
  const n = 10;
  const animals = Array(n).fill(0).map(i => {
    const AnimalClass = pickRandom(AnimalClasses);
    return new AnimalClass();
    // return new AnimalClasses[Math.floor(Math.random() * AnimalClasses.length)]();
  });

  for (const animal of animals) {
    animal.speak();
  }
}

main();
