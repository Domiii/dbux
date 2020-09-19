export function getDependencyRoot() {
  let nodeModulesParent;
  if (process.env.NODE_ENV === 'development') {
    // link dbux dependencies to monorepo root development folder
    // NOTE: in monorepo, dependencies are hoisted to root
    // NOTE: in monorepo, packages are also linked to root `node_modules` folder
    nodeModulesParent = process.env.DBUX_ROOT;

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
    const relativePath = path.join('..', dbuxCliFolderName !== 'dbux-cli' ? '../..' : '');
    nodeModulesParent = path.resolve(dbuxCliRoot, relativePath);
  }

}