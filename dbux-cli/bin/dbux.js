// #!/usr/bin/env node
// 'use strict'

// const process = require('process');
// const processOnSpawn = require('process-on-spawn')

// process.env.BABEL_DISABLE_CACHE = '1'
// //Object.assign(process.env, env)

// const envToCopy = {}

// /**
//  * Copy all relevant environment variables, as custom spawnage might
//  * cause some to be lost otherwise.
//  * @see https://github.com/nodejs/node/issues/12986
//  */
// processOnSpawn.addListener(({ env: processEnv }) => {
//   Object.assign(processEnv, envToCopy)
// })

// /**
//  * Inject dbux own libraries
//  */
// const requireModules = [
//   require.resolve('../lib/register-env.js'),
//   ...nyc.require.map(mod => resolveFrom.silent(nyc.cwd, mod) || mod)
// ]

// /**
//  * node-preload makes sure to pre-load given modules for every child process
//  * @see https://github.com/cfware/node-preload/blob/master/hook-spawn.js
//  */
// const preloadList = require('node-preload')
// preloadList.push(
//   ...requireModules,
//   require.resolve('../lib/wrap.js')
// )

// requireModules.forEach(mod => {
//   require(mod)
// });


// /**
//  * Start running the child process; make sure exitCode is maintained correctly.
//  */
// process.exitCode = 0
// foreground(childArgs, async () => {
//   const mainChildExitCode = process.exitCode

//   try {
//     await nyc.writeProcessIndex()

//     nyc.maybePurgeSourceMapCache()
//     if (argv.checkCoverage) {
//       await nyc.checkCoverage({
//         lines: argv.lines,
//         functions: argv.functions,
//         branches: argv.branches,
//         statements: argv.statements
//       }, argv['per-file']).catch(suppressEPIPE)
//       process.exitCode = process.exitCode || mainChildExitCode
//     }

//     if (!argv.silent) {
//       await nyc.report().catch(suppressEPIPE)
//     }
//   } catch (error) {
//     process.exitCode = process.exitCode || mainChildExitCode || 1;
//     console.error(error.message);
//   }
// });