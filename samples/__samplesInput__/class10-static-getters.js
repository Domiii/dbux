function f(...args) {
  console.log('f', ...args)
}

class A {
  static get styles() {
    return f`
      :host {
      }
    `;
  }
}

new A();
A.styles