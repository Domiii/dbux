import path from 'path';

export function getDependencyRoot() {
  let dependencyRoot;
  if (process.env.NODE_ENV === 'development') {
    // link dbux dependencies to monorepo root development folder
    // NOTE: in monorepo, dependencies are hoisted to root
    // NOTE: in monorepo, packages are also linked to root `node_modules` folder
    dependencyRoot = process.env.DBUX_ROOT;

    // let dbuxDepNames;
    // const dbuxPackagePattern = /@dbux\//;
    // [dbuxDepNames, depNames] = partition(depNames, dep => dbuxPackagePattern.test(dep));
    // dbuxDepNames = dbuxDepNames.map(name => name.match(/@dbux\/(.*)/)[1]);

    // linkDependencies(dbuxDepNames.map(name =>
    //   [`@dbux/${name}`, path.join(process.env.DBUX_ROOT, `dbux-${name}`)]
    // ));
  }
  else {
    // production mode -> `@dbux/cli` stand-alone installation
    // NOTE: in this case, we find ourselves in 
    //    `nodeModulesParent/node_modules/@dbux/cli`  (so we want to go up 3) or...
    //    `ACTUAL_DBUX_ROOT/dbux-cli`                 (so we want to go up 2. NOTE: DBUX_ROOT won't be set in prod though)
    const dbuxPathMatch = __dirname.match(/(.*?(dbux-cli|@dbux[\\/]cli))/);
    const dbuxCliRoot = dbuxPathMatch?.[1];
    const dbuxCliFolderName = dbuxPathMatch?.[2];
    const relativePath = path.join('..', dbuxCliFolderName !== 'dbux-cli' ? '../..' : '');
    dependencyRoot = path.resolve(dbuxCliRoot, relativePath);
  }
  return dependencyRoot;
}