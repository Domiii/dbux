#!/usr/bin/env node

// require('./dbux-register-self');
require('./link-self');

const dbuxRegister = require('../dist/dbuxRegister').default;

dbuxRegister({});