#!/usr/bin/env node

// require('../src/cli')().parse(process.argv.slice(2));

// TODO: load some sort of `dbux-build.config.js`, also accept config via cli
// TODO: match config against dbux-cli's config
// TODO: webpack config options: srcFolders, moduleFolders, entries
// TODO: somehow convert that config to a webpack config and feed that to webpack

// More TODOs: real-world workflows?
// consider mocha-webpack: only re-runs tests of changed files - https://www.npmjs.com/package/mocha-webpack
//    (will need changes to Dbux to better cope with all that data; ignore positive tests?)
//    (by default: first run without Dbux, and only run failed tests with Dbux)