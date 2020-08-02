// link + expose all depdencies
require('../dist/linkOwnDependencies');

// make sure, dbux' src/ files get babeled upon require
require('./dbux-register-self');