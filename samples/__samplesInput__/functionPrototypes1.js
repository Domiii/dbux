function Model() {
  this.name = 'model';
}

Model.prototype.getName = function(){
  return this.name;
}

console.log(Model.prototype);