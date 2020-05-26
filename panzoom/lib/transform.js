
// function Transform() {
  //   this.x = 0;
  //   this.y = 0;
  //   this.scale = 1;
  // }
  
  class Transform {
    constructor(el) {
      this.el = el;
      this._scale = 1;
    }
    get x() {
      return this.el.scrollLeft;
    }
    get y() {
      return this.el.scrollTop;
    }
    get scale() {
      return this._scale;
    }
    set x(x) {
      this.el.scrollLeft = x;
    }
    set y(y) {
      this.el.scrollTop = y;
    }
    set scale(scale) {
      this._scale = scale;
    }
  }
  
  module.exports =Transform;