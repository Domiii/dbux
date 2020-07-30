#!/usr/bin/env node

require('./_dbux-register-self');

const dbuxRegister = require('../dist/dbuxRegister').default;

if (process.env.NODE_ENV === 'development') {
  // TODO: add all of dbux/cli's node_modules via `module-alias`
}

dbuxRegister({});