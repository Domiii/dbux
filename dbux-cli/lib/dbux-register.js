#!/usr/bin/env node

require('./_dbux-register-self');

const dbuxRegister = require('../dist/dbuxRegister').default;

dbuxRegister({});