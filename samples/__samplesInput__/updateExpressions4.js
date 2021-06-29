class A {
  #q = 1;

  f() {
    console.log(
      this.#q,
      ++this.#q,
      this.#q++,
      this.#q = 100,
      --this.#q
    );
  }
}

new A().f();
