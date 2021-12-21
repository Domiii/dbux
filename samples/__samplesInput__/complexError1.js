const o = {
  init() {
    this.f(); // f does not exist
    this.reporter = console.error.bind(console);
  },

  report(err) {
    this.reporter(err);
  }
};

try {
  o.init();
}
catch (err) {
  o.report(err);
}
