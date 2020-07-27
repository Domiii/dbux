#!/usr/bin/env node

require('./_dbux-register-self');

const dbuxRegister = require('../src/dbuxRegister').default;

dbuxRegister();