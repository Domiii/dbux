#!/usr/bin/env node

require('./dbux-register-self');

const dbuxRegister = require('../dist/dbuxRegister').default;

dbuxRegister({});