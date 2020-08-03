#!/usr/bin/env node

require('./link-dependencies');

const dbuxRegister = require('../dist/dbuxRegister').default;

dbuxRegister({
  // WARNING: this MUST be vanilla, or else required plugins must be installed locally, since *babel plugins CANNOT be aliased* because babel plugin lookup does not use the standard resolve function
  
  vanilla: true
});