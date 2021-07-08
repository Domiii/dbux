/**
 * @file parallel-nested-await0.js
 * `fB` and `gB` execute in the same "physical run" (requires inserting "virtual runs").
 */

function f() { 'fA'; await 0; 'fB'; }
function g() { 'gA'; await 0; 'gB'; }

f();
g();